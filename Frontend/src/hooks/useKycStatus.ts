'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export type KycStatus = 'not_started' | 'pending_review' | 'verified' | 'rejected';

export type KycDetails = {
  fullName?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  submittedAt?: string;
  reviewedAt?: string | null;
  rejectionReason?: string;
  verificationUrl?: string;
  verificationId?: string;
} | null;

const backendRoot = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export default function useKycStatus() {
  const [status, setStatus] = useState<KycStatus>('not_started');
  const [details, setDetails] = useState<KycDetails>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching KYC status from:', `${backendRoot}/api/v1/kyc/status`);
      const res = await fetch(`${backendRoot}/api/v1/kyc/status`, { 
        credentials: 'include',
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 KYC Status Response:', { status: res.status, ok: res.ok });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ KYC Status API Error:', errorData);
        throw new Error(errorData?.error || `HTTP ${res.status}: Unable to load KYC status`);
      }
      
      const payload = await res.json();
      console.log('📦 KYC Status API Response:', payload);
      
      // Handle both response formats: { ok: true, data: {...} } or { data: {...} }
      const responseData = payload?.data || payload;
      const statusFromApi = responseData?.status;
      const detailsFromApi = responseData?.details;
      
      // Normalize status - handle null/undefined and ensure it's a valid status
      const validStatuses: KycStatus[] = ['not_started', 'pending_review', 'verified', 'rejected'];
      const normalizedStatus = (statusFromApi && validStatuses.includes(statusFromApi as KycStatus))
        ? (statusFromApi as KycStatus)
        : 'not_started';
      
      setStatus((prevStatus) => {
        const changed = normalizedStatus !== prevStatus;
        console.log('✅ KYC Status normalized:', { 
          raw: statusFromApi, 
          normalized: normalizedStatus,
          previous: prevStatus,
          changed,
          details: detailsFromApi
        });
        return normalizedStatus;
      });
      setDetails(detailsFromApi ?? null);
    } catch (err: any) {
      console.error('❌ KYC Status fetch error:', err);
      setError(err?.message || 'Failed to load KYC status');
      // Don't reset status on error, keep previous status
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to avoid infinite loops

  const startKyc = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`${backendRoot}/api/v1/kyc/start`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Failed to start KYC');
      }
      // Update local state immediately
      setStatus(payload.data.status || 'pending_review');
      setDetails(payload.data.details);
      return payload.data.verificationUrl as string | undefined;
    } catch (err: any) {
      setError(err?.message || 'Failed to start KYC');
      throw err;
    } finally {
      setStarting(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle URL parameters (when redirected from webhook)
  useEffect(() => {
    const kycStatusParam = searchParams?.get('kycStatus');
    const kycRefresh = searchParams?.get('kycRefresh');
    
    if (kycStatusParam || kycRefresh) {
      console.log('🔗 URL parameter detected:', { kycStatusParam, kycRefresh });
      // Force refresh status when redirected from webhook
      fetchStatus(true);
      
      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams?.toString());
      newSearchParams.delete('kycStatus');
      newSearchParams.delete('kycRefresh');
      const newQuery = newSearchParams.toString();
      const newUrl = newQuery ? `?${newQuery}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router, fetchStatus]);

  // Auto-poll when status is pending_review
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (status === 'pending_review') {
      console.log('⏰ Starting auto-poll for pending_review status (every 10s)');
      pollingIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-polling KYC status...');
        fetchStatus(true);
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [status, fetchStatus]);

  return {
    status,
    details,
    loading,
    error,
    starting,
    refresh: () => fetchStatus(true),
    startKyc,
  };
}

