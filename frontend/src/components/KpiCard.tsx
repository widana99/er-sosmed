import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  accentColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'text-brand',
}) => {
  return (
    <div className="craft-card p-5 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark">
          {title}
        </span>
        <div className={`p-2 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark ${accentColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-ink-tertiary-light dark:text-ink-tertiary-dark mt-2 font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
};
export default KpiCard;
