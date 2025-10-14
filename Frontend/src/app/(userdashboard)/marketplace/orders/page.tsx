'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function OrdersRedirectPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect based on user role
    // If user is seller, show seller orders, otherwise show buyer orders
    if (user) {
      if (user.isSeller) {
        router.replace('/marketplace/orders/seller');
      } else {
        router.replace('/marketplace/orders/buyer');
      }
    } else {
      // If no user, redirect to buyer orders (will handle auth there)
      router.replace('/marketplace/orders/buyer');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
        <p className="text-gray-600 dark:text-gray-400">Redirecting to your orders...</p>
      </div>
    </div>
  );
}

