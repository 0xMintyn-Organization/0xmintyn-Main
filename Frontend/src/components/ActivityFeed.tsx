import React, { useState, useEffect, useRef } from 'react';
import { usePhantomWallet } from '../hooks/usePhantomWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react';

interface Activity {
  id: string;
  type: ActivityType;
  data: any;
  timestamp: number;
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

type ActivityType = 
  | 'GOVERNANCE_VOTE_CAST'
  | 'UBI_CLAIMED' 
  | 'SPL_TOKEN_TRANSFERRED'
  | 'COUNTER_INCREMENTED'
  | 'COUNTER_DECREMENTED'
  | 'GOVERNANCE_PROPOSAL_CREATED'
  | 'SOL_BALANCE_CHANGE'
  | 'TOKEN_BALANCE_CHANGE';

export const ActivityFeed: React.FC = () => {
  const { publicKey, connected } = usePhantomWallet();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Real-time activity monitoring
  useEffect(() => {
    if (!connected || !publicKey) return;

    // Setup WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for activity feed');
      
      // Subscribe to events for this wallet
      ws.send(JSON.stringify({
        type: 'subscribe_wallet',
        data: { walletAddress: publicKey.toString() }
      }));

      ws.send(JSON.stringify({
        type: 'subscribe_events',
        data: { 
          eventTypes: [
            'GOVERNANCE_VOTE_CAST', 
            'UBI_CLAIMED', 
            'SPL_TOKEN_TRANSFERRED',
            'COUNTER_INCREMENTED',
            'COUNTER_DECREMENTED'
          ] 
        }
      }));

      // Request recent activity history
      ws.send(JSON.stringify({
        type: 'get_event_history',
        data: {
          walletAddress: publicKey.toString(),
          limit: 50,
          eventTypes: [
            'GOVERNANCE_VOTE_CAST', 
            'UBI_CLAIMED', 
            'SPL_TOKEN_TRANSFERRED',
            'COUNTER_INCREMENTED',
            'COUNTER_DECREMENTED'
          ]
        }
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'blockchain_event':
          handleNewActivity(message.event);
          break;
        
        case 'event_history':
          setActivities(message.events.map(formatActivity));
          break;
        
        case 'connected':
          console.log('Connected to activity feed:', message);
          break;
        
        case 'error':
          setError(message.message);
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(() => {
        if (connected && publicKey) {
          // Reconnect logic would go here
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error occurred');
    };

    return () => {
      ws.close();
    };
  }, [connected, publicKey]);

  const handleNewActivity = (event: any) => {
    const activity = formatActivity(event);
    
    // Only show activities related to current wallet
    if (isRelevantToWallet(event, publicKey?.toString())) {
      setActivities(prev => [activity, ...prev].slice(0, 100)); // Keep last 100 activities
      
      // Show notification for important activities
      if (['UBI_CLAIMED', 'GOVERNANCE_VOTE_CAST'].includes(activity.type)) {
        showActivityNotification(activity);
      }
    }
  };

  const formatActivity = (event: any): Activity => {
    return {
      id: `${event.signature}_${event.timestamp}`,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      signature: event.signature,
      status: 'confirmed'
    };
  };

  const isRelevantToWallet = (event: any, walletAddress: string): boolean => {
    const data = event.data;
    return (
      data.voter === walletAddress ||
      data.claimer === walletAddress ||
      data.sender === walletAddress ||
      data.recipient === walletAddress ||
      data.authority === walletAddress ||
      data.from === walletAddress ||
      data.to === walletAddress
    );
  };

  const showActivityNotification = (activity: Activity) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${activity.type.replace('_', ' ')}`, {
        body: getActivityDescription(activity),
        icon: '/favicon.ico'
      });
    }
  };

  const getActivityDescription = (activity: Activity): string => {
    switch (activity.type) {
      case 'GOVERNANCE_VOTE_CAST':
        return `Vote cast on proposal: ${activity.data.vote ? 'Yes' : 'No'}`;
      case 'UBI_CLAIMED':
        return `Claimed ${activity.data.amount} UBI credits`;
      case 'SPL_TOKEN_TRANSFERRED':
        return `Transferred ${activity.data.amount} tokens`;
      case 'COUNTER_INCREMENTED':
        return `Counter incremented to ${activity.data.newValue}`;
      case 'COUNTER_DECREMENTED':
        return `Counter decremented to ${activity.data.newValue}`;
      case 'GOVERNANCE_PROPOSAL_CREATED':
        return `New proposal created: ${activity.data.title}`;
      default:
        return 'Blockchain activity detected';
    }
  };

  const getActivityIcon = (type: ActivityType): string => {
    const icons = {
      'GOVERNANCE_VOTE_CAST': '🗳️',
      'UBI_CLAIMED': '💰',
      'SPL_TOKEN_TRANSFERRED': '💸',
      'COUNTER_INCREMENTED': '⬆️',
      'COUNTER_DECREMENTED': '⬇️',
      'GOVERNANCE_PROPOSAL_CREATED': '📋',
      'SOL_BALANCE_CHANGE': '💎',
      'TOKEN_BALANCE_CHANGE': '🪙'
    };
    return icons[type] || '📝';
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getExplorerUrl = (signature: string): string => {
    const cluster = process.env.NODE_ENV === 'development' ? '?cluster=devnet' : '';
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  };

  const refreshActivities = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && publicKey) {
      wsRef.current.send(JSON.stringify({
        type: 'get_event_history',
        data: {
          walletAddress: publicKey.toString(),
          limit: 50,
          eventTypes: [
            'GOVERNANCE_VOTE_CAST', 
            'UBI_CLAIMED', 
            'SPL_TOKEN_TRANSFERRED',
            'COUNTER_INCREMENTED',
            'COUNTER_DECREMENTED'
          ]
        }
      }));
    }
  };

  const filteredActivities = filter === 'ALL' 
    ? activities 
    : activities.filter(activity => activity.type === filter);

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Connect your wallet to see recent blockchain activity
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshActivities}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={filter} onValueChange={(value) => setFilter(value as ActivityType | 'ALL')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Activity</SelectItem>
              <SelectItem value="GOVERNANCE_VOTE_CAST">Governance</SelectItem>
              <SelectItem value="UBI_CLAIMED">UBI Claims</SelectItem>
              <SelectItem value="SPL_TOKEN_TRANSFERRED">Token Transfers</SelectItem>
              <SelectItem value="COUNTER_INCREMENTED">Counter Updates</SelectItem>
              <SelectItem value="COUNTER_DECREMENTED">Counter Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Your blockchain activities will appear here</p>
            </div>
          ) : (
            filteredActivities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="text-2xl">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                      {getActivityDescription(activity)}
                    </p>
                    {getStatusIcon(activity.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(activity.timestamp)}</span>
                    
                    {activity.signature && (
                      <>
                        <span>•</span>
                        <a 
                          href={getExplorerUrl(activity.signature)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Transaction
                        </a>
                      </>
                    )}
                  </div>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {activity.type.replace('_', ' ')}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
