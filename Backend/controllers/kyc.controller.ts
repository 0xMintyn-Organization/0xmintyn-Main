import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user.mode';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/errorHandler';
import { createVerificationLink, DiditWebhookEvent } from '../services/didit.service';

export const getKycStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('KYC Status Request - User:', (req as any).user?._id);
    const userId = (req as any).user?._id;
    if (!userId) {
      console.log('KYC Status: No user ID found');
      return next(new ErrorHandler('User not found', 401));
    }

    const user = await UserModel.findById(userId).select('kycStatus kycData email firstName lastName');
    if (!user) {
      console.log('KYC Status: User not found in DB');
      return next(new ErrorHandler('User not found', 404));
    }

    // Get status - handle both new schema and old documents without kycStatus
    const userKycStatus = (user as any).kycStatus || 'not_started';
    const userKycData = (user as any).kycData || null;
    
    console.log('KYC Status: Success', { 
      userId: user._id,
      status: userKycStatus,
      hasKycData: !!userKycData,
      kycDataKeys: userKycData ? Object.keys(userKycData) : []
    });
    
    return res.status(200).json({
      ok: true,
      data: {
        status: userKycStatus,
        details: userKycData,
      },
    });
  } catch (error: any) {
    console.error('KYC Status Error:', error);
    return next(new ErrorHandler(error.message || 'Failed to get KYC status', 500));
  }
});

export const startKyc = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('KYC Start Request - User:', (req as any).user?._id);
    const userId = (req as any).user?._id;
    if (!userId) {
      console.log('KYC Start: No user ID found');
      return next(new ErrorHandler('User not found', 401));
    }

    const user = await UserModel.findById(userId).select('email kycData kycStatus firstName lastName');
    if (!user) {
      console.log('KYC Start: User not found in DB');
      return next(new ErrorHandler('User not found', 404));
    }

    // Call Didit to create a verification session
    // According to Didit docs: POST /v2/session/ returns { url, session_id, ... }
    const serverUrl = process.env.SERVER_URL || 'http://localhost:8000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // Include user ID in callback URL so webhook can find the user
    const callbackUrl = `${serverUrl}/api/v1/kyc/webhook?userId=${userId}`;
    // Redirect URL for user to return to frontend after verification
    const redirectUrl = `${frontendUrl}/exchange?kycStatus=pending_review`;
    
    const diditResponse = await createVerificationLink({
      externalUserId: String(userId),
      email: user.email,
      callbackUrl: callbackUrl,
      redirectUrl: redirectUrl, // User redirect after verification
      // TODO: You need to create a workflow in Didit Console and add the workflow_id here
      // workflowId: 'your-workflow-id-from-didit-console',
    });

    // Didit returns: { url: "...", session_id: "...", id: "...", ... }
    const verificationUrl = diditResponse?.url || null;
    const verificationId = 
      diditResponse?.session_id || 
      diditResponse?.id || 
      diditResponse?.verificationSessionId ||
      diditResponse?.data?.session_id ||
      diditResponse?.data?.id ||
      null;

    console.log('Didit Response (Full):', JSON.stringify(diditResponse, null, 2));
    console.log('Didit Response (Extracted):', { verificationUrl, verificationId, userId: String(userId) });

    if (!verificationId) {
      console.warn('KYC Start: No verificationId/session_id in Didit response!');
    }

    user.kycStatus = 'pending_review';
    user.kycData = {
      ...(user.kycData || {}),
      fullName: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim(),
      submittedAt: new Date(),
      reviewedAt: null,
      rejectionReason: undefined,
      idType: 'unknown',
      idNumber: '',
      country: '',
      verificationId: verificationId, // Store session_id to find user in webhook
      diditSessionId: verificationId, // Also store as diditSessionId for clarity
      userId: String(userId), // Also store user ID for fallback lookup
    };

    await user.save();

    // Verify the save worked
    const savedUser = await UserModel.findById(userId).select('kycStatus kycData');
    console.log('KYC Start: Success - User saved with verificationId:', verificationId, 'for user:', String(userId));
    console.log('KYC Start: Verification - Saved status:', savedUser?.kycStatus, 'Data:', savedUser?.kycData);
    return res.status(200).json({
      ok: true,
      data: {
        status: user.kycStatus,
        details: user.kycData,
        verificationUrl,
        verificationId,
      },
    });
  } catch (error: any) {
    console.error('KYC Start Error:', error);
    return next(new ErrorHandler(error.message || 'Failed to start KYC', 500));
  }
});

