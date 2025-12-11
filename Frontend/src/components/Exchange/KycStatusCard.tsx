'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  IdCard,
  Video,
  HelpCircle,
  PhoneCall,
  Mail,
  RefreshCcw,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useKycStatus from '@/hooks/useKycStatus';

const kycSteps = [
  { id: 1, title: 'Basic Information', description: 'Verify your personal details and nationality.', icon: FileText },
  { id: 2, title: 'Identity Verification', description: 'Upload government-issued ID (Passport, ID card).', icon: IdCard },
  { id: 3, title: 'Facial Recognition', description: 'Complete a quick selfie/liveness check.', icon: Video },
];

type ViewStatus = 'not_started' | 'pending_review' | 'verified' | 'rejected';

const statusConfig: Record<
  ViewStatus,
  {
    badge: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    primaryAction: string;
    helperText?: string;
  }
> = {
  not_started: {
    badge: 'Verification Required',
    badgeClass: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    icon: AlertTriangle,
    title: 'Complete KYC to start trading',
    description:
      'To keep your account secure and enable trading, please complete identity verification for buying, selling, deposits, and withdrawals.',
    primaryAction: 'Start verification',
    helperText: 'Takes a few minutes. Requires government ID and liveness.',
  },
  pending_review: {
    badge: 'Under Review',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
    title: 'Verification submitted, awaiting review',
    description: 'We are reviewing your documents. You will be notified once complete.',
    primaryAction: 'Refresh status',
    helperText: 'Reviews typically complete within minutes.',
  },
  verified: {
    badge: 'Verified',
    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: ShieldCheck,
    title: 'KYC verification complete',
    description: 'Your identity verification is complete. Trading, deposits, and withdrawals are enabled.',
    primaryAction: 'Start trading',
    helperText: 'Need to update your information? Contact support.',
  },
  rejected: {
    badge: 'Verification Failed',
    badgeClass: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    icon: AlertTriangle,
    title: 'Verification needs attention',
    description: 'Your previous submission was rejected. Please retry your verification.',
    primaryAction: 'Retry verification',
    helperText: 'Common reasons: blurry document, expired ID, mismatched information.',
  },
};

export default function KycStatusCard() {
  const { status, details, loading, error, starting, refresh, startKyc } = useKycStatus();

  // Debug log to see what status we're getting
  React.useEffect(() => {
    console.log('🎯 KYC Status Card - Current status:', status, 'Details:', details, 'Loading:', loading);
  }, [status, details, loading]);

  // Ensure we always have a valid viewStatus
  const viewStatus: ViewStatus = React.useMemo(() => {
    if (status === 'pending_review' || status === 'verified' || status === 'rejected') {
      return status;
    }
    return 'not_started';
  }, [status]);

  const config = statusConfig[viewStatus];
  const StatusIcon = config.icon;

  const completedSteps = useMemo(() => {
    if (viewStatus === 'verified') return kycSteps.length;
    if (viewStatus === 'pending_review' || viewStatus === 'rejected') return Math.max(0, kycSteps.length - 1);
    return 0;
  }, [viewStatus]);

  const progressValue = Math.round((completedSteps / kycSteps.length) * 100);

  const handlePrimary = async () => {
    if (viewStatus === 'pending_review') {
      await refresh();
      return;
    }
    if (viewStatus === 'verified') {
      return;
    }
    const url = await startKyc();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-zinc-900">
      <CardHeader className="border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-zinc-900/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge className={cn('w-fit py-1 px-3 text-xs font-semibold uppercase tracking-wide', config.badgeClass)}>
              {config.badge}
            </Badge>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <StatusIcon className="w-6 h-6" />
              {config.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
              {viewStatus === 'rejected' && details?.rejectionReason ? `Reason: ${details.rejectionReason}` : config.description}
            </p>
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
            {loading ? (
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <RefreshCcw className="w-3 h-3 animate-spin" />
                Loading verification status...
              </p>
            ) : null}
            {viewStatus === 'pending_review' && !loading ? (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Status auto-refreshes every 10 seconds. Click "Refresh status" to check now.
              </p>
            ) : null}
            {!loading && !error && viewStatus !== 'not_started' ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 items-start md:items-end">
            <Progress value={progressValue} className="w-48" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Progress: {progressValue}%</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={starting || loading}
                onClick={handlePrimary}
                className={cn(
                  'font-semibold shadow-md',
                  viewStatus === 'verified'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-green-600 hover:bg-green-700'
                )}
              >
                {viewStatus === 'pending_review' ? (
                  <RefreshCcw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
                ) : null}
                {starting ? 'Starting…' : loading && viewStatus === 'pending_review' ? 'Refreshing…' : config.primaryAction}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[2fr_1fr] p-6">
        {/* Steps */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide dark:text-gray-300">
            Verification steps
          </h3>
          <div className="space-y-4">
            {kycSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < completedSteps;
              const isCurrent = viewStatus === 'pending_review' && index === completedSteps;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'group rounded-xl border p-4 transition-all duration-200',
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                      : isCurrent
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10'
                      : 'border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold',
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
                          : isCurrent
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                          : 'border-gray-300 bg-gray-100 text-gray-500'
                      )}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</h4>
                        {isCompleted ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Completed
                          </Badge>
                        ) : isCurrent ? (
                          <Badge className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                            In progress
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                      {isCurrent ? (
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300">
                          <ArrowRight className="w-3 h-3" /> Complete this step to proceed
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(viewStatus === 'not_started' || viewStatus === 'rejected') && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <IdCard className="w-4 h-4" /> Start verification with Didit
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We’ll open a secure Didit verification link to capture your ID and liveness. Once done, refresh status to see the result.
              </p>
              <Button
                onClick={handlePrimary}
                disabled={starting || loading}
                className="w-full font-semibold"
              >
                {starting ? 'Opening…' : 'Open verification link'}
              </Button>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Verification is handled by Didit; your data is processed securely.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Why KYC is required
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Access full trading features (buy/sell, deposits, withdrawals)</li>
              <li>• Higher transaction limits and security compliance</li>
              <li>• Protect your account and meet global regulations</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Need help?
            </h4>
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-600" /> support@0xmintyn.com
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-green-600" /> 24/7 support hotline
              </div>
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-green-600" /> Typical review time: 5-30 min
              </div>
            </div>
            {config.helperText ? (
              <p className="mt-3 rounded-lg bg-green-50 p-3 text-xs text-green-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {config.helperText}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
