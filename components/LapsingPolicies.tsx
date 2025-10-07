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
    if (days <= 7) return 'border-black bg-slate-50';
    if (days <= 14) return 'border-slate-400 bg-slate-50';
    return 'border-slate-300 bg-white';
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) return { label: 'Critical', className: 'bg-black text-white' };
    if (days <= 14) return { label: 'High', className: 'bg-slate-600 text-white' };
    return { label: 'Medium', className: 'bg-slate-400 text-white' };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-black rounded-lg">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-black">
            Lapsing Policies
          </h2>
          <p className="text-sm text-slate-600">
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
                    <span className="text-sm font-mono font-medium text-black">
                      {policy.policyNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Policy Holder</p>
                        <p className="text-sm font-medium text-black">
                          {policy.holderName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Premium</p>
                        <p className="text-sm font-medium text-black">
                          ${policy.premium.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Days Until Lapse</p>
                        <p className="text-sm font-medium text-black">
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

