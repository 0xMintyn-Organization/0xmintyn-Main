import axios from 'axios';

// According to Didit docs: https://docs.didit.me/reference/api-authentication
// Base URL: https://verification.didit.me/v2/session/
// Header: x-api-key (not Authorization Bearer)
const DIDIT_BASE_URL = 'https://verification.didit.me/v2';
const DIDIT_API_KEY = 'hNrMuXCFMbm7-HhpsHaDAjAtLp3x0kvcbXWztKE6hzQ';
// Note: You'll need to create a workflow in Didit Console and get the workflow_id
// For now, we'll try without it or use a default
const DIDIT_WORKFLOW_ID = 'd0321c66-c3bf-4d08-806d-222a2ec10969'; 

const client = axios.create({
  baseURL: DIDIT_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': DIDIT_API_KEY,
  },
});

type CreateVerificationLinkInput = {
  externalUserId: string;
  email?: string;
  workflowId?: string;
  callbackUrl?: string;
  redirectUrl?: string; // URL to redirect user after verification completes
};

export async function createVerificationLink(input: CreateVerificationLinkInput) {
  try {
    // According to Didit docs: https://docs.didit.me/reference/api-authentication
    // Endpoint: POST /v2/session/
    // Header: x-api-key (API key in header, not Bearer token)
    // Body: { workflow_id, vendor_data (user ID), callback (optional) }
    
    const workflowId = input.workflowId || DIDIT_WORKFLOW_ID;
    if (!workflowId) {
      console.warn('Didit: No workflow_id provided. You need to create a workflow in Didit Console first.');
    }

    const requestBody: any = {
      vendor_data: input.externalUserId, // User ID for tracking
    };

    if (workflowId) {
      requestBody.workflow_id = workflowId;
    }

    if (input.callbackUrl) {
      requestBody.callback = input.callbackUrl;
    }
    
    // Some KYC providers support redirect_url for user redirect after completion
    if (input.redirectUrl) {
      requestBody.redirect_url = input.redirectUrl;
      requestBody.redirectUrl = input.redirectUrl; // Try both formats
    }

    console.log('Didit API Request:', {
      url: `${DIDIT_BASE_URL}/session/`,
      hasApiKey: !!DIDIT_API_KEY,
      payload: requestBody,
    });

    const res = await client.post('/session/', requestBody);
    
    console.log('Didit API Success:', res.data);
    return res.data;
  } catch (error: any) {
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    };
    console.error('Didit API Error:', JSON.stringify(errorDetails, null, 2));
    
    if (error.response?.status === 401) {
      throw new Error(
        `Didit API authentication failed. Please:\n` +
        `1. Verify your API key is correct in Didit Console (https://business.didit.me/)\n` +
        `2. Create a workflow in Didit Console and get the workflow_id\n` +
        `3. Ensure your account is activated\n` +
        `Error: ${error.response?.data?.detail || error.message}`
      );
    }
    
    if (error.response?.status === 400) {
      throw new Error(
        `Didit API request failed. You may need to:\n` +
        `1. Create a workflow in Didit Console and provide workflow_id\n` +
        `2. Check request format matches Didit docs\n` +
        `Error: ${error.response?.data?.detail || error.message}`
      );
    }
    
    throw error;
  }
}

export type DiditWebhookEvent = {
  verificationId?: string;
  externalUserId?: string;
  status?: 'Approved' | 'Declined' | 'In Review';
  reason?: string;
};