// Webhook endpoint for Didit callbacks
// Didit sends GET requests with query parameters: ?verificationSessionId=...&status=...
export const diditWebhook = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    console.log('Didit Webhook Received:', {
      method: req.method,
      query: req.query,
      body: req.body,
    });

    // Didit sends GET with query params: verificationSessionId, status, and possibly vendor_data (user ID)
    const verificationSessionId = (req.query.verificationSessionId || req.body?.verificationSessionId || req.body?.session_id) as string;
    const status = (req.query.status || req.body?.status) as string;
    const reason = (req.query.reason || req.body?.reason) as string;
    // vendor_data is the user ID we sent when creating the session
    const vendorData = (req.query.vendor_data || req.body?.vendor_data || req.query.vendorData || req.body?.vendorData) as string;
    // userId from callback URL parameter (we added this to the callback URL)
    const userIdFromCallback = (req.query.userId || req.body?.userId) as string;
    
    console.log('Didit Webhook Params:', {
      verificationSessionId,
      status,
      reason,
      vendorData,
      allQuery: req.query,
      allBody: req.body,
    });

    if (!verificationSessionId || !status) {
      console.error('Didit Webhook: Missing verificationSessionId or status', { verificationSessionId, status });
      return res.status(400).json({ ok: false, message: 'Missing verificationSessionId or status' });
    }

    let user = null;

    // Method 1: Try to find user by userId from callback URL (most reliable - we added it to the URL)
    if (userIdFromCallback) {
      try {
        user = await UserModel.findById(userIdFromCallback);
        if (user) {
          console.log('Didit Webhook: ✅ Found user by userId from callback URL:', userIdFromCallback);
        } else {
          console.log('Didit Webhook: ❌ User not found by userId from callback:', userIdFromCallback);
        }
      } catch (err: any) {
        console.log('Didit Webhook: userId from callback is not a valid ObjectId:', userIdFromCallback, err.message);
      }
    }

    // Method 2: Try to find user by vendor_data (user ID) - this is what we sent to Didit
    if (!user && vendorData) {
      try {
        user = await UserModel.findById(vendorData);
        if (user) {
          console.log('Didit Webhook: ✅ Found user by vendor_data (user ID):', vendorData);
        } else {
          console.log('Didit Webhook: ❌ User not found by vendor_data:', vendorData);
        }
      } catch (err: any) {
        console.log('Didit Webhook: vendor_data is not a valid ObjectId:', vendorData, err.message);
      }
    }
    
    if (!user && !vendorData && !userIdFromCallback) {
      console.log('Didit Webhook: ⚠️ No userId or vendor_data in webhook - will try session ID lookup');
    }

    // Method 2: If not found by vendor_data, try to find by verificationSessionId (stored in kycData)
    if (!user && verificationSessionId) {
      user = await UserModel.findOne({
        $or: [
          { 'kycData.verificationId': verificationSessionId },
          { 'kycData.diditSessionId': verificationSessionId },
        ],
      });
      if (user) {
        console.log('Didit Webhook: ✅ Found user by verificationSessionId:', verificationSessionId);
      } else {
        console.log('Didit Webhook: ❌ User not found by verificationSessionId:', verificationSessionId);
      }
    }

    // Method 3: If still not found, search all users with pending KYC to see what session IDs we have
    if (!user) {
      const pendingUsers = await UserModel.find({
        kycStatus: 'pending_review',
        'kycData.verificationId': { $exists: true }
      }).select('_id email kycData.verificationId kycData.diditSessionId kycData.userId').limit(5);
      console.log('Didit Webhook: 🔍 Sample pending KYC users:', JSON.stringify(pendingUsers, null, 2));
      console.log('Didit Webhook: 🔍 Looking for session:', verificationSessionId);
    }

    if (!user) {
      console.error('Didit Webhook: User not found for session', verificationSessionId);
      
      // Log all users with kycData for debugging
      const usersWithKyc = await UserModel.find({ 
        kycData: { $exists: true },
        'kycData.verificationId': { $exists: true }
      }).select('_id email kycData.verificationId kycData.diditSessionId').limit(10);
      console.log('Didit Webhook: Users with KYC data:', JSON.stringify(usersWithKyc, null, 2));
      console.log('Didit Webhook: Looking for session ID:', verificationSessionId);
      
      return res.status(404).json({ 
        ok: false, 
        message: `User not found for webhook session: ${verificationSessionId}. Make sure the session ID was stored when KYC was started.` 
      });
    }

    updateUserKycStatus(user, status, reason);
    await user.save();

    // Verify the save worked
    const updatedUser = await UserModel.findById(user._id).select('kycStatus kycData');
    console.log('Didit Webhook: Successfully updated user', user._id);
    console.log('Didit Webhook: Verification - Saved status:', updatedUser?.kycStatus, 'Data:', updatedUser?.kycData);
    
    // Redirect user back to frontend exchange page after webhook processing
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/exchange?kycStatus=${status}&userId=${user._id}`;
    
    // Redirect to frontend instead of returning JSON
    return res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Didit Webhook Error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// Helper function to update user KYC status
function updateUserKycStatus(user: any, status: string, reason?: string) {
  // Map Didit statuses to our statuses
  // Handle URL-encoded statuses (In+Review becomes "In Review")
  const normalizedStatus = status?.replace(/\+/g, ' ') || status;
  
  const statusMap: Record<string, 'verified' | 'rejected' | 'pending_review'> = {
    'Approved': 'verified',
    'Declined': 'rejected',
    'Rejected': 'rejected',
    'In Review': 'pending_review',
    'In+Review': 'pending_review', // URL encoded
    'Pending': 'pending_review',
    'Pending Review': 'pending_review',
  };

  const mappedStatus = statusMap[normalizedStatus] || statusMap[status] || 'pending_review';
  
  console.log('Didit Webhook: Mapping status', status, '->', mappedStatus);

  user.kycStatus = mappedStatus;
  user.kycData = {
    ...(user.kycData || {}),
    reviewedAt: new Date(),
    rejectionReason: mappedStatus === 'rejected' ? (reason || 'Declined') : undefined,
  };
}



