'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import PersistencyChart from '@/components/PersistencyChart';
import LapsingPolicies from '@/components/LapsingPolicies';
import LapseSection from '@/components/LapseSection';
import { Policy } from '@/components/LapseTable';
import { BarChart3, TrendingUp } from 'lucide-react';

export type CarrierType = 'american-amicable' | 'combined' | 'american-home-life' | 'aflac' | 'aetna' | 'royal-neighbors';

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
  const [files, setFiles] = useState<Record<CarrierType, File | null>>({
    'american-amicable': null,
    'combined': null,
    'american-home-life': null,
    'aflac': null,
    'aetna': null,
    'royal-neighbors': null,
  });
  const [results, setResults] = useState<PersistencyResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lapsePolicies, setLapsePolicies] = useState<Policy[]>([]);

  const handleFileChange = (carrier: CarrierType, file: File | null) => {
    setFiles(prev => ({ ...prev, [carrier]: file }));
    setError(null);
  };

  const handleAnalyze = async () => {
    // Check if at least one file is uploaded
    const uploadedFiles = Object.entries(files).filter(([_, file]) => file !== null);
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one carrier file');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();

      Object.entries(files).forEach(([carrier, file]) => {
        if (file) {
          formData.append(carrier, file);
        }
      });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('📊 Analysis Results:', JSON.stringify(data, null, 2));
      console.log('📈 Detailed Results:', data.results);
      setResults(data.results);

      // Set lapse policies if available
      if (data.lapsePolicies) {
        setLapsePolicies(data.lapsePolicies);
      }
    } catch (err) {
      console.error('❌ Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">
                Persistency Analyzer
              </h1>
              <p className="text-sm text-slate-600">
                Analyze insurance policy retention across carriers
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Section */}
        <div className="mb-12 animate-fade-in">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-black mb-2">
              Upload Carrier Data
            </h2>
            <p className="text-slate-600">
              Upload CSV or Excel files for each carrier to analyze persistency rates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
            <FileUpload
              carrier="american-amicable"
              label="American Amicable"
              onFileChange={handleFileChange}
              file={files['american-amicable']}
            />
            <FileUpload
              carrier="combined"
              label="Combined Insurance"
              onFileChange={handleFileChange}
              file={files['combined']}
            />
            <FileUpload
              carrier="american-home-life"
              label="American Home Life"
              onFileChange={handleFileChange}
              file={files['american-home-life']}
            />
            <FileUpload
              carrier="aflac"
              label="Aflac"
              onFileChange={handleFileChange}
              file={files['aflac']}
            />
            <FileUpload
              carrier="aetna"
              label="Aetna"
              onFileChange={handleFileChange}
              file={files['aetna']}
            />
            <FileUpload
              carrier="royal-neighbors"
              label="Royal Neighbors of America"
              onFileChange={handleFileChange}
              file={files['royal-neighbors']}
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center animate-slide-up">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <TrendingUp className="w-5 h-5" />
              {analyzing ? 'Analyzing...' : 'Analyze Persistency'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && results.length > 0 && (
          <div className="space-y-8 animate-slide-up">
            {/* Persistency Chart */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-semibold text-black mb-6">
                Persistency Overview
              </h2>
              <PersistencyChart results={results} />
            </div>

            {/* Raw Analysis Output */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-semibold text-black mb-6">
                Detailed Analysis Output
              </h2>
              <div className="space-y-6">
                {results.map((result) => (
                  <div key={result.carrier} className="border-b border-slate-200 last:border-b-0 pb-6 last:pb-0">
                    <h3 className="text-xl font-semibold text-black mb-4">{result.carrier}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(result.timeRanges).map(([period, data]) => (
                        <div key={period} className="bg-slate-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-slate-600 mb-2">
                            {period === 'All' ? 'All Time' : `${period} Months`}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">Positive (Active)</p>
                              <p className="font-semibold text-black">
                                {data.positivePercentage}% ({data.positiveCount})
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Negative (Inactive)</p>
                              <p className="font-semibold text-slate-600">
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

            {/* Lapse Policies Section */}
            {lapsePolicies.length > 0 && (
              <div className="mt-8">
                <LapseSection policies={lapsePolicies} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-600 text-sm">
          <p>© 2025 Persistency Analyzer. Built for insurance professionals.</p>
        </div>
      </footer>
    </div>
  );
}

