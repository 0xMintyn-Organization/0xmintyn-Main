import React, { useState, useEffect, useRef } from 'react';
import { usePhantomWallet } from '../hooks/usePhantomWallet';
import { SmartContractService } from '../services/contractService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, Coins, Vote, Zap, RefreshCw } from 'lucide-react';

interface WalletInfo {
  solBalance: number;
  splTokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
  }>;
  governanceTokens: {
    total: number;
    votingPower: number;
  };
  ubiCredits: {
    availableCredits: number;
    totalEarned: number;
    lastClaim: string | null;
    claimableAmount: number;
  };
  lastUpdated: number;
}

export const WalletDashboard: React.FC = () => {
  const {
    wallet,
    connected,
    connecting,
    publicKey,
    balance,
    error,
    connectWallet,
    disconnectWallet,
    updateBalance
  } = usePhantomWallet();
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionLoading, setTransactionLoading] = useState<string | null>(null);
  
  const contractService = useRef(new SmartContractService());
  const wsRef = useRef<WebSocket | null>(null);

  // Load complete wallet information
  useEffect(() => {
    if (connected && publicKey) {
      loadWalletInfo();
      setupRealTimeUpdates();
    }
  }, [connected, publicKey]);

  const loadWalletInfo = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive wallet data from backend
      const response = await fetch('/api/wallet/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey?.toString(),
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data.walletInfo);
      } else {
        // Fallback to basic info if backend is not available
        setWalletInfo({
          solBalance: balance,
          splTokens: [],
          governanceTokens: { total: 0, votingPower: 0 },
          ubiCredits: { availableCredits: 0, totalEarned: 0, lastClaim: null, claimableAmount: 0 },
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to load wallet info:', error);
      // Set fallback data
      setWalletInfo({
        solBalance: balance,
        splTokens: [],
        governanceTokens: { total: 0, votingPower: 0 },
        ubiCredits: { availableCredits: 0, totalEarned: 0, lastClaim: null, claimableAmount: 0 },
        lastUpdated: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    if (!publicKey) return;

    // Setup WebSocket for real-time updates
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/wallet/${publicKey.toString()}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected for wallet updates');
    };
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'SOL_BALANCE_CHANGE':
          updateBalance();
          break;
        case 'TOKEN_BALANCE_CHANGE':
          loadWalletInfo();
          break;
        case 'GOVERNANCE_UPDATE':
          setWalletInfo(prev => prev ? {
            ...prev,
            governanceTokens: update.data
          } : null);
          break;
        case 'UBI_UPDATE':
          setWalletInfo(prev => prev ? {
            ...prev,
            ubiCredits: update.data
          } : null);
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(setupRealTimeUpdates, 5000);
    };

    return () => ws.close();
  };

  // Governance interaction
  const handleGovernanceVote = async (proposalId: string, vote: boolean) => {
    try {
      setTransactionLoading('governance');
      const result = await contractService.current.participateInGovernance(
        proposalId,
        vote,
        wallet
      );
      
      alert(`Vote cast successfully! Signature: ${result.signature}`);
      loadWalletInfo(); // Refresh governance info
    } catch (error: any) {
      alert(`Voting failed: ${error.message}`);
    } finally {
      setTransactionLoading(null);
    }
  };

  // UBI claiming
  const handleClaimUBI = async () => {
    try {
      setTransactionLoading('ubi');
      const result = await contractService.current.claimUBICredits(wallet);
      
      alert(`UBI claimed successfully! Signature: ${result.signature}`);
      loadWalletInfo(); // Refresh UBI info
    } catch (error: any) {
      alert(`UBI claim failed: ${error.message}`);
    } finally {
      setTransactionLoading(null);
    }
  };

  // Counter operations
  const handleCounterIncrement = async () => {
    try {
      setTransactionLoading('counter');
      const result = await contractService.current.incrementCounter(wallet);
      
      alert(`Counter incremented! Signature: ${result.signature}`);
    } catch (error: any) {
      alert(`Counter increment failed: ${error.message}`);
    } finally {
      setTransactionLoading(null);
    }
  };

  const handleCounterDecrement = async () => {
    try {
      setTransactionLoading('counter');
      const result = await contractService.current.decrementCounter(wallet);
      
      alert(`Counter decremented! Signature: ${result.signature}`);
    } catch (error: any) {
      alert(`Counter decrement failed: ${error.message}`);
    } finally {
      setTransactionLoading(null);
    }
  };

  // SPL Token transfer
  const handleSPLTransfer = async (mintAddress: string, recipient: string, amount: number) => {
    try {
      setTransactionLoading('transfer');
      const result = await contractService.current.transferSPLToken(
        mintAddress,
        recipient,
        amount,
        wallet
      );
      
      alert(`Token transfer successful! Signature: ${result.signature}`);
      loadWalletInfo(); // Refresh token balances
    } catch (error: any) {
      alert(`Token transfer failed: ${error.message}`);
    } finally {
      setTransactionLoading(null);
    }
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  if (!connected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Your Phantom Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Phantom wallet to access all blockchain features including governance, UBI, and token operations.
          </p>
          <Button 
            onClick={connectWallet} 
            disabled={connecting}
            className="w-full"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Phantom Wallet
              </>
            )}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Wallet Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected
              </Badge>
              <Button variant="outline" size="sm" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="font-mono text-sm">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">SOL Balance</p>
              <p className="font-mono text-sm">{balance.toFixed(4)} SOL</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">
                {walletInfo ? new Date(walletInfo.lastUpdated).toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="ubi">UBI</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <WalletOverview 
            walletInfo={walletInfo} 
            balance={balance}
            loading={loading}
            onRefresh={loadWalletInfo}
          />
        </TabsContent>
        
        <TabsContent value="governance" className="space-y-4">
          <GovernancePanel
            governanceTokens={walletInfo?.governanceTokens}
            onVote={handleGovernanceVote}
            loading={transactionLoading === 'governance'}
          />
        </TabsContent>
        
        <TabsContent value="ubi" className="space-y-4">
          <UBIPanel
            ubiCredits={walletInfo?.ubiCredits}
            onClaim={handleClaimUBI}
            loading={transactionLoading === 'ubi'}
          />
        </TabsContent>
        
        <TabsContent value="tokens" className="space-y-4">
          <TokenPanel
            splTokens={walletInfo?.splTokens}
            onTransfer={handleSPLTransfer}
            loading={transactionLoading === 'transfer'}
          />
          <CounterPanel
            onIncrement={handleCounterIncrement}
            onDecrement={handleCounterDecrement}
            loading={transactionLoading === 'counter'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Individual panel components
const WalletOverview: React.FC<{
  walletInfo: WalletInfo | null;
  balance: number;
  loading: boolean;
  onRefresh: () => void;
}> = ({ walletInfo, balance, loading, onRefresh }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Wallet Overview</h3>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">SOL Balance</span>
          </div>
          <p className="text-2xl font-bold mt-2">{balance.toFixed(4)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Governance Tokens</span>
          </div>
          <p className="text-2xl font-bold mt-2">{walletInfo?.governanceTokens.total || 0}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">UBI Credits</span>
          </div>
          <p className="text-2xl font-bold mt-2">{walletInfo?.ubiCredits.availableCredits || 0}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">SPL Tokens</span>
          </div>
          <p className="text-2xl font-bold mt-2">{walletInfo?.splTokens.length || 0}</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const GovernancePanel: React.FC<{
  governanceTokens: WalletInfo['governanceTokens'] | undefined;
  onVote: (proposalId: string, vote: boolean) => void;
  loading: boolean;
}> = ({ governanceTokens, onVote, loading }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Vote className="h-5 w-5" />
        Governance
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
          <p className="text-2xl font-bold">{governanceTokens?.total || 0}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Voting Power</p>
          <p className="text-2xl font-bold">{governanceTokens?.votingPower || 0}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Active Proposals</h4>
        <div className="space-y-2">
          <div className="p-3 border rounded-lg">
            <p className="font-medium">Increase Monthly UBI Distribution</p>
            <p className="text-sm text-muted-foreground">Proposal to increase UBI from $1000 to $1200</p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                onClick={() => onVote('proposal_1', true)}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vote Yes'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onVote('proposal_1', false)}
                disabled={loading}
              >
                Vote No
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const UBIPanel: React.FC<{
  ubiCredits: WalletInfo['ubiCredits'] | undefined;
  onClaim: () => void;
  loading: boolean;
}> = ({ ubiCredits, onClaim, loading }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Zap className="h-5 w-5" />
        Universal Basic Income
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
          <p className="text-2xl font-bold">{ubiCredits?.availableCredits || 0}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
          <p className="text-2xl font-bold">{ubiCredits?.totalEarned || 0}</p>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium text-muted-foreground">Claimable Amount</p>
        <p className="text-lg font-semibold">{ubiCredits?.claimableAmount || 0} credits</p>
      </div>
      
      <Button 
        onClick={onClaim} 
        disabled={loading || (ubiCredits?.claimableAmount || 0) === 0}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Claiming...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Claim UBI Credits
          </>
        )}
      </Button>
    </CardContent>
  </Card>
);

const TokenPanel: React.FC<{
  splTokens: WalletInfo['splTokens'] | undefined;
  onTransfer: (mint: string, recipient: string, amount: number) => void;
  loading: boolean;
}> = ({ splTokens, onTransfer, loading }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Coins className="h-5 w-5" />
        SPL Tokens
      </CardTitle>
    </CardHeader>
    <CardContent>
      {splTokens && splTokens.length > 0 ? (
        <div className="space-y-2">
          {splTokens.map((token, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{token.mint.slice(0, 8)}...</p>
                <p className="text-sm text-muted-foreground">
                  {token.amount} tokens ({token.decimals} decimals)
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={loading}>
                Transfer
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No SPL tokens found</p>
      )}
    </CardContent>
  </Card>
);

const CounterPanel: React.FC<{
  onIncrement: () => void;
  onDecrement: () => void;
  loading: boolean;
}> = ({ onIncrement, onDecrement, loading }) => (
  <Card>
    <CardHeader>
      <CardTitle>Counter Program</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Interact with the counter smart contract to increment or decrement a counter value.
      </p>
      <div className="flex gap-2">
        <Button 
          onClick={onIncrement} 
          disabled={loading}
          className="flex-1"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Increment'}
        </Button>
        <Button 
          onClick={onDecrement} 
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          Decrement
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default WalletDashboard;
