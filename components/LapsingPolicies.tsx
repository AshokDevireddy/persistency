'use client';

import { AlertTriangle, Clock, DollarSign, User } from 'lucide-react';

interface Policy {
  policyNumber: string;
  holderName: string;
  premium: number;
  daysUntilLapse: number;
}

interface LapsingPoliciesProps {
  carrier: string;
  policies: Policy[];
}

export default function LapsingPolicies({ carrier, policies }: LapsingPoliciesProps) {
  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    if (days <= 14) return 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
    return 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) return { label: 'Critical', className: 'bg-red-500' };
    if (days <= 14) return { label: 'High', className: 'bg-orange-500' };
    return { label: 'Medium', className: 'bg-yellow-500' };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Lapsing Policies
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {carrier} - {policies.length} {policies.length === 1 ? 'policy' : 'policies'} at risk
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {policies.map((policy, index) => {
          const urgency = getUrgencyBadge(policy.daysUntilLapse);

          return (
            <div
              key={index}
              className={`p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getUrgencyColor(policy.daysUntilLapse)}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 ${urgency.className} text-white text-xs font-bold rounded-full`}>
                      {urgency.label}
                    </span>
                    <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">
                      {policy.policyNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Policy Holder</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {policy.holderName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Premium</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          ${policy.premium.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Days Until Lapse</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {policy.daysUntilLapse} {policy.daysUntilLapse === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

