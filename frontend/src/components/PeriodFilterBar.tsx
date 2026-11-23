import React from 'react';
import {
  Calendar,
  Clock,
  Filter,
  X,
  Sparkles,
  ChevronDown,
  CalendarRange,
} from 'lucide-react';
import {
  PeriodFilterConfig,
  PeriodFilterMode,
  MONTH_NAMES_ID,
  MONTH_NAMES_EN,
  extractAvailableDates,
} from '../utils/periodAnalytics.js';
import { RankedPostItem } from '../services/api.js';

interface PeriodFilterBarProps {
  posts: RankedPostItem[];
  config: PeriodFilterConfig;
  onChange: (newConfig: PeriodFilterConfig) => void;
  activeLabel: string;
  hasActiveFilter: boolean;
  totalFiltered: number;
  totalOriginal: number;
  language?: string;
}

export const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({
  posts,
  config,
  onChange,
  activeLabel,
  hasActiveFilter,
  totalFiltered,
  totalOriginal,
  language = 'id',
}) => {
  const monthNames = language === 'id' ? MONTH_NAMES_ID : MONTH_NAMES_EN;
  const { years, monthsByYear, hasPostedAtData, validDatesCount } =
    React.useMemo(() => extractAvailableDates(posts), [posts]);

  // Current year & month fallback
  const currentYear = config.year ?? (years[0] || new Date().getFullYear());
  const currentMonth = config.month ?? new Date().getMonth();

  const handleModeChange = (mode: PeriodFilterMode) => {
    if (mode === 'YEAR') {
      onChange({
        mode: 'YEAR',
        year: currentYear,
      });
    } else if (mode === 'MONTH') {
      onChange({
        mode: 'MONTH',
        year: currentYear,
        month: currentMonth,
      });
    } else if (mode === 'CUSTOM') {
      onChange({
        mode: 'CUSTOM',
        customStartDate: config.customStartDate || '',
        customEndDate: config.customEndDate || '',
      });
    } else {
      onChange({ mode });
    }
  };

  const handleReset = () => {
    onChange({ mode: 'ALL' });
  };

  return (
    <div className="card-surface p-4 sm:p-5 bg-white dark:bg-[#12141A] border border-black/10 dark:border-white/10 rounded-2xl space-y-3.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold tracking-tight text-ink-primary-light dark:text-ink-primary-dark font-display uppercase font-mono">
                {language === 'id' ? 'Filter Periode & Rentang Waktu Konten' : 'Content Period & Date Filter'}
              </h4>
              {hasActiveFilter && (
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse inline-block" />
              )}
            </div>
            <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark">
              {language === 'id'
                ? 'Hitung ulang ER dan performa khusus postingan pada bulan atau kurun waktu tertentu.'
                : 'Filter and recalculate ER specifically for posts from a chosen month or timeframe.'}
            </p>
          </div>
        </div>

        {/* Badge of posts with genuine timestamps */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {validDatesCount} {language === 'id' ? 'post bertanggal riil' : 'timestamped posts'}
            </span>
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-mono text-brand hover:underline font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded bg-brand/5 hover:bg-brand/10 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>{language === 'id' ? 'Reset Periode' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => handleModeChange('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            config.mode === 'ALL'
              ? 'bg-brand text-white shadow-2xs font-bold'
              : 'bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark border border-black/5 dark:border-white/5'
          }`}
        >
          {language === 'id' ? 'Semua Waktu' : 'All Time'} ({totalOriginal})
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('LAST_30_DAYS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            config.mode === 'LAST_30_DAYS'
              ? 'bg-brand text-white shadow-2xs font-bold'
              : 'bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark border border-black/5 dark:border-white/5'
          }`}
        >
          {language === 'id' ? '30 Hari Terakhir' : 'Last 30 Days'}
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('LAST_90_DAYS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            config.mode === 'LAST_90_DAYS'
              ? 'bg-brand text-white shadow-2xs font-bold'
              : 'bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark border border-black/5 dark:border-white/5'
          }`}
        >
          {language === 'id' ? '90 Hari Terakhir' : 'Last 90 Days'}
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('YEAR')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            config.mode === 'YEAR'
              ? 'bg-brand text-white shadow-2xs font-bold'
              : 'bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark border border-black/5 dark:border-white/5'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>{language === 'id' ? 'Pilih Tahun' : 'Select Year'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('MONTH')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            config.mode === 'MONTH'
              ? 'bg-brand text-white shadow-2xs font-bold'
              : 'bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark border border-black/5 dark:border-white/5'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>{language === 'id' ? 'Pilih Bulan & Tahun' : 'Select Month & Year'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('CUSTOM')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
            config.mode === 'CUSTOM'
              ? 'bg-brand text-white shadow-2xs font-bold'
              : 'bg-surface-subtle-light/70 dark:bg-surface-subtle-dark/70 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark border border-black/5 dark:border-white/5'
          }`}
        >
          <CalendarRange className="w-3 h-3" />
          <span>{language === 'id' ? 'Rentang Tanggal' : 'Custom Range'}</span>
        </button>
      </div>

      {/* Year Selector (Revealed when mode is YEAR) */}
      {config.mode === 'YEAR' && (
        <div className="p-3 bg-surface-subtle-light dark:bg-surface-subtle-dark/50 border border-black/5 dark:border-white/5 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark">
              {language === 'id' ? 'Pilih Tahun Konten:' : 'Select Year:'}
            </span>
            <select
              value={currentYear}
              onChange={(e) =>
                onChange({
                  ...config,
                  year: Number(e.target.value),
                })
              }
              className="px-3 py-1.5 bg-white dark:bg-[#1A1E2B] border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-ink-primary-light dark:text-ink-primary-dark focus:outline-hidden focus:ring-1 focus:ring-brand font-mono"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark ml-auto font-mono">
            {totalFiltered} {language === 'id' ? 'postingan pada tahun ini' : 'posts this year'}
          </span>
        </div>
      )}

      {/* Month & Year Selectors (Revealed when mode is MONTH) */}
      {config.mode === 'MONTH' && (
        <div className="p-3 bg-surface-subtle-light dark:bg-surface-subtle-dark/50 border border-black/5 dark:border-white/5 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark">
              {language === 'id' ? 'Bulan:' : 'Month:'}
            </span>
            <select
              value={currentMonth}
              onChange={(e) =>
                onChange({
                  ...config,
                  month: Number(e.target.value),
                  year: currentYear,
                })
              }
              className="px-3 py-1.5 bg-white dark:bg-[#1A1E2B] border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-ink-primary-light dark:text-ink-primary-dark focus:outline-hidden focus:ring-1 focus:ring-brand font-mono"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark">
              {language === 'id' ? 'Tahun:' : 'Year:'}
            </span>
            <select
              value={currentYear}
              onChange={(e) =>
                onChange({
                  ...config,
                  year: Number(e.target.value),
                  month: currentMonth,
                })
              }
              className="px-3 py-1.5 bg-white dark:bg-[#1A1E2B] border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-ink-primary-light dark:text-ink-primary-dark focus:outline-hidden focus:ring-1 focus:ring-brand font-mono"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark ml-auto font-mono">
            {totalFiltered} {language === 'id' ? 'postingan ditemukan' : 'posts found'}
          </span>
        </div>
      )}

      {/* Custom Date Range Picker (Revealed when mode is CUSTOM) */}
      {config.mode === 'CUSTOM' && (
        <div className="p-3 bg-surface-subtle-light dark:bg-surface-subtle-dark/50 border border-black/5 dark:border-white/5 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark">
              {language === 'id' ? 'Dari:' : 'From:'}
            </span>
            <input
              type="date"
              value={config.customStartDate || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  customStartDate: e.target.value,
                })
              }
              className="px-2.5 py-1.5 bg-white dark:bg-[#1A1E2B] border border-black/10 dark:border-white/10 rounded-lg text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:outline-hidden focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark">
              {language === 'id' ? 'Sampai:' : 'To:'}
            </span>
            <input
              type="date"
              value={config.customEndDate || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  customEndDate: e.target.value,
                })
              }
              className="px-2.5 py-1.5 bg-white dark:bg-[#1A1E2B] border border-black/10 dark:border-white/10 rounded-lg text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:outline-hidden focus:ring-1 focus:ring-brand"
            />
          </div>

          <span className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark ml-auto font-mono">
            {totalFiltered} {language === 'id' ? 'postingan ditemukan' : 'posts found'}
          </span>
        </div>
      )}

      {/* Active Filter Notification Bar */}
      {hasActiveFilter && (
        <div className="p-3 rounded-xl bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-ink-primary-light dark:text-ink-primary-dark font-medium">
              {language === 'id' ? (
                <>
                  Filter Aktif: <strong>{activeLabel}</strong> • Menampilkan{' '}
                  <strong className="text-brand font-mono">{totalFiltered}</strong> dari{' '}
                  <span className="font-mono">{totalOriginal}</span> total postingan.
                </>
              ) : (
                <>
                  Active Filter: <strong>{activeLabel}</strong> • Showing{' '}
                  <strong className="text-brand font-mono">{totalFiltered}</strong> of{' '}
                  <span className="font-mono">{totalOriginal}</span> posts.
                </>
              )}
            </span>
          </div>

          {totalFiltered === 0 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              {language === 'id'
                ? 'Tidak ada konten di periode ini'
                : 'No posts found in this period'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
