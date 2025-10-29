"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, LogOut, RefreshCw } from 'lucide-react';
import { formatTimeRemaining } from '@/utils/jwtHelper';

interface AutoLogoutWarningProps {
  isOpen: boolean;
  timeRemaining: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
  isExtending?: boolean;
}

export function AutoLogoutWarning({
  isOpen,
  timeRemaining,
  onStayLoggedIn,
  onLogout,
  isExtending = false,
}: AutoLogoutWarningProps) {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  const formatTime = (ms: number): string => {
    return formatTimeRemaining(ms);
  };

  const minutes = Math.floor(countdown / (1000 * 60));
  const seconds = Math.floor((countdown % (1000 * 60)) / 1000);
  const isUrgent = minutes < 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onStayLoggedIn()} modal={true}>
      <DialogContent 
        className="sm:max-w-[450px] animate-in fade-in-0 zoom-in-95 duration-200"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${isUrgent ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              <AlertCircle className={`h-6 w-6 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <DialogTitle className={`text-xl ${isUrgent ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'}`}>
              Session Expiring Soon
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Your session is about to expire due to inactivity. You'll be logged out automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className={`flex flex-col items-center justify-center gap-4 p-6 rounded-lg border ${
            isUrgent
              ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
              : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <div className={`flex items-center gap-2 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
              <Clock className={`h-5 w-5 ${isUrgent ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium">Time Remaining</span>
            </div>
            <div className={`text-5xl font-bold tabular-nums ${isUrgent ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p className={`text-sm text-center max-w-sm ${isUrgent ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {isUrgent 
                ? 'Your session will expire very soon! Click "Extend Session" to continue.'
                : 'Click "Extend Session" to refresh your session and continue working without interruption.'
              }
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={onLogout}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Now
          </Button>
          <Button
            onClick={onStayLoggedIn}
            disabled={isExtending}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Extend Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

