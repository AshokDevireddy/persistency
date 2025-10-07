'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PersistencyResult } from '@/app/page';

interface PersistencyChartProps {
  results: PersistencyResult[];
}

const COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5'];

export default function PersistencyChart({ results }: PersistencyChartProps) {
  // Prepare data for pie chart
  const chartData = results.map((result, index) => ({
    name: result.carrier,
    value: result.persistencyRate,
    activePolicies: result.activePolicies,
    lapsedPolicies: result.lapsedPolicies,
    totalPolicies: result.totalPolicies,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-300 rounded-lg shadow-xl p-4">
          <p className="font-semibold text-black mb-2">
            {data.name}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600">
              Persistency Rate: <span className="font-medium text-black">{data.value.toFixed(2)}%</span>
            </p>
            <p className="text-slate-600">
              Active Policies: <span className="font-medium text-black">{data.activePolicies}</span>
            </p>
            <p className="text-slate-600">
              Lapsed Policies: <span className="font-medium text-slate-600">{data.lapsedPolicies}</span>
            </p>
            <p className="text-slate-600">
              Total Policies: <span className="font-medium text-black">{data.totalPolicies}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {results.map((result, index) => (
          <div
            key={result.carrier}
            className="p-5 rounded-xl border-2 border-slate-200 bg-white hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-black">
                {result.carrier}
              </h3>
              <div
                className="w-4 h-4 rounded-full border border-slate-300"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-3xl font-bold text-black">
                  {result.persistencyRate.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-600">Persistency Rate</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium text-black">
                      {result.activePolicies}
                    </p>
                    <p className="text-slate-500">Active</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-600">
                      {result.lapsedPolicies}
                    </p>
                    <p className="text-slate-500">Lapsed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pie Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

