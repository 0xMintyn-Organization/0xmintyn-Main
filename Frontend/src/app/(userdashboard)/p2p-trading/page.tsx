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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                      P2P Trading
                      <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                        Live
                      </span>
                    </h1>
                    <p className="text-blue-100 mt-1 text-lg">
                      Buy and sell OXM tokens directly with other users
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
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

