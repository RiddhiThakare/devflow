import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '../api/axios';

interface Metrics {
  totalRuns: number;
  successRate: number;
  avgBuildTimeSeconds: number;
  dailyRuns: { date: string; count: number }[];
}

interface Props {
  projectId: string;
}

export default function MetricsPanel({ projectId }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${projectId}/metrics`).then((res) => {
      setMetrics(res.data);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading metrics...</div>;
  }

  if (!metrics || metrics.totalRuns === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No runs yet — trigger a pipeline to see metrics.
      </div>
    );
  }

  const successColor =
    metrics.successRate >= 80
      ? '#22c55e'
      : metrics.successRate >= 50
      ? '#eab308'
      : '#ef4444';

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Total Runs</p>
          <p className="text-white text-3xl font-bold">{metrics.totalRuns}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Success Rate</p>
          <p className="text-3xl font-bold" style={{ color: successColor }}>
            {metrics.successRate}%
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-1">Avg Build Time</p>
          <p className="text-white text-3xl font-bold">
            {metrics.avgBuildTimeSeconds}
            <span className="text-gray-500 text-sm font-normal ml-1">sec</span>
          </p>
        </div>
      </div>

      {/* Daily runs bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-gray-400 text-sm font-medium mb-4">
          Runs — Last 7 Days
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={metrics.dailyRuns}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(val) =>
                new Date(val).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb',
              }}
              labelFormatter={(val) =>
                new Date(val).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {metrics.dailyRuns.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.count > 0 ? '#3b82f6' : '#1f2937'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}