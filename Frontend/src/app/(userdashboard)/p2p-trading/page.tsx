'use client';

import React, { useEffect } from 'react';
import Protected from '@/hooks/useProtected';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function P2PTradingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/exchange?mode=p2p');
  }, [router]);

  return (
    <Protected>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirecting to Exchange...
        </div>
      </div>
    </Protected>
  );
}

