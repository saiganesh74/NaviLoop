'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TrackerPage from '@/components/TrackerPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-full h-full">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return <TrackerPage />;
}
