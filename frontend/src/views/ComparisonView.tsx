import React, { useEffect, useState } from 'react';
import { api, SocialAccount, ComparisonItem } from '../services/api.js';
import { GitCompare, Check, AlertCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

interface ComparisonViewProps {
  onNavigateTab?: (tab: any) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.listAccounts();
      setAccounts(data);
      if (data.length >= 2) {
        const initialSelected = [data[0].id, data[1].id];
        setSelectedIds(initialSelected);
        runComparison(initialSelected);
      } else if (data.length === 1) {
        setSelectedIds([data[0].id]);
      }
    } catch (err) {
      console.error('Failed to load accounts for comparison:', err);
    }
  };

  const runComparison = async (ids: string[]) => {
    if (ids.length < 2) {
      setComparison([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.compareAccounts(ids);
      setComparison(res.comparison || []);
    } catch (err) {
      console.error('Comparison run failed:', err);
      setComparison([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (id: string) => {
    let next: string[];
    if (selectedIds.includes(id)) {
      next = selectedIds.filter((item) => item !== id);
    } else {
      if (selectedIds.length >= 4) {
        // Cap at 4 accounts maximum
        next = [...selectedIds.slice(1), id];
      } else {
        next = [...selectedIds, id];
      }
    }
    setSelectedIds(next);
    runComparison(next);
  };

  const barChartData = comparison.map((item) => ({
    name: `@${item.username}`,
    er: item.engagementRate,
    followers: item.followers,
    likes: item.averageLikes,
    platform: item.platform,
  }));

  const COLORS = ['#4F46E5', '#E1306C', '#00F2FE', '#10B981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
          {t.compareTitle}
        </h1>
        <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
          {t.compareSubtitle}
        </p>
      </div>

      {/* When total accounts in system is less than 2 */}
      {accounts.length < 2 ? (
        <div className="card-surface p-12 text-center bg-white dark:bg-[#12141A] rounded-2xl border border-black/8 dark:border-white/8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <GitCompare className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-ink-primary-light dark:text-ink-primary-dark">
              {t.minTwoAccountsNeeded}
            </h3>
            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
              Sistem membutuhkan minimal 2 akun terdaftar untuk melakukan komparasi metrik dan tolok ukur rasio keterlibatan.
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('analyze')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.tabLiveSearch}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Account Selector Strip */}
          <div className="card-surface p-5 bg-white dark:bg-[#12141A]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark uppercase tracking-wider block">
                {t.selectCompareAccounts} (2 - 4 akun):
              </span>
              <span className="text-xs font-mono text-brand font-semibold">
                {selectedIds.length} / 4 terpilih
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {accounts.map((acc) => {
                const isSelected = selectedIds.includes(acc.id);
                return (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/10 text-brand font-semibold shadow-xs'
                        : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-brand text-white' : 'border border-black/20 dark:border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span>@{acc.username}</span>
                    <span className="text-[10px] opacity-70 font-mono">({acc.platform})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedIds.length < 2 ? (
            <div className="card-surface p-8 text-center bg-white dark:bg-[#12141A] rounded-xl border border-dashed border-black/15 dark:border-white/15">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                {t.minTwoAccountsNeeded}
              </p>
            </div>
          ) : (
            <>
              {/* Comparison Chart */}
              {comparison.length > 0 && (
                <div className="card-surface p-6 bg-white dark:bg-[#12141A]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                      {t.erComparison} (%)
                    </h3>
                    <span className="text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                      Semakin tinggi semakin baik
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="currentColor"
                          className="text-black/5 dark:text-white/5"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: 'currentColor' }}
                          className="text-ink-secondary-light dark:text-ink-secondary-dark font-mono"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          unit="%"
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono"
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="neoglass p-3 rounded-lg text-xs font-mono border border-black/10 dark:border-white/10 shadow-lg">
                                  <p className="font-bold text-ink-primary-light dark:text-ink-primary-dark mb-1">
                                    {data.name} ({data.platform})
                                  </p>
                                  <p className="text-brand font-bold text-sm">ER: {data.er}%</p>
                                  <p className="text-ink-tertiary-light dark:text-ink-tertiary-dark text-[11px]">
                                    Followers: {data.followers.toLocaleString()}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="er" radius={[6, 6, 0, 0]}>
                          {barChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Comparison Matrix Table */}
              <div className="card-surface p-6 bg-white dark:bg-[#12141A]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                    {t.directMatrix}
                  </h3>
                  <span className="text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                    Formula & Source Aware
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-black/5 dark:border-white/5 font-mono uppercase text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
                      <tr>
                        <th className="py-2.5 px-3">{t.metricLabel}</th>
                        {comparison.map((item) => (
                          <th key={item.id} className="py-2.5 px-3 text-right">
                            @{item.username} ({item.platform})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
                      <tr>
                        <td className="py-3 px-3 font-sans font-medium text-ink-secondary-light dark:text-ink-secondary-dark">
                          {t.followers}
                        </td>
                        {comparison.map((item) => (
                          <td
                            key={item.id}
                            className="py-3 px-3 text-right font-semibold text-ink-primary-light dark:text-ink-primary-dark"
                          >
                            {item.followers.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-medium text-ink-secondary-light dark:text-ink-secondary-dark">
                          {t.avgLikes}
                        </td>
                        {comparison.map((item) => (
                          <td key={item.id} className="py-3 px-3 text-right">
                            {item.averageLikes.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-medium text-ink-secondary-light dark:text-ink-secondary-dark">
                          {t.avgComments}
                        </td>
                        {comparison.map((item) => (
                          <td key={item.id} className="py-3 px-3 text-right">
                            {item.averageComments.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-medium text-ink-secondary-light dark:text-ink-secondary-dark">
                          {t.avgViews}
                        </td>
                        {comparison.map((item) => (
                          <td key={item.id} className="py-3 px-3 text-right">
                            {item.averageViews ? item.averageViews.toLocaleString() : '—'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-medium text-ink-secondary-light dark:text-ink-secondary-dark">
                          {t.totalPosts}
                        </td>
                        {comparison.map((item) => (
                          <td key={item.id} className="py-3 px-3 text-right">
                            {item.sampleSize} posts
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-medium text-ink-secondary-light dark:text-ink-secondary-dark">
                          {t.formulaCalculation}
                        </td>
                        {comparison.map((item) => (
                          <td
                            key={item.id}
                            className="py-3 px-3 text-right text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark"
                          >
                            {item.formulaType}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-sans font-medium text-ink-secondary-light dark:text-ink-secondary-dark">
                          {t.realtimeData}
                        </td>
                        {comparison.map((item) => (
                          <td key={item.id} className="py-3 px-3 text-right">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/10">
                              {item.source}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-brand/5 dark:bg-brand/10 font-bold">
                        <td className="py-3 px-3 font-sans text-brand">{t.erTitle}</td>
                        {comparison.map((item) => (
                          <td key={item.id} className="py-3 px-3 text-right text-sm text-brand font-mono">
                            {item.engagementRate.toFixed(2)}%
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
