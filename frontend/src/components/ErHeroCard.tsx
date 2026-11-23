import React, { useState } from 'react';
import { Info, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';

interface ErHeroCardProps {
  engagementRate: number;
  formulaType: 'FOLLOWER_BASED' | 'VIEW_BASED' | 'REACH_BASED';
  sampleSize: number;
  averageLikes: number;
  averageComments: number;
  averageViews?: number | null;
  averageShares?: number | null;
  followers?: number;
  source: string;
  analyzedAt?: string;
  isAnomalous?: boolean;
}

export const ErHeroCard: React.FC<ErHeroCardProps> = ({
  engagementRate,
  formulaType,
  sampleSize,
  averageLikes,
  averageComments,
  averageViews,
  averageShares,
  followers = 0,
  source,
  analyzedAt,
  isAnomalous = false,
}) => {
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);
  const { t, language } = useLanguage();

  const isFollowerBased = formulaType === 'FOLLOWER_BASED';
  const sourceIsSimulated = source?.toUpperCase() === 'SIMULATED';

  // Benchmark evaluation for clean, friendly UX
  let erBadgeColor = 'text-amber-600 bg-amber-500/10 border-amber-500/20';
  let erBenchmarkLabel = language === 'id' ? 'Cukup Baik' : language === 'ms' ? 'Memuaskan' : 'Good Performance';

  if (engagementRate >= 5.0) {
    erBadgeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    erBenchmarkLabel = language === 'id' ? 'Sangat Tinggi (Viral/Hot)' : language === 'ms' ? 'Sangat Tinggi' : 'High Engagement';
  } else if (engagementRate < 2.0) {
    erBadgeColor = 'text-neutral-600 dark:text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
    erBenchmarkLabel = language === 'id' ? 'Rata-rata Normal' : language === 'ms' ? 'Sederhana' : 'Average';
  }

  return (
    <div className="card-surface p-6 relative overflow-hidden">
      {/* Top Bar with Status & Formula Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-secondary-light dark:text-ink-secondary-dark">
            {t.erTitle}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-lg font-mono bg-brand/10 text-brand font-medium border border-brand/15">
            {isFollowerBased ? t.followerBased : t.viewBased}
          </span>
        </div>

        {sourceIsSimulated ? (
          <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-lg font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold">
            <Sparkles className="w-3 h-3" />
            {t.simulatedData}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-lg font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            {t.realtimeData}
          </span>
        )}
      </div>

      {/* Main Metric Display with Syne Display Typography */}
      <div className="flex items-baseline gap-3 my-2">
        <span className="text-5xl font-extrabold tracking-tight font-display tabular-nums text-ink-primary-light dark:text-ink-primary-dark">
          {engagementRate.toFixed(2)}%
        </span>
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${erBadgeColor}`}>
          {erBenchmarkLabel}
        </span>
        {isAnomalous && (
          <span className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-900 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            Spike
          </span>
        )}
      </div>

      {/* Friendly UX Description */}
      <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-1 mb-4">
        {t.erSubtitle}
      </p>

      {/* Quick Averages Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-black/5 dark:border-white/5 text-xs">
        <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
          <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[11px] mb-0.5">{t.avgLikes}</span>
          <span className="font-mono font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
            {averageLikes.toLocaleString()}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
          <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[11px] mb-0.5">{t.avgComments}</span>
          <span className="font-mono font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
            {averageComments.toLocaleString()}
          </span>
        </div>
        {averageViews ? (
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[11px] mb-0.5">{t.avgViews}</span>
            <span className="font-mono font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
              {averageViews.toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
            <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[11px] mb-0.5">{t.followers}</span>
            <span className="font-mono font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
              {followers.toLocaleString()}
            </span>
          </div>
        )}
        <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
          <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[11px] mb-0.5">{t.sampleSize}</span>
          <span className="font-mono font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
            {sampleSize} posts
          </span>
        </div>
      </div>

      {/* Formula Transparency Drawer / Friendly Explanation */}
      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFormulaTooltip(!showFormulaTooltip)}
          className="text-xs text-brand hover:underline flex items-center gap-1.5 font-medium"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showFormulaTooltip ? (language === 'id' ? 'Tutup penjelasan rumus' : 'Hide calculation') : t.formulaCalculation}</span>
        </button>
        {analyzedAt && (
          <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
            {new Date(analyzedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {showFormulaTooltip && (
        <div className="mt-3 p-3.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/10 text-xs animate-in fade-in duration-150 space-y-1.5">
          <p className="font-semibold text-ink-primary-light dark:text-ink-primary-dark">
            {t.formulaDesc}
          </p>
          <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-[11px] text-brand">
            {isFollowerBased ? (
              <span>(({averageLikes} Suka + {averageComments} Komen) / {followers.toLocaleString()} Pengikut) × 100 = <strong>{engagementRate}%</strong></span>
            ) : (
              <span>(({averageLikes} Suka + {averageComments} Komen + {averageShares || 0} Share) / {averageViews?.toLocaleString() || 1} Views) × 100 = <strong>{engagementRate}%</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
