'use client';

export type Policy = {
  id: string;
  carrier: 'Combined' | 'American Amicable' | string;
  insuredFirstName: string;
  insuredLastName: string;
  phone?: string | null;
  statuses: string[];
  daysToLapse?: number | null;
};

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ActionAndSeverity {
  action: string;
  severity: Severity;
}

export function deriveActionAndSeverity(statuses: string[]): ActionAndSeverity {
  // Combined Insurance
  if (statuses.includes('Lapse-Pending')) {
    return {
      action: 'Policy is about to lapse - contact client immediately',
      severity: 'critical'
    };
  }

  // American Amicable - Payment issues
  if (statuses.includes('Act-Pastdue') || statuses.includes('IssNotPaid')) {
    return {
      action: 'Notify client to pay outstanding premium',
      severity: 'high'
    };
  }

  // American Amicable - Missing information
  if (statuses.includes('Pending') || statuses.includes('NeedReqmnt')) {
    return {
      action: 'Missing information - review with carrier to determine next steps',
      severity: 'medium'
    };
  }

  return {
    action: 'Monitor',
    severity: 'low'
  };
}

interface LapseTableProps {
  carrierLabel: 'Combined' | 'American Amicable';
  policies: Policy[];
  derive: typeof deriveActionAndSeverity;
  showPhone?: boolean;
}

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const severityBgColors: Record<Severity, string> = {
  critical: 'bg-white hover:bg-slate-50',
  high: 'bg-amber-50 hover:bg-amber-100',
  medium: 'bg-yellow-50 hover:bg-yellow-100',
  low: 'bg-white hover:bg-slate-50'
};

export default function LapseTable({ carrierLabel, policies, derive, showPhone = true }: LapseTableProps) {
  // Sort by severity, then by daysToLapse
  const sortedPolicies = [...policies].sort((a, b) => {
    const aResult = derive(a.statuses);
    const bResult = derive(b.statuses);

    // First, sort by severity
    const severityDiff = severityOrder[aResult.severity] - severityOrder[bResult.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by daysToLapse (ascending)
    const aDays = a.daysToLapse ?? Infinity;
    const bDays = b.daysToLapse ?? Infinity;
    return aDays - bDays;
  });

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm p-6">
      <h3 className="text-xl font-semibold text-black mb-4">{carrierLabel}</h3>

      {sortedPolicies.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">No policies currently flagged.</p>
        </div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th scope="col" className="text-left text-sm font-semibold text-slate-700 p-3 sticky top-0 bg-white z-10 border-b border-slate-200">
                  First Name
                </th>
                <th scope="col" className="text-left text-sm font-semibold text-slate-700 p-3 sticky top-0 bg-white z-10 border-b border-slate-200">
                  Last Name
                </th>
                {showPhone && (
                  <th scope="col" className="text-left text-sm font-semibold text-slate-700 p-3 sticky top-0 bg-white z-10 border-b border-slate-200">
                    Phone
                  </th>
                )}
                <th scope="col" className="text-left text-sm font-semibold text-slate-700 p-3 sticky top-0 bg-white z-10 border-b border-slate-200">
                  Recommended Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPolicies.map((policy) => {
                const { action, severity } = derive(policy.statuses);
                const bgColor = severityBgColors[severity];

                return (
                  <tr
                    key={policy.id}
                    className={`border-b border-slate-100 transition-colors ${bgColor}`}
                  >
                    <td className="text-sm text-slate-900 p-3">
                      {policy.insuredFirstName}
                    </td>
                    <td className="text-sm text-slate-900 p-3">
                      {policy.insuredLastName}
                    </td>
                    {showPhone && (
                      <td className="text-sm text-slate-600 p-3">
                        {policy.phone || '—'}
                      </td>
                    )}
                    <td className="text-sm text-slate-900 p-3">
                      <span className={`inline-flex items-center gap-2 ${
                        severity === 'critical' ? 'font-semibold text-black' :
                        severity === 'high' ? 'font-medium text-amber-700' :
                        severity === 'medium' ? 'text-yellow-700' :
                        'text-slate-600'
                      }`}>
                        {action}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

