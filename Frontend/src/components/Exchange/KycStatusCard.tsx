'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const kycSteps = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Verify your personal details and nationality.',
    icon: FileText,
  },
  {
    id: 2,
    title: 'Identity Verification',
    description: 'Upload government-issued ID (Passport, ID card).',
    icon: IdCard,
  },
  {
    id: 3,
    title: 'Facial Recognition',
    description: 'Complete a quick selfie/liveness check.',
    icon: Video,
  },
];

type KycStatus = 'not_started' | 'in_progress' | 'pending_review' | 'verified' | 'rejected';

const statusConfig: Record<
  KycStatus,
  {
    badge: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction?: string;
    helperText?: string;
  }
> = {
  not_started: {
    badge: 'Verification Required',
    badgeClass: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    icon: AlertTriangle,
    title: "Complete KYC to start trading",
    description:
      'To comply with Bitget regulations, please complete identity verification to enable buying, selling, deposits, and withdrawals.',
    primaryAction: 'Start Verification',
    secondaryAction: 'Learn More',
    helperText: 'Takes approximately 5 minutes. Requires government ID and smartphone camera.',
  },
  in_progress: {
    badge: 'In Progress',
    badgeClass: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    icon: Clock,
    title: 'Continue your verification',
    description:
      'You have a verification in progress. Complete the remaining steps to enable trading features.',
    primaryAction: 'Resume Verification',
    secondaryAction: 'Start Over',
    helperText: 'Pending steps highlighted below. Your progress is saved automatically.',
  },
  pending_review: {
    badge: 'Under Review',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
    title: 'Verification submitted, awaiting review',
    description:
      'Our compliance team is reviewing your documents. You will be notified via email once the verification is complete.',
    primaryAction: 'Refresh Status',
    secondaryAction: 'Contact Support',
    helperText: 'Review typically takes 5-30 minutes. Make sure emails from Bitget are not blocked.',
  },
  verified: {
    badge: 'Verified',
    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: ShieldCheck,
    title: 'KYC verification complete',
    description:
      'Your identity verification is complete. Trading, deposits, and withdrawals are fully enabled.',
    primaryAction: 'Start Trading',
    secondaryAction: 'View Limits',
    helperText: 'Need to update your information? You can re-submit verification from settings.',
  },
  rejected: {
    badge: 'Verification Failed',
    badgeClass: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    icon: AlertTriangle,
    title: 'Verification needs attention',
    description:
      'Your previous submission was rejected. Please review the requirements and resubmit your documents.',
    primaryAction: 'Resubmit Documents',
    secondaryAction: 'View Requirements',
    helperText: 'Common rejection reasons: blurry document, expired ID, mismatched information.',
  },
};

export default function KycStatusCard() {
  const [status, setStatus] = useState<KycStatus>('not_started');
  const [currentStep, setCurrentStep] = useState(0);

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const completedSteps =
    status === 'verified'
      ? kycSteps.length
      : status === 'in_progress'
      ? currentStep
      : status === 'pending_review' || status === 'rejected'
      ? kycSteps.length
      : 0;

  const progressValue = Math.round((completedSteps / kycSteps.length) * 100);

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
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">{config.description}</p>
          </div>
          <div className="flex flex-col gap-3 items-start md:items-end">
            <Progress value={progressValue} className="w-48" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Progress: {progressValue}%</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className={cn(
                  'font-semibold shadow-md',
                  status === 'verified'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-green-600 hover:bg-green-700'
                )}
              >
                {status === 'pending_review' ? <RefreshCcw className="w-4 h-4 mr-2" /> : null}
                {config.primaryAction}
              </Button>
              {config.secondaryAction ? (
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-zinc-700">
                  {config.secondaryAction}
                </Button>
              ) : null}
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
              const isCurrent = index === completedSteps && status === 'in_progress';

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
                <Mail className="w-4 h-4 text-green-600" /> compliance@bitget.com
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

          {/* Debug / Demo controls (remove when API connects) */}
          <div className="rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-zinc-700 dark:text-gray-400">
            <p className="font-semibold mb-2 flex items-center gap-2">
              Demo Controls
              <Badge variant="secondary" className="text-[10px]">Remove in production</Badge>
            </p>
            <div className="flex flex-wrap gap-2">
              {(['not_started', 'in_progress', 'pending_review', 'verified', 'rejected'] as KycStatus[]).map((state) => (
                <Button
                  key={state}
                  variant={status === state ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatus(state);
                    if (state === 'in_progress') setCurrentStep(1);
                    if (state === 'verified') setCurrentStep(kycSteps.length);
                  }}
                  className={cn(
                    'text-[11px] font-semibold',
                    status === state
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                  )}
                >
                  {state.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
