require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import StartupProfileModel, { IStartupProfile } from '../models/startupProfile.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** GET /startup-profile – get own startup profile (create empty if not exists) */
export const getOwnStartupProfile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  if (!userId) return next(new ErrorHandler('Unauthorized', 401));

  const user = await UserModel.findById(userId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'startup') return next(new ErrorHandler('Only startup users have a startup profile', 403));

  let profile = await StartupProfileModel.findOne({ userId }).lean();
  if (!profile) {
    const newProfile = await StartupProfileModel.create({
      userId,
      companyName: user.startupName || 'My Startup',
      description: user.startupDescription || '',
      status: 'pending',
    });
    profile = newProfile.toObject();
  }
  res.status(200).json({ success: true, profile });
});

/** PUT /startup-profile – create or update own startup profile */
export const putStartupProfile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  if (!userId) return next(new ErrorHandler('Unauthorized', 401));

  const user = await UserModel.findById(userId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'startup') return next(new ErrorHandler('Only startup users can update startup profile', 403));

  const { companyName, description, fundingState, contact, status } = req.body as Partial<IStartupProfile>;
  const update: Record<string, unknown> = {};
  if (companyName != null && typeof companyName === 'string') update.companyName = companyName.trim();
  if (description != null && typeof description === 'string') update.description = description.trim();
  if (fundingState != null && typeof fundingState === 'string') update.fundingState = fundingState.trim();
  if (contact != null && typeof contact === 'string') update.contact = contact.trim();
  if (status === 'pending' || status === 'approved' || status === 'rejected') update.status = status;

  let profile = await StartupProfileModel.findOne({ userId });
  if (!profile) {
    profile = await StartupProfileModel.create({
      userId,
      companyName: (update.companyName as string) || user.startupName || 'My Startup',
      description: (update.description as string) || user.startupDescription || '',
      fundingState: (update.fundingState as string) || '',
      contact: (update.contact as string) || '',
      status: (update.status as string) || 'pending',
    });
  } else {
    Object.assign(profile, update);
    await profile.save();
  }
  res.status(200).json({ success: true, profile });
});

/** GET /startup-profile/:id – get by id: own or admin gets full; others get public fields if approved */
export const getStartupProfileById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const profileId = req.params.id;
  const currentUser = req.user as { _id?: unknown; role?: string } | undefined;
  const isAdmin = currentUser?.role === 'admin';
  const currentUserId = currentUser?._id != null ? String(currentUser._id) : null;

  const profile = await StartupProfileModel.findById(profileId).populate('userId', 'firstName lastName email startupName startupDescription').lean();
  if (!profile) return next(new ErrorHandler('Startup profile not found', 404));

  const profileUserId = (profile.userId as { _id?: unknown })?._id != null ? String((profile.userId as { _id: unknown })._id) : String(profile.userId);
  const isOwn = currentUserId && profileUserId === currentUserId;

  if (isOwn || isAdmin) return res.status(200).json({ success: true, profile });

  if (profile.status !== 'approved') return next(new ErrorHandler('Startup profile not available', 404));
  const publicProfile = {
    _id: profile._id,
    companyName: profile.companyName,
    description: profile.description,
    status: profile.status,
    userId: profile.userId,
  };
  res.status(200).json({ success: true, profile: publicProfile });
});

/** GET /startup-profile/list – list approved startup profiles (public showcase) */
export const listApprovedStartupProfiles = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const profiles = await StartupProfileModel.find({ status: 'approved' })
    .populate('userId', 'firstName lastName email startupName startupDescription')
    .sort({ updatedAt: -1 })
    .lean();
  const list = profiles.map((p) => ({
    _id: p._id,
    companyName: p.companyName,
    description: p.description,
    fundingState: p.fundingState,
    status: p.status,
    userId: p.userId,
  }));
  res.status(200).json({ success: true, startups: list });
});

/** GET /startup-profile/list/admin – list all startup profiles (admin only) */
export const listAllStartupProfilesForAdmin = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { role?: string };
  if (user?.role !== 'admin') return next(new ErrorHandler('Admin only', 403));

  const profiles = await StartupProfileModel.find()
    .populate('userId', 'firstName lastName email startupName startupDescription')
    .sort({ updatedAt: -1 })
    .lean();
  const list = profiles.map((p) => ({
    _id: p._id,
    companyName: p.companyName,
    description: p.description,
    fundingState: p.fundingState,
    contact: p.contact,
    status: p.status,
    userId: p.userId,
  }));
  res.status(200).json({ success: true, startups: list });
});

/** PATCH /startup-profile/:id – update status (admin only) */
export const patchStartupProfileStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { role?: string };
  if (user?.role !== 'admin') return next(new ErrorHandler('Admin only', 403));

  const profileId = req.params.id;
  const { status } = req.body as { status?: string };
  if (status !== 'pending' && status !== 'approved' && status !== 'rejected') {
    return next(new ErrorHandler('Valid status required: pending, approved, rejected', 400));
  }

  const profile = await StartupProfileModel.findByIdAndUpdate(
    profileId,
    { status },
    { new: true }
  )
    .populate('userId', 'firstName lastName email startupName')
    .lean();
  if (!profile) return next(new ErrorHandler('Startup profile not found', 404));
  res.status(200).json({ success: true, profile });
});
