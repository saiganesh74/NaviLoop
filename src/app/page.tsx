'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TrackerPage from '@/components/TrackerPage';
import { Skeleton } from '@/components/ui/skeleton';
import LoginPage from './login/page';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const busId = searchParams.get('busId');

  useEffect(() => {
    if (!loading && user && !busId) {
      router.push('/bus-selection');
    }
  }, [user, loading, busId, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-full h-full">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!busId) {
     return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-full h-full">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return <TrackerPage busId={busId} />;
}
