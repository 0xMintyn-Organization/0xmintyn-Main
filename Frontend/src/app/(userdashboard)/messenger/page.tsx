'use client';

// Redirect to the main messenger page
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessengerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Messenger functionality removed - redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to messenger...</p>
      </div>
    </div>
  );
}
