'use client';

import React from 'react';
import Protected from '@/hooks/useProtected';
import P2PTrade from '@/components/Exchange/P2PTrade';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function P2PTradingPage() {
  const router = useRouter();

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {/* Header - Clean & Simple */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  P2P Trading
                  <span className="text-[10px] font-normal bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                    Live
                  </span>
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Buy and sell OXM tokens directly with other users
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-8 px-3 text-xs border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          </div>

          {/* Main P2P Trading Component */}
          <div className="max-w-7xl mx-auto">
            <P2PTrade />
          </div>
        </div>
      </div>
    </Protected>
  );
}

