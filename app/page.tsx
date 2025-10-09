'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BarChart3 } from 'lucide-react';

export type CarrierType = 'american-amicable' | 'combined' | 'aflac' | 'aetna';

export interface TimeRangeAnalysis {
  positivePercentage: number;
  positiveCount: number;
  negativePercentage: number;
  negativeCount: number;
}

export interface StatusBreakdown {
  [status: string]: {
    count: number;
    percentage: number;
  };
}

export interface PersistencyResult {
  carrier: string;
  timeRanges: {
    '3': TimeRangeAnalysis;
    '6': TimeRangeAnalysis;
    '9': TimeRangeAnalysis;
    'All': TimeRangeAnalysis;
  };
  statusBreakdowns: {
    '3': StatusBreakdown;
    '6': StatusBreakdown;
    '9': StatusBreakdown;
    'All': StatusBreakdown;
  };
  totalPolicies: number;
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in, redirect to login
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

