import { useEffect, useState } from 'react';
import axios from 'axios';

interface TotalCoursesStats {
  totalCourses: number;
  growth: string;
  change: string;
}

export function useTotalCourses() {
  const [stats, setStats] = useState<TotalCoursesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}dashboard/totalcourses`
        );

        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching total courses stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return {
    stats,
    loading,
    totalCourses: stats?.totalCourses ?? 0,
  };
}


