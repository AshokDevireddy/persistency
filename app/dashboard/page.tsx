'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PersistencyChart from '@/components/PersistencyChart';
import LapseSection from '@/components/LapseSection';
import { Policy } from '@/components/LapseTable';
import { BarChart3, TrendingUp, Users, FileText, LogOut } from 'lucide-react';

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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [dataView, setDataView] = useState<'my' | 'downline'>('my');
  const [results, setResults] = useState<PersistencyResult[] | null>(null);
  const [lapsePolicies, setLapsePolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      handleAnalyze();
    }
  }, [dataView, profile]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    setUser(user);

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*, agency:agencies(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Profile error:', profileError);
      setError('Failed to load profile');
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!profile) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Get user's writing agent assignments
      const supabase = createClient();

      let writingAgentIds: string[] = [];

      if (dataView === 'my') {
        // Get only user's writing agents
        const { data: assignments } = await supabase
          .from('agent_assignments')
          .select('writing_agent_id')
          .eq('profile_id', profile.id);

        writingAgentIds = assignments?.map(a => a.writing_agent_id) || [];
      } else {
        // Get downline's writing agents
        const { data: downlineIds } = await supabase.rpc('get_all_downline_ids', {
          profile_id: profile.id
        });

        if (downlineIds && downlineIds.length > 0) {
          const { data: assignments } = await supabase
            .from('agent_assignments')
            .select('writing_agent_id')
            .in('profile_id', downlineIds.map((d: any) => d.downline_id));

          writingAgentIds = assignments?.map(a => a.writing_agent_id) || [];
        }
      }

      // If no writing agents assigned yet
      if (writingAgentIds.length === 0 && profile.role !== 'agency_owner') {
        setError('No writing agents assigned to your account yet. Please contact your upline.');
        setResults(null);
        setLapsePolicies([]);
        setAnalyzing(false);
        return;
      }

      // Get writing agent details
      let writingAgents: any[] = [];
      if (profile.role === 'agency_owner' && dataView === 'my') {
        // Agency owner sees all data by default
        const { data } = await supabase
          .from('writing_agents')
          .select('*')
          .eq('agency_id', profile.agency_id);
        writingAgents = data || [];
      } else if (writingAgentIds.length > 0) {
        const { data } = await supabase
          .from('writing_agents')
          .select('*')
          .in('id', writingAgentIds);
        writingAgents = data || [];
      }

      // Download and analyze documents
      const { data: documents } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('agency_id', profile.agency_id);

      if (!documents || documents.length === 0) {
        setError('No carrier documents uploaded yet. Please upload policy reports in the Documents page.');
        setResults(null);
        setLapsePolicies([]);
        setAnalyzing(false);
        return;
      }

      // Download files and analyze
      const formData = new FormData();

      for (const doc of documents) {
        const { data: fileData } = await supabase.storage
          .from('carrier-documents')
          .download(doc.file_path);

        if (fileData) {
          const carrierKey = doc.carrier_name.toLowerCase().replace(' ', '-');
          formData.append(carrierKey, fileData, doc.file_name);
        }
      }

      // Add filtering info
      formData.append('filter_mode', dataView);
      formData.append('writing_agent_numbers', JSON.stringify(
        writingAgents.map(wa => wa.agent_number)
      ));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResults(data.results);
      setLapsePolicies(data.lapsePolicies || []);
    } catch (err) {
      console.error('Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isAgencyOwner = profile?.role === 'agency_owner';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.agency?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.full_name} • {isAgencyOwner ? 'Agency Owner' : 'Agent'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Navigation */}
              {isAgencyOwner && (
                <button
                  onClick={() => router.push('/documents')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Documents
                </button>
              )}

              <button
                onClick={() => router.push('/hierarchy')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                Hierarchy
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data View Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data View</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose which data to display in your analysis
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDataView('my')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  dataView === 'my'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Data
              </button>
              <button
                onClick={() => setDataView('downline')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  dataView === 'downline'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Downline Data
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {analyzing && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing policies...</p>
          </div>
        )}

        {/* Results Section */}
        {!analyzing && results && results.length > 0 && (
          <div className="space-y-8">
            {/* Persistency Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Persistency Overview
                <span className="text-sm font-normal text-gray-600 ml-3">
                  ({dataView === 'my' ? 'My Data' : 'Downline Data'})
                </span>
              </h2>
              <PersistencyChart results={results} />
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Detailed Analysis
              </h2>
              <div className="space-y-6">
                {results.map((result) => (
                  <div key={result.carrier} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{result.carrier}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(result.timeRanges).map(([period, data]) => (
                        <div key={period} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-600 mb-2">
                            {period === 'All' ? 'All Time' : `${period} Months`}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Positive (Active)</p>
                              <p className="font-semibold text-green-600">
                                {data.positivePercentage}% ({data.positiveCount})
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Negative (Inactive)</p>
                              <p className="font-semibold text-gray-600">
                                {data.negativePercentage}% ({data.negativeCount})
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lapse Policies */}
            {lapsePolicies.length > 0 && (
              <div className="mt-8">
                <LapseSection policies={lapsePolicies} />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analyzing && !results && !error && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600">
              {isAgencyOwner
                ? 'Upload carrier documents to start analyzing your persistency data.'
                : 'Your upline needs to upload carrier documents and assign writing agents to your account.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

