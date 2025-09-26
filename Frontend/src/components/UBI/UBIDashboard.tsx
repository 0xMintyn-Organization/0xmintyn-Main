'use client';

import React, { useState, useEffect } from 'react';
import { useSmartContracts } from '@/hooks/useSmartContracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  User, 
  Shield, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Gift,
  Calendar,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// UBI Claim Component
const UBIClaimCard: React.FC<{
  type: 'welcome' | 'initial' | 'monthly';
  amount: string;
  canClaim: boolean;
  onClaim: () => void;
  isLoading: boolean;
  description: string;
  icon: React.ReactNode;
}> = ({ type, amount, canClaim, onClaim, isLoading, description, icon }) => (
  <Card className="w-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        {icon}
        {type.charAt(0).toUpperCase() + type.slice(1)} UBI
            </CardTitle>
      <Badge variant={canClaim ? "default" : "secondary"}>
        {canClaim ? "Available" : "Not Available"}
      </Badge>
          </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{amount} MINTYN</div>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <Button 
        onClick={onClaim} 
        disabled={!canClaim || isLoading}
        className="w-full"
        size="sm"
      >
        {isLoading ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Claim ${type.charAt(0).toUpperCase() + type.slice(1)} UBI`
        )}
      </Button>
          </CardContent>
        </Card>
);

// UBI Stats Component
const UBIStats: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
        <div>
            <p className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        </div>
          </CardContent>
        </Card>

        <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{stats?.activeUsers?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
            </div>
          </CardContent>
        </Card>

        <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold">{stats?.totalDistributed || '0'}</p>
            <p className="text-xs text-muted-foreground">Total Distributed</p>
          </div>
        </div>
          </CardContent>
        </Card>

        <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <div>
            <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
            </div>
          </CardContent>
        </Card>
      </div>
);

// User Profile Component
const UserProfile: React.FC<{ profile: any }> = ({ profile }) => (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
        <User className="w-5 h-5" />
        Your UBI Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
                <div>
          <p className="text-sm font-medium">Registration Date</p>
                  <p className="text-sm text-muted-foreground">
            {profile?.registeredAt ? new Date(profile.registeredAt).toLocaleDateString() : 'Not registered'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Verification Status</p>
          <Badge variant={profile?.isVerified ? "default" : "secondary"}>
            {profile?.isVerified ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Unverified
              </>
            )}
                  </Badge>
                </div>
        <div>
          <p className="text-sm font-medium">Total Claimed</p>
          <p className="text-sm text-muted-foreground">{profile?.totalClaimed || '0'} MINTYN</p>
              </div>
                <div>
          <p className="text-sm font-medium">Verification Score</p>
          <div className="flex items-center gap-2">
            <Progress value={profile?.verificationScore || 0} className="flex-1" />
            <span className="text-sm">{profile?.verificationScore || 0}%</span>
          </div>
                </div>
              </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Claim History</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Welcome Bonus</span>
            <Badge variant={profile?.welcomeBonusClaimed ? "default" : "secondary"}>
              {profile?.welcomeBonusClaimed ? "Claimed" : "Not Claimed"}
            </Badge>
                  </div>
          <div className="flex justify-between text-sm">
            <span>Initial UBI</span>
            <Badge variant={profile?.initialUbiClaimed ? "default" : "secondary"}>
              {profile?.initialUbiClaimed ? "Claimed" : "Not Claimed"}
                  </Badge>
                </div>
          <div className="flex justify-between text-sm">
            <span>Last Monthly Claim</span>
            <span className="text-muted-foreground">
              {profile?.lastMonthlyClaim ? new Date(profile.lastMonthlyClaim).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>
            </CardContent>
          </Card>
);

// Fraud Detection Component
const FraudDetection: React.FC<{ alerts: any[] }> = ({ alerts }) => (
          <Card>
            <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Fraud Detection
      </CardTitle>
      <CardDescription>
        Recent fraud alerts and security monitoring
      </CardDescription>
            </CardHeader>
    <CardContent>
      {alerts.length === 0 ? (
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm text-muted-foreground">No fraud alerts detected</p>
                </div>
      ) : (
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">{alert.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Risk Score: {alert.riskScore}%
                  </p>
                </div>
              </div>
              <Badge variant="destructive">
                {alert.severity}
              </Badge>
                  </div>
          ))}
                </div>
              )}
    </CardContent>
  </Card>
);

// Main UBI Dashboard Component
const UBIDashboard: React.FC = () => {
  const {
    ubi,
    contractStats,
    isLoading,
    error,
    isConnected,
    loadUserData,
  } = useSmartContracts();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [eligibility, setEligibility] = useState<any>(null);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [claimLoading, setClaimLoading] = useState<{
    welcome: boolean;
    initial: boolean;
    monthly: boolean;
  }>({
    welcome: false,
    initial: false,
    monthly: false,
  });

  // Load user data when connected
  useEffect(() => {
    if (isConnected) {
      // In a real app, you'd get the user's public key from the wallet
      const userPublicKey = 'user-public-key-here'; // Replace with actual public key
      loadUserData(userPublicKey);
    }
  }, [isConnected, loadUserData]);

  // Load UBI-specific data
  useEffect(() => {
    const loadUBIData = async () => {
      if (!isConnected) return;

      try {
        // Load user profile, balance, eligibility, and fraud alerts
        const [profile, balance, eligibilityData, alerts] = await Promise.all([
          ubi.getUserProfile('user-public-key-here'),
          ubi.getUserBalance('user-public-key-here'),
          ubi.checkUserEligibility('user-public-key-here'),
          ubi.getFraudAlerts(),
        ]);

        setUserProfile(profile);
        setUserBalance(balance.balance);
        setEligibility(eligibilityData);
        setFraudAlerts(alerts);
      } catch (error) {
        console.error('Failed to load UBI data:', error);
      }
    };

    loadUBIData();
  }, [isConnected, ubi]);

  // Claim handlers
  const handleClaimWelcome = async () => {
    setClaimLoading(prev => ({ ...prev, welcome: true }));
    try {
      // In a real app, you'd get the private key from the wallet
      const privateKey = 'user-private-key-here';
      const tokenAccount = 'user-token-account-here';
      
      await ubi.claimInitial(privateKey, tokenAccount);
      toast.success('Welcome bonus claimed successfully!');
    } catch (error) {
      toast.error('Failed to claim welcome bonus');
    } finally {
      setClaimLoading(prev => ({ ...prev, welcome: false }));
    }
  };

  const handleClaimInitial = async () => {
    setClaimLoading(prev => ({ ...prev, initial: true }));
    try {
      const privateKey = 'user-private-key-here';
      const tokenAccount = 'user-token-account-here';
      
      await ubi.claimInitial(privateKey, tokenAccount);
      toast.success('Initial UBI claimed successfully!');
    } catch (error) {
      toast.error('Failed to claim initial UBI');
    } finally {
      setClaimLoading(prev => ({ ...prev, initial: false }));
    }
  };

  const handleClaimMonthly = async () => {
    setClaimLoading(prev => ({ ...prev, monthly: true }));
    try {
      const privateKey = 'user-private-key-here';
      const tokenAccount = 'user-token-account-here';
      
      await ubi.claimMonthly(privateKey, tokenAccount);
      toast.success('Monthly UBI claimed successfully!');
    } catch (error) {
      toast.error('Failed to claim monthly UBI');
    } finally {
      setClaimLoading(prev => ({ ...prev, monthly: false }));
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Please connect your wallet to access UBI</p>
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
            <p className="text-sm text-muted-foreground">Loading UBI data...</p>
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="w-8 h-8" />
            UBI Dashboard
          </h1>
          <p className="text-muted-foreground">
            Universal Basic Income distribution and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Balance: {userBalance.toLocaleString()} MINTYN
                </Badge>
              </div>
              </div>

      {/* UBI Stats */}
      <UBIStats stats={contractStats?.ubi} />

      <Tabs defaultValue="claims" className="space-y-4">
        <TabsList>
          <TabsTrigger value="claims">UBI Claims</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* UBI Claims Tab */}
        <TabsContent value="claims" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UBIClaimCard
              type="welcome"
              amount="2,000"
              canClaim={eligibility?.canClaimInitial && !userProfile?.welcomeBonusClaimed}
              onClaim={handleClaimWelcome}
              isLoading={claimLoading.welcome}
              description="Welcome bonus for new users"
              icon={<Gift className="w-4 h-4" />}
            />
            
            <UBIClaimCard
              type="initial"
              amount="2,000"
              canClaim={eligibility?.canClaimInitial && !userProfile?.initialUbiClaimed}
              onClaim={handleClaimInitial}
              isLoading={claimLoading.initial}
              description="Initial UBI claim for verified users"
              icon={<Coins className="w-4 h-4" />}
            />
            
            <UBIClaimCard
              type="monthly"
              amount="1,000"
              canClaim={eligibility?.canClaimMonthly}
              onClaim={handleClaimMonthly}
              isLoading={claimLoading.monthly}
              description="Monthly UBI distribution"
              icon={<Calendar className="w-4 h-4" />}
            />
              </div>

          {/* Eligibility Info */}
          {eligibility && (
          <Card>
            <CardHeader>
                <CardTitle className="text-lg">Eligibility Status</CardTitle>
            </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
              <div>
                    <p className="text-sm font-medium">Initial UBI</p>
                    <Badge variant={eligibility.canClaimInitial ? "default" : "secondary"}>
                      {eligibility.canClaimInitial ? "Eligible" : "Not Eligible"}
                    </Badge>
                    {eligibility.reason && (
                      <p className="text-xs text-muted-foreground mt-1">{eligibility.reason}</p>
                    )}
              </div>
              <div>
                    <p className="text-sm font-medium">Monthly UBI</p>
                    <Badge variant={eligibility.canClaimMonthly ? "default" : "secondary"}>
                      {eligibility.canClaimMonthly ? "Eligible" : "Not Eligible"}
                    </Badge>
                    {eligibility.nextClaimTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Next claim: {new Date(eligibility.nextClaimTime).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <UserProfile profile={userProfile} />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <FraudDetection alerts={fraudAlerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UBIDashboard;