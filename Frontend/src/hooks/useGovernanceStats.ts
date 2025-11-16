import { useEffect, useState } from 'react';
import axios from 'axios';

interface GovernanceStats {
  totalProposals: number;
  totalVotes: number;
  activeProposals: number;
  passedProposals: number;
  rejectedProposals: number;
}

export function useGovernanceStats() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}governance/proposal/stats`,
          { withCredentials: true }
        );

        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching governance stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return {
    stats,
    loading,
    pendingCount: stats?.activeProposals ?? 0,
  };
}


