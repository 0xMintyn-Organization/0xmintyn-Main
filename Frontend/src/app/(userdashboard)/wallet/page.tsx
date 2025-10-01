'use client';

import React from 'react';
import { WalletDashboard } from '@/components/WalletDashboard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Activity } from 'lucide-react';

export default function WalletPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Wallet Dashboard</h1>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <WalletDashboard />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
