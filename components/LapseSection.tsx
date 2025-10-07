'use client';

import LapseTable, { Policy, deriveActionAndSeverity } from './LapseTable';

interface LapseSectionProps {
  policies: Policy[];
}

export default function LapseSection({ policies }: LapseSectionProps) {
  // Filter policies by carrier
  const combinedPolicies = policies.filter(p => p.carrier === 'Combined');
  const americanAmicablePolicies = policies.filter(p => p.carrier === 'American Amicable');

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <h2 className="text-2xl font-semibold text-black mb-8">
        Policies That Are About to Lapse
      </h2>

      <div className="space-y-6">
        {/* Combined Insurance Table */}
        <LapseTable
          carrierLabel="Combined"
          policies={combinedPolicies}
          derive={deriveActionAndSeverity}
          showPhone={false}
        />

        {/* American Amicable Table */}
        <LapseTable
          carrierLabel="American Amicable"
          policies={americanAmicablePolicies}
          derive={deriveActionAndSeverity}
          showPhone={true}
        />
      </div>
    </div>
  );
}

