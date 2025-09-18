import { useState, useEffect } from 'react';
import axios from 'axios';

export const useBookmarkCount = () => {
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkCount = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/count`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setBookmarkCount(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching bookmark count:', error);
        setBookmarkCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkCount();
  }, []);

  const updateBookmarkCount = (increment: boolean) => {
    setBookmarkCount(prev => increment ? prev + 1 : Math.max(0, prev - 1));
  };

  return { bookmarkCount, loading, updateBookmarkCount };
};
