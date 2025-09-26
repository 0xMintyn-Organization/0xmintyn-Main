'use client';

import React, { useState, useEffect } from 'react';
import { useSmartContracts } from '@/hooks/useSmartContracts';
import { SMART_CONTRACTS } from '@/services/contracts/smart-contracts.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Vote, 
  ShoppingCart, 
  ArrowLeftRight, 
  Shield, 
  Coins,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Contract Status Component
const ContractStatus: React.FC<{ 
  name: string; 
  isActive: boolean; 
  features: string[];
  description: string;
}> = ({ name, isActive, features, description }) => (
  <Card className="w-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{name}</CardTitle>
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="space-y-2">
        <h4 className="text-xs font-medium">Features:</h4>
        <div className="flex flex-wrap gap-1">
          {features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {features.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{features.length - 3} more
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// System Health Component
const SystemHealth: React.FC<{ stats: any }> = ({ stats }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="w-5 h-5" />
        System Health
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Connection</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={stats?.system?.connection?.healthy ? "default" : "destructive"}>
              {stats?.system?.connection?.healthy ? "Healthy" : "Unhealthy"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {stats?.system?.connection?.activeEndpoints || 0} endpoints
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Redis</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={stats?.system?.redis?.connected ? "default" : "destructive"}>
              {stats?.system?.redis?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Workers</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={stats?.system?.workers?.ubi?.running ? "default" : "destructive"}>
              {stats?.system?.workers?.ubi?.running ? "Running" : "Stopped"}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">WebSocket</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={stats?.system?.websocket?.connected ? "default" : "destructive"}>
              {stats?.system?.websocket?.connected ? "Connected" : "Disconnected"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {stats?.system?.websocket?.clients || 0} clients
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// UBI Stats Component
const UbiStats: React.FC<{ stats: any }> = ({ stats }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Coins className="w-5 h-5" />
        UBI Distribution
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{stats?.activeUsers?.toLocaleString() || 0}</p>
          <p className="text-xs text-muted-foreground">Active Users</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{stats?.totalDistributed || '0'}</p>
          <p className="text-xs text-muted-foreground">Total Distributed</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Monthly Distribution</span>
          <span>{stats?.monthlyDistributed || '0'}</span>
        </div>
        <Progress value={75} className="h-2" />
      </div>
    </CardContent>
  </Card>
);

// Governance Stats Component
const GovernanceStats: React.FC<{ stats: any }> = ({ stats }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Vote className="w-5 h-5" />
        Governance
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">{stats?.totalProposals || 0}</p>
          <p className="text-xs text-muted-foreground">Total Proposals</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{stats?.activeProposals || 0}</p>
          <p className="text-xs text-muted-foreground">Active Proposals</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{stats?.totalVotes?.toLocaleString() || 0}</p>
          <p className="text-xs text-muted-foreground">Total Votes</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{stats?.participationRate || 0}%</p>
          <p className="text-xs text-muted-foreground">Participation Rate</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Main Dashboard Component
const SmartContractsDashboard: React.FC = () => {
  const {
    contractStats,
    isLoading,
    error,
    isConnected,
    contracts,
    contractInfo,
    loadContractStats,
    webSocket,
  } = useSmartContracts();

  const [selectedContract, setSelectedContract] = useState<keyof typeof SMART_CONTRACTS>('UBI_DISTRIBUTION');

  useEffect(() => {
    if (isConnected) {
      loadContractStats();
    }
  }, [isConnected, loadContractStats]);

  // WebSocket event handlers
  useEffect(() => {
    webSocket.onUbiClaim((event) => {
      console.log('UBI Claim event:', event);
      toast.success(`UBI ${event.type} claimed: ${event.amount} tokens`);
    });

    webSocket.onProposalCreated((event) => {
      console.log('Proposal created event:', event);
      toast.info(`New proposal: ${event.title}`);
    });

    webSocket.onSystemAlert((event) => {
      console.log('System alert:', event);
      if (event.level === 'error' || event.level === 'critical') {
        toast.error(event.message);
      }
    });
  }, [webSocket]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Please connect your wallet to view smart contracts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading smart contracts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadContractStats}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Contracts Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and interact with all Mintyn blockchain smart contracts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Real-time Updates
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadContractStats}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health */}
      <SystemHealth stats={contractStats?.system} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UbiStats stats={contractStats?.ubi} />
        <GovernanceStats stats={contractStats?.governance} />
      </div>

      {/* Smart Contracts */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Contracts</CardTitle>
          <CardDescription>
            All deployed smart contracts and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedContract} onValueChange={(value) => setSelectedContract(value as keyof typeof SMART_CONTRACTS)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="UBI_DISTRIBUTION">UBI</TabsTrigger>
              <TabsTrigger value="GOVERNANCE">Governance</TabsTrigger>
              <TabsTrigger value="MARKETPLACE">Marketplace</TabsTrigger>
              <TabsTrigger value="P2P_EXCHANGE">P2P</TabsTrigger>
              <TabsTrigger value="CROSS_CHAIN_BRIDGE">Bridge</TabsTrigger>
              <TabsTrigger value="P2P_ESCROW">Escrow</TabsTrigger>
            </TabsList>
            
            {Object.entries(SMART_CONTRACTS).map(([key, contract]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ContractStatus
                    name={contract.name}
                    isActive={contractInfo.isActive(key as keyof typeof SMART_CONTRACTS)}
                    features={contract.features}
                    description={contract.description}
                  />
                  
                  {/* Contract Details */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Contract Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Program ID</p>
                        <p className="text-xs font-mono bg-muted p-2 rounded">
                          {contract.programId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Features ({contract.features.length})</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contract.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Contract
                        </Button>
                        <Button size="sm" variant="outline">
                          View Transactions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Contract Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(SMART_CONTRACTS).map(([key, contract]) => {
              const isActive = contractInfo.isActive(key as keyof typeof SMART_CONTRACTS);
              return (
                <div key={key} className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                    isActive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <p className="text-xs font-medium">{contract.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isActive ? 'Healthy' : 'Unhealthy'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartContractsDashboard;
