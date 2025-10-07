'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PersistencyResult } from '@/app/page';

interface PersistencyChartProps {
  results: PersistencyResult[];
}

type TimeRange = '3' | '6' | '9' | 'All';

// Modern, clean color palette
const CARRIER_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
const STATUS_COLORS = {
  active: '#10b981', // Modern green
  inactive: '#ef4444', // Modern red
};

export default function PersistencyChart({ results }: PersistencyChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('All');
  
  // Aggregate all carriers into Active vs Inactive for selected time range
  const totalActive = results.reduce((sum, result) => sum + result.timeRanges[selectedTimeRange].positiveCount, 0);
  const totalInactive = results.reduce((sum, result) => sum + result.timeRanges[selectedTimeRange].negativeCount, 0);
  const total = totalActive + totalInactive;

  // Prepare data for combined pie chart
  const chartData = [
    {
      name: 'Active',
      value: totalActive,
      percentage: total > 0 ? ((totalActive / total) * 100).toFixed(2) : 0,
      color: STATUS_COLORS.active,
    },
    {
      name: 'Inactive',
      value: totalInactive,
      percentage: total > 0 ? ((totalInactive / total) * 100).toFixed(2) : 0,
      color: STATUS_COLORS.inactive,
    }
  ];

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
    <div>
      {/* Time Range Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg border-2 border-slate-200 bg-white p-1">
          {(['3', '6', '9', 'All'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                selectedTimeRange === range
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-slate-50'
              }`}
            >
              {range === 'All' ? 'All Time' : `${range} Months`}
            </button>
          ))}
        </div>
      </div>

      {/* Combined Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Overall Persistency */}
        <div className="p-5 rounded-xl border-2 border-slate-200 bg-white hover:shadow-lg transition-shadow">
          <div className="mb-3">
            <h3 className="font-semibold text-black">Overall Persistency</h3>
            <p className="text-xs text-slate-500">
              {selectedTimeRange === 'All' ? 'All Time' : `${selectedTimeRange} Months`}
            </p>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-black">
                {total > 0 ? ((totalActive / total) * 100).toFixed(2) : 0}%
              </p>
              <p className="text-xs text-slate-600">All Carriers Combined</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Total Policies: <span className="font-medium text-black">{total.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Active Policies */}
        <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
          <div className="mb-3">
            <h3 className="font-semibold text-green-900">Active Policies</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-green-600">
                {totalActive.toLocaleString()}
              </p>
              <p className="text-xs text-green-700">Persisting Across All Carriers</p>
            </div>
          </div>
        </div>

        {/* Inactive Policies */}
        <div className="p-5 rounded-xl border-2 border-red-200 bg-red-50 hover:shadow-lg transition-shadow">
          <div className="mb-3">
            <h3 className="font-semibold text-red-900">Inactive Policies</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-red-600">
                {totalInactive.toLocaleString()}
              </p>
              <p className="text-xs text-red-700">Terminated Across All Carriers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Carrier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                style={{ backgroundColor: CARRIER_COLORS[index % CARRIER_COLORS.length] }}
              />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-3xl font-bold text-black">
                  {result.timeRanges[selectedTimeRange].positivePercentage.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-600">
                  Persistency Rate ({selectedTimeRange === 'All' ? 'All Time' : `${selectedTimeRange} Months`})
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium text-black">
                      {result.timeRanges[selectedTimeRange].positiveCount.toLocaleString()}
                    </p>
                    <p className="text-slate-500">Active</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-600">
                      {result.timeRanges[selectedTimeRange].negativeCount.toLocaleString()}
                    </p>
                    <p className="text-slate-500">Inactive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Combined Pie Chart */}
      <div className="h-96 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percentage, value }) => `${name}: ${percentage}% (${value.toLocaleString()})`}
              outerRadius={140}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

