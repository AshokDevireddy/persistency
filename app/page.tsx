'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import PersistencyChart from '@/components/PersistencyChart';
import LapsingPolicies from '@/components/LapsingPolicies';
import { BarChart3, TrendingUp } from 'lucide-react';

export type CarrierType = 'american-amicable' | 'guarantee-trust-life' | 'combined';

export interface PersistencyResult {
  carrier: string;
  persistencyRate: number;
  totalPolicies: number;
  activePolicies: number;
  lapsedPolicies: number;
  lapsingPolicies: Array<{
    policyNumber: string;
    holderName: string;
    premium: number;
    daysUntilLapse: number;
  }>;
}

export default function Home() {
  const [files, setFiles] = useState<Record<CarrierType, File | null>>({
    'american-amicable': null,
    'guarantee-trust-life': null,
    'combined': null,
  });
  const [results, setResults] = useState<PersistencyResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Persistency Analyzer
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
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
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Upload Carrier Data
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Upload CSV files for each carrier to analyze persistency rates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FileUpload
              carrier="american-amicable"
              label="American Amicable"
              onFileChange={handleFileChange}
              file={files['american-amicable']}
            />
            <FileUpload
              carrier="guarantee-trust-life"
              label="Guarantee Trust Life"
              onFileChange={handleFileChange}
              file={files['guarantee-trust-life']}
            />
            <FileUpload
              carrier="combined"
              label="Combined"
              onFileChange={handleFileChange}
              file={files['combined']}
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-center animate-slide-up">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Persistency Overview
              </h2>
              <PersistencyChart results={results} />
            </div>

            {/* Lapsing Policies */}
            {results.map((result) => (
              result.lapsingPolicies.length > 0 && (
                <LapsingPolicies
                  key={result.carrier}
                  carrier={result.carrier}
                  policies={result.lapsingPolicies}
                />
              )
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-600 dark:text-slate-400 text-sm">
          <p>© 2025 Persistency Analyzer. Built for insurance professionals.</p>
        </div>
      </footer>
    </div>
  );
}

