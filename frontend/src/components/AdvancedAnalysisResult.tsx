import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  DollarSign,
  Activity,
  MessageSquare,
  Heart,
  Eye,
  Share2,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import { ComprehensiveAnalysisResult, RankedPostItem } from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext.js';
import { PeriodFilterBar } from './PeriodFilterBar.js';
import {
  PeriodFilterConfig,
  filterPostsByPeriod,
  computeFilteredAnalytics,
} from '../utils/periodAnalytics.js';

interface AdvancedAnalysisResultProps {
  data: ComprehensiveAnalysisResult;
  onReset?: () => void;
}

type SortField = 'rank' | 'likes' | 'comments' | 'views' | 'shares' | 'postER' | 'date';
type SortDir = 'asc' | 'desc';

export const AdvancedAnalysisResult: React.FC<AdvancedAnalysisResultProps> = ({
  data: rawData,
  onReset,
}) => {
  const { t, language } = useLanguage();
  const [selectedPost, setSelectedPost] = useState<RankedPostItem | null>(null);
  const [sortField, setSortField] = useState<SortField>('postER');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [periodConfig, setPeriodConfig] = useState<PeriodFilterConfig>({ mode: 'ALL' });

  // Period filtering
  const { filteredPosts, label: periodLabel, hasActiveFilter } = useMemo(() => {
    return filterPostsByPeriod(rawData.postsRanked, periodConfig, language);
  }, [rawData.postsRanked, periodConfig, language]);

  // Dynamically recalculated analytics data
  const data = useMemo(() => {
    if (!hasActiveFilter) return rawData;
    return computeFilteredAnalytics(rawData, filteredPosts);
  }, [rawData, filteredPosts, hasActiveFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      switch (sortField) {
        case 'rank':
          aVal = a.index;
          bVal = b.index;
          break;
        case 'date':
          aVal = a.postedAt ? new Date(a.postedAt).getTime() : 0;
          bVal = b.postedAt ? new Date(b.postedAt).getTime() : 0;
          break;
        case 'likes':
          aVal = a.likes;
          bVal = b.likes;
          break;
        case 'comments':
          aVal = a.comments;
          bVal = b.comments;
          break;
        case 'views':
          aVal = a.views || 0;
          bVal = b.views || 0;
          break;
        case 'shares':
          aVal = a.shares || 0;
          bVal = b.shares || 0;
          break;
        case 'postER':
        default:
          aVal = a.postER;
          bVal = b.postER;
          break;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [filteredPosts, sortField, sortDir]);

  // Compute Delta between Average and Median
  const erDelta = Number((data.averageER - data.medianER).toFixed(2));
  const isSkewed = Math.abs(erDelta) >= 1.5;

  // Determine Bot Risk Styling & Label
  const botRiskConfig = {
    LOW: {
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: ShieldCheck,
      label: language === 'id' ? 'Risiko Bot Rendah (Organik)' : language === 'ms' ? 'Risiko Bot Rendah (Organik)' : 'Low Bot Risk (Organic)',
    },
    MODERATE: {
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Info,
      label: language === 'id' ? 'Risiko Moderat (Periksa Komentar)' : language === 'ms' ? 'Risiko Sederhana' : 'Moderate Anomaly Risk',
    },
    HIGH: {
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: ShieldAlert,
      label: language === 'id' ? 'Risiko Tinggi (Pola Tidak Wajar)' : language === 'ms' ? 'Risiko Tinggi' : 'High Bot / Anomaly Risk',
    },
  }[data.botRisk];

  const BotIcon = botRiskConfig.icon;

  // Tier Badge Styling
  const getTierBadge = (tier: 'VIRAL' | 'HIGH' | 'MODERATE' | 'LOW') => {
    switch (tier) {
      case 'VIRAL':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold';
      case 'HIGH':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold';
      case 'MODERATE':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium';
      case 'LOW':
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Dossier & Account Info */}
      <div className="card-surface p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand to-cyan-500 text-white flex items-center justify-center font-display font-black text-lg shadow-sm">
              {data.username ? data.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                  @{data.username || 'User Account'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-brand/10 text-brand border border-brand/20">
                  {data.platform}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/5 dark:bg-white/5 text-ink-tertiary-light dark:text-ink-tertiary-dark">
                  {data.formulaType === 'VIEW_BASED' ? 'View-Based' : 'Follower-Based'}
                </span>
              </div>
              <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5 font-mono">
                {data.followers.toLocaleString()} {t.followers.toLowerCase()} •{' '}
                {hasActiveFilter ? (
                  <span>
                    <strong className="text-brand">{data.sampleSize}</strong> dari{' '}
                    {rawData.postsRanked.length} {t.posts.toLowerCase()} sampel ({periodLabel})
                  </span>
                ) : (
                  <span>
                    {data.sampleSize} {t.posts.toLowerCase()} sampel
                  </span>
                )}
              </p>
            </div>
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition-all text-ink-secondary-light dark:text-ink-secondary-dark shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Ubah Data Postingan' : 'Edit Post Data'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Period & Date Filter Bar */}
      <PeriodFilterBar
        posts={rawData.postsRanked}
        config={periodConfig}
        onChange={setPeriodConfig}
        activeLabel={periodLabel}
        hasActiveFilter={hasActiveFilter}
        totalFiltered={filteredPosts.length}
        totalOriginal={rawData.postsRanked.length}
        language={language}
      />

      {data.sampleSize === 0 ? (
        <div className="card-surface p-12 text-center rounded-2xl border border-black/10 dark:border-white/10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink-primary-light dark:text-ink-primary-dark">
              {language === 'id'
                ? 'Tidak Ada Postingan Pada Periode Ini'
                : 'No Posts Found in Selected Period'}
            </h3>
            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark max-w-md mx-auto">
              {language === 'id'
                ? `Akun @${rawData.username || ''} tidak memiliki data postingan publik pada kurun waktu "${periodLabel}". Silakan pilih bulan lain atau kembali ke Semua Waktu.`
                : `No public posts found for @${rawData.username || ''} during "${periodLabel}".`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPeriodConfig({ mode: 'ALL' })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white font-semibold text-xs shadow-xs hover:bg-brand-hover transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Tampilkan Semua Postingan' : 'Show All Posts'}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="card-surface p-6 sm:p-8 space-y-6">
            {/* 2. Median ER vs Average ER Hero Banner (The Gold Standard) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Main Median ER Box */}
          <div className="md:col-span-7 p-6 rounded-2xl bg-gradient-to-br from-brand/10 via-brand/5 to-transparent border border-brand/20 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                  {language === 'id' ? 'Golden Metric: Median ER' : 'Gold Standard: Median ER'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand/10 text-brand border border-brand/20 font-semibold">
                {language === 'id' ? 'Tahan Bias Outlier' : 'Outlier Robust'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark tabular-nums">
                {data.medianER}%
              </span>
              <span className="text-xs text-ink-tertiary-light dark:text-ink-tertiary-dark font-sans">
                {language === 'id' ? 'nilai tengah riil performa postingan' : 'true middle performance across posts'}
              </span>
            </div>

            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed pt-1">
              {language === 'id'
                ? 'Median merefleksikan engagement harian aktual yang paling dapat diandalkan oleh brand/organisasi, tidak dapat dimanipulasi oleh 1 video viral semata.'
                : 'Median represents the most reliable baseline day-to-day engagement, completely immune to single viral spikes.'}
            </p>
          </div>

          {/* Average ER & Skew Commentary Box */}
          <div className="md:col-span-5 p-6 rounded-2xl bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 border border-black/5 dark:border-white/5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                <span>{language === 'id' ? 'Rata-Rata Biasa (Mean)' : 'Simple Average'}</span>
                <span className="font-bold text-ink-primary-light dark:text-ink-primary-dark">
                  {data.averageER}%
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    erDelta > 0
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {erDelta > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {erDelta > 0 ? `+${erDelta}%` : `${erDelta}%`}{' '}
                    {language === 'id' ? 'Selisih' : 'Delta'}
                  </span>
                </div>
                <span className="text-[11px] font-sans text-ink-tertiary-light dark:text-ink-tertiary-dark">
                  {isSkewed
                    ? (language === 'id' ? 'Terdorong Postingan Viral' : 'Viral-driven skew')
                    : (language === 'id' ? 'Distribusi Merata' : 'Evenly balanced')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed border-t border-black/5 dark:border-white/5 pt-2.5">
              {isSkewed
                ? language === 'id'
                  ? `Perhatian: Rata-rata (${data.averageER}%) lebih tinggi dari Median (${data.medianER}%). Akun memiliki postingan outlier viral yang menaikkan rata-rata.`
                  : `Note: Mean (${data.averageER}%) exceeds Median (${data.medianER}%). Performance is buoyed by one or two viral breakout posts.`
                : language === 'id'
                ? `Rata-rata dan Median selaras (${data.medianER}%). Performa audiens akun ini sangat konsisten dari postingan ke postingan.`
                : `Average and Median closely align (${data.medianER}%). The audience demonstrates highly consistent content reception.`}
            </p>
          </div>
        </div>

        {/* 3. 4-Card Performance Spread Grid (Min, Max, Spread, IQR) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Min ER (Floor) */}
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark block">
              {language === 'id' ? 'Batas Bawah (Floor)' : 'Minimum ER (Floor)'}
            </span>
            <div className="text-2xl font-bold font-mono text-rose-500 tabular-nums">
              {data.minER}%
            </div>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              {language === 'id' ? 'Titik performa terlemah' : 'Lowest observed post'}
            </p>
          </div>

          {/* Max ER (Ceiling) */}
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark block">
              {language === 'id' ? 'Puncak Viral (Ceiling)' : 'Maximum ER (Peak)'}
            </span>
            <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
              {data.maxER}%
            </div>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              {language === 'id' ? 'Postingan performa terbaik' : 'Best performing viral post'}
            </p>
          </div>

          {/* Spread Range */}
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark block">
              {language === 'id' ? 'Rentang Sebaran (Spread)' : 'Spread Range'}
            </span>
            <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
              {data.spreadRange}%
            </div>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              {language === 'id' ? 'Selisih Maksimum & Minimum' : 'Max minus Min ER gap'}
            </p>
          </div>

          {/* IQR (Interquartile Range) */}
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark block">
              {language === 'id' ? 'Rentang Inti (IQR)' : 'Interquartile (IQR)'}
            </span>
            <div className="text-2xl font-bold font-mono text-brand tabular-nums">
              {data.quartiles.iqr}%
            </div>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              Q3 ({data.quartiles.q3}%) - Q1 ({data.quartiles.q1}%)
            </p>
          </div>
        </div>
      </div>

      {/* 4. Distribution Tiers & Performance Dossier (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Distribution Breakdown */}
        <div className="lg:col-span-6 card-surface p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold tracking-tight font-display text-ink-primary-light dark:text-ink-primary-dark">
                {language === 'id' ? 'Distribusi Kategori Performa Konten' : 'Performance Distribution Tiers'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
              {data.sampleSize} posts
            </span>
          </div>

          <div className="space-y-4">
            {/* Viral Tier (> 8%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Viral / Breakout (&gt; 8.0%)</span>
                </span>
                <span className="font-mono text-ink-secondary-light dark:text-ink-secondary-dark font-medium">
                  {data.distribution.viralCount} post ({data.distribution.viralPct}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(data.distribution.viralPct, 2)}%` }}
                />
              </div>
            </div>

            {/* High Tier (5.0% - 8.0%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>High Interactivity (5.0% - 8.0%)</span>
                </span>
                <span className="font-mono text-ink-secondary-light dark:text-ink-secondary-dark font-medium">
                  {data.distribution.highCount} post ({data.distribution.highPct}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(data.distribution.highPct, 2)}%` }}
                />
              </div>
            </div>

            {/* Moderate Tier (2.0% - 5.0%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Normal / Steady (2.0% - 5.0%)</span>
                </span>
                <span className="font-mono text-ink-secondary-light dark:text-ink-secondary-dark font-medium">
                  {data.distribution.moderateCount} post ({data.distribution.moderatePct}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(data.distribution.moderatePct, 2)}%` }}
                />
              </div>
            </div>

            {/* Low Tier (< 2.0%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Low / Passive (&lt; 2.0%)</span>
                </span>
                <span className="font-mono text-ink-secondary-light dark:text-ink-secondary-dark font-medium">
                  {data.distribution.lowCount} post ({data.distribution.lowPct}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(data.distribution.lowPct, 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quartiles Detail Bar */}
          <div className="p-3.5 rounded-xl bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 border border-black/5 dark:border-white/5 space-y-2 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark block font-semibold">
              Kuartil Posisi Konten
            </span>
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                <span className="text-[10px] text-ink-tertiary-light block">Q1 (25%)</span>
                <span className="font-bold text-ink-primary-light dark:text-ink-primary-dark">
                  {data.quartiles.q1}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-brand/10 border border-brand/20">
                <span className="text-[10px] text-brand block font-semibold">Q2 (Median)</span>
                <span className="font-bold text-brand">{data.quartiles.median}%</span>
              </div>
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                <span className="text-[10px] text-ink-tertiary-light block">Q3 (75%)</span>
                <span className="font-bold text-ink-primary-light dark:text-ink-primary-dark">
                  {data.quartiles.q3}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance Dossier & Quality Assessment */}
        <div className="lg:col-span-6 card-surface p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold tracking-tight font-display text-ink-primary-light dark:text-ink-primary-dark">
                {language === 'id' ? 'Dossier Kualitas & Analisis Risiko' : 'Quality Dossier & Risk Assessment'}
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/10 text-brand font-semibold">
              AI Verification
            </span>
          </div>

          <div className="space-y-4">
            {/* 1. Consistency Score */}
            <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                  {language === 'id' ? 'Skor Konsistensi Audiens' : 'Consistency Score'}
                </span>
                <span className="text-sm font-bold font-mono text-brand">
                  {data.consistencyScore}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-500"
                  style={{ width: `${data.consistencyScore}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark leading-relaxed">
                {data.consistencyScore >= 70
                  ? (language === 'id' ? 'Tinggi: Konten selalu menghasilkan keterlibatan stabil tanpa lonjakan jatuh ekstrem.' : 'High: Posts consistently generate engagement without sharp erratic drops.')
                  : data.consistencyScore >= 40
                  ? (language === 'id' ? 'Moderat: Fluktuasi normal tergantung topik dan waktu penayangan.' : 'Moderate: Normal variation across different content topics.')
                  : (language === 'id' ? 'Fluktuatif Tinggi: Terdapat kesenjangan masif antar konten.' : 'High Volatility: Large discrepancies between posts.')}
              </p>
            </div>

            {/* 2. Comment to Like Ratio (Audience Loyalty) */}
            <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                  {language === 'id' ? 'Rasio Komentar / Suka (Loyalitas)' : 'Comment-to-Like Ratio'}
                </span>
                <span className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {data.commentToLikeRatio}%
                </span>
              </div>
              <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark leading-relaxed">
                {data.commentToLikeRatio >= 2.0
                  ? (language === 'id' ? '🔥 Audiens Sangat Loyal & Aktif Berdiskusi (Top 10% engagement)' : '🔥 Highly active conversational audience.')
                  : data.commentToLikeRatio >= 0.5
                  ? (language === 'id' ? '✓ Rasio Interaksi Normal & Sehat' : '✓ Healthy standard interaction ratio.')
                  : (language === 'id' ? '⚠️ Rasio komentar sangat rendah dibanding likes (kemungkinan audiens pasif atau auto-likes)' : '⚠️ Very low comments relative to likes.')}
              </p>
            </div>

            {/* 3. Bot Risk Assessment Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${botRiskConfig.badgeBg}`}>
              <BotIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold block">{botRiskConfig.label}</span>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {data.botRiskReason || (language === 'id' ? 'Pola interaksi terverifikasi wajar dan organik.' : 'Organic engagement pattern verified.')}
                </p>
              </div>
            </div>

            {/* 4. Fair Rate Card Endorsement Valuation */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                  {language === 'id' ? 'Estimasi Rate Card Endorsement' : 'Fair Rate Card Valuation'}
                </span>
                <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark">
                  {language === 'id' ? 'Berdasarkan Median ER & Jangkauan Riil' : 'Based on Median ER & active audience'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm sm:text-base font-bold font-mono text-ink-primary-light dark:text-ink-primary-dark">
                  {data.rateCardValuation.formatted}
                </span>
                <span className="text-[10px] font-mono text-ink-tertiary-light block">
                  / sponsored post
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Ranked Posts Performance Matrix */}
      <div className="card-surface p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
          <div>
            <h3 className="text-base font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              {language === 'id' ? 'Peringkat Kinerja Tiap Postingan' : 'Individual Post Performance Ranking'}
            </h3>
            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
              {language === 'id'
                ? `Diurutkan berdasarkan ${
                    sortField === 'postER'
                      ? 'Post ER'
                      : sortField === 'likes'
                      ? 'Jumlah Suka'
                      : sortField === 'views'
                      ? 'Tayangan (Views)'
                      : sortField === 'comments'
                      ? 'Komentar'
                      : sortField === 'shares'
                      ? 'Shares'
                      : 'Urutan'
                  } (${sortDir === 'desc' ? 'Tertinggi ke Terendah' : 'Terendah ke Tertinggi'}). Klik judul kolom untuk mengurutkan.`
                : `Sorted by ${sortField} (${sortDir}). Click headers to change sort order.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {sortField !== 'postER' && (
              <button
                type="button"
                onClick={() => {
                  setSortField('postER');
                  setSortDir('desc');
                }}
                className="text-[11px] font-medium text-brand hover:underline flex items-center gap-1"
              >
                Reset ke ER Tertinggi
              </button>
            )}
            <span className="text-xs font-mono font-bold text-brand">
              {data.postsRanked.length} {t.posts.toLowerCase()}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle-light/80 dark:bg-surface-subtle-dark/80 border-b border-black/5 dark:border-white/5 font-mono uppercase text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              <tr>
                <th
                  onClick={() => handleSort('rank')}
                  className="py-2.5 px-3 w-12 text-center cursor-pointer hover:text-ink-primary-light dark:hover:text-ink-primary-dark transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-0.5">
                    Rank
                    {sortField === 'rank' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-brand" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 font-mono cursor-pointer hover:text-ink-primary-light dark:hover:text-ink-primary-dark transition-colors select-none whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-0.5">
                    Tanggal
                    {sortField === 'date' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-brand" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th className="py-2.5 px-3 min-w-[200px]">{t.caption}</th>
                <th
                  onClick={() => handleSort('likes')}
                  className="py-2.5 px-3 font-mono cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-0.5">
                    {t.likes}
                    {sortField === 'likes' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-brand" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('comments')}
                  className="py-2.5 px-3 font-mono cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-0.5">
                    {t.comments}
                    {sortField === 'comments' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-brand" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('views')}
                  className="py-2.5 px-3 font-mono cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-0.5">
                    {t.views}
                    {sortField === 'views' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-brand" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('shares')}
                  className="py-2.5 px-3 font-mono cursor-pointer hover:text-ink-primary-light dark:hover:text-ink-primary-dark transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-0.5">
                    Shares
                    {sortField === 'shares' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-brand" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('postER')}
                  className="py-2.5 px-3 font-mono text-right cursor-pointer hover:text-brand transition-colors select-none"
                >
                  <span className="inline-flex items-center justify-end gap-0.5 w-full">
                    Post ER
                    {sortField === 'postER' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="w-2.5 h-2.5 text-brand" />
                      ) : (
                        <ArrowUp className="w-2.5 h-2.5 text-brand" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                </th>
                <th className="py-2.5 px-3 text-center">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
              {sortedPosts.map((post, idx) => (
                <tr
                  key={post.index}
                  className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30'
                          : idx === 1
                          ? 'bg-zinc-400/20 text-zinc-600 dark:text-zinc-300 font-bold'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500 font-bold'
                          : 'text-ink-tertiary-light'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-ink-secondary-light dark:text-ink-secondary-dark font-mono text-[11px] whitespace-nowrap">
                    {post.postedAt ? (
                      <span title={new Date(post.postedAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}>
                        {new Date(post.postedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-ink-tertiary-light opacity-40">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 max-w-[240px] truncate font-sans text-ink-primary-light dark:text-ink-primary-dark">
                    {post.caption || `Post #${post.index}`}
                  </td>
                  <td className="py-2.5 px-3 text-pink-600 dark:text-pink-400 font-semibold">
                    {post.likes.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-semibold">
                    {post.comments.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">
                    {post.views !== null && post.views !== undefined
                      ? post.views.toLocaleString()
                      : data.platform === 'INSTAGRAM'
                      ? 'N/A (Foto)'
                      : '0'}
                  </td>
                  <td className="py-2.5 px-3 text-ink-tertiary-light">
                    {post.shares !== null && post.shares !== undefined
                      ? post.shares.toLocaleString()
                      : '0'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-sm text-ink-primary-light dark:text-ink-primary-dark">
                    {post.postER}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getTierBadge(
                        post.tier
                      )}`}
                    >
                      {post.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
          </>
        )}
    </div>
  );
};
