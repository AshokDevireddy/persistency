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
    if (days <= 7) return 'border-black dark:border-white bg-slate-50 dark:bg-slate-900';
    if (days <= 14) return 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-900';
    return 'border-slate-300 dark:border-slate-700 bg-white dark:bg-black';
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) return { label: 'Critical', className: 'bg-black dark:bg-white text-white dark:text-black' };
    if (days <= 14) return { label: 'High', className: 'bg-slate-600 dark:bg-slate-400 text-white dark:text-black' };
    return { label: 'Medium', className: 'bg-slate-400 dark:bg-slate-600 text-white dark:text-white' };
  };

  return (
    <div className="bg-white dark:bg-black rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-black dark:bg-white rounded-lg">
          <AlertTriangle className="w-6 h-6 text-white dark:text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-black dark:text-white">
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
              className={`p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${getUrgencyColor(policy.daysUntilLapse)}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 ${urgency.className} text-xs font-bold rounded-full`}>
                      {urgency.label}
                    </span>
                    <span className="text-sm font-mono font-medium text-black dark:text-white">
                      {policy.policyNumber}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Policy Holder</p>
                        <p className="text-sm font-medium text-black dark:text-white">
                          {policy.holderName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Premium</p>
                        <p className="text-sm font-medium text-black dark:text-white">
                          ${policy.premium.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Days Until Lapse</p>
                        <p className="text-sm font-medium text-black dark:text-white">
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

