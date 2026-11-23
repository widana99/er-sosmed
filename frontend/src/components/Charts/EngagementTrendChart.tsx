import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  er: number;
  likes?: number;
  comments?: number;
}

interface EngagementTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

export const EngagementTrendChart: React.FC<EngagementTrendChartProps> = ({
  data,
  title = 'Engagement Rate Trend (%)',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="card-surface p-6 h-72 flex items-center justify-center text-ink-tertiary-light dark:text-ink-tertiary-dark text-xs font-mono">
        No trend data recorded yet.
      </div>
    );
  }

  return (
    <div className="card-surface p-6 bg-white dark:bg-[#12141A]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
          {title}
        </h3>
        <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
          {data.length} data points
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="erGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-black/5 dark:text-white/5"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono"
              domain={['auto', 'auto']}
              unit="%"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as TrendDataPoint;
                  return (
                    <div className="neoglass p-3 rounded-lg text-xs font-mono border border-black/10 dark:border-white/10 shadow-lg">
                      <p className="text-ink-secondary-light dark:text-ink-secondary-dark mb-1">{item.date}</p>
                      <p className="text-brand font-bold text-sm">
                        ER: {item.er.toFixed(2)}%
                      </p>
                      {item.likes !== undefined && (
                        <p className="text-ink-tertiary-light dark:text-ink-tertiary-dark text-[11px]">
                          Likes: {item.likes.toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="er"
              stroke="#4F46E5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#erGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
