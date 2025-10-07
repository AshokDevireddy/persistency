'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { StatusBreakdown } from '@/app/page';

interface StatusBreakdownChartsProps {
  carrier: string;
  statusBreakdown: StatusBreakdown;
}

// Vibrant, modern color palette for statuses
const STATUS_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#a855f7', // violet
  '#22c55e', // green
  '#eab308', // yellow
];

export default function StatusBreakdownCharts({ carrier, statusBreakdown }: StatusBreakdownChartsProps) {
  // Filter out statuses below 1% and sort by percentage
  const minPercentage = 1.0;
  const filteredData = Object.entries(statusBreakdown)
    .filter(([_, data]) => data.percentage >= minPercentage)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .map(([status, data], index) => ({
      name: status,
      value: data.count,
      percentage: data.percentage.toFixed(2),
      color: STATUS_COLORS[index % STATUS_COLORS.length],
    }));

  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <h3 className="text-xl font-semibold text-black mb-4">{carrier} - Status Breakdown</h3>
        <p className="text-slate-600">No status data available for this time range.</p>
      </div>
    );
  }

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
              Count: <span className="font-medium text-black">{data.value.toLocaleString()}</span>
            </p>
            <p className="text-slate-600">
              Percentage: <span className="font-medium text-black">{data.percentage}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <h3 className="text-xl font-semibold text-black mb-6 text-center">
        {carrier} - Status Breakdown
      </h3>
      
      {/* Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {filteredData.map((item) => (
          <div
            key={item.name}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
            </div>
            <p className="text-lg font-bold text-black">{item.percentage}%</p>
            <p className="text-xs text-slate-500">{item.value.toLocaleString()} policies</p>
          </div>
        ))}
      </div>

      {/* Pie Chart */}
      <div className="h-80 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

