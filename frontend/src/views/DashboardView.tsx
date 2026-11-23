import React, { useEffect, useState } from 'react';
import { api, DashboardKPI, SocialAccount } from '../services/api.js';
import { KpiCard } from '../components/KpiCard.js';
import { EngagementTrendChart } from '../components/Charts/EngagementTrendChart.js';
import {
  Users,
  Instagram,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Search,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';

interface DashboardViewProps {
  onSelectAccount: (accountId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectAccount,
  onNavigateTab,
}) => {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiData, accountsData] = await Promise.all([
        api.getDashboardKPI(),
        api.listAccounts(),
      ]);
      setKpi(kpiData);
      setAccounts(accountsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-black/5 dark:bg-white/5" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  // Trend data points from recent analyses
  const trendData = (kpi?.recentAnalyses || []).map((run) => ({
    date: new Date(run.analyzedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' }),
    er: run.engagementRate,
    likes: run.averageLikes,
    comments: run.averageComments,
  })).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
            {t.overviewTitle}
          </h1>
          <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark mt-1">
            {t.overviewDesc}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/export/accounts/excel"
            download="Laporan_Analisis_ER_Sosial_Media.xlsx"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all hover:scale-[1.02]"
            title={t.exportExcel}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.exportExcel}</span>
          </a>

          <button
            onClick={() => onNavigateTab('analyze')}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all hover:scale-[1.02]"
          >
            <Search className="w-4 h-4" />
            <span>{t.analyzeBtn}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t.totalAccounts}
          value={kpi?.totalAccounts ?? 0}
          subtitle={`${kpi?.instagramCount || 0} IG • ${kpi?.tiktokCount || 0} TT • ${kpi?.youtubeCount || 0} YT • ${kpi?.facebookCount || 0} FB`}
          icon={Users}
          accentColor="text-brand"
        />
        <KpiCard
          title="Akun Terpantau"
          value={kpi?.totalAccounts ?? 0}
          subtitle={`IG: ${kpi?.instagramCount || 0} • TT: ${kpi?.tiktokCount || 0} • YT: ${kpi?.youtubeCount || 0} • FB: ${kpi?.facebookCount || 0}`}
          icon={Layers}
          accentColor="text-indigo-600"
        />
        <KpiCard
          title={t.avgPlatformEr}
          value={`${kpi?.averageER ?? 0}%`}
          subtitle={language === 'id' ? 'Standar Industri 2.0% - 4.5%' : 'Benchmark 2.0% - 4.5%'}
          icon={TrendingUp}
          trend="+0.35% benchmark"
          accentColor="text-emerald-600"
        />
        <KpiCard
          title={t.totalPostsAnalyzed}
          value={kpi?.totalAnalyses ?? 0}
          subtitle={language === 'id' ? 'Transparansi rumus terverifikasi' : 'Auditable mathematical trace'}
          icon={BarChart3}
          accentColor="text-amber-600"
        />
      </div>

      {/* Main Grid: Engagement Trend Chart & Quick Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EngagementTrendChart
            data={trendData}
            title={language === 'id' ? 'Tren Tingkat Keterlibatan Terbaru (%)' : 'Recent Engagement Rate Trend (%)'}
          />
        </div>

        {/* Quick Accounts List */}
        <div className="craft-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              {t.accounts}
            </h3>
            <button
              onClick={() => onNavigateTab('accounts')}
              className="text-xs text-brand hover:underline font-semibold flex items-center gap-1"
            >
              <span>{language === 'id' ? 'Lihat semua' : 'View all'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {accounts.slice(0, 5).map((acc) => {
              const latestER = acc.analyses && acc.analyses[0]?.engagementRate;
              const followers = acc.snapshots && acc.snapshots[0]?.followers;
              return (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccount(acc.id)}
                  className="p-3 rounded-xl border border-black/5 dark:border-white/5 hover:border-brand/40 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-all flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-xs">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt={acc.username} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        acc.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                        @{acc.username}
                      </p>
                      <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono">
                        {acc.platform} • {followers?.toLocaleString() || 0} {t.followers.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  {latestER !== undefined && (
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-brand">
                        {latestER.toFixed(2)}%
                      </span>
                      <span className="block text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
                        {t.erTitle.split(' ')[0]}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="craft-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              {t.recentAnalyses}
            </h3>
            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
              {language === 'id' ? 'Catatan riwayat perhitungan dengan sampel postingan dan sumber data.' : 'Auditable log of calculation runs with sample sizes and source tags.'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs text-brand hover:underline font-semibold flex items-center gap-1"
          >
            <span>{t.history}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/5 dark:border-white/5 font-mono uppercase text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              <tr>
                <th className="py-2.5 px-3">{t.account}</th>
                <th className="py-2.5 px-3">{t.platform}</th>
                <th className="py-2.5 px-3">Metode Rumus</th>
                <th className="py-2.5 px-3">{t.sampleSize}</th>
                <th className="py-2.5 px-3">Sumber Data</th>
                <th className="py-2.5 px-3 text-right">{t.erTitle}</th>
                <th className="py-2.5 px-3 text-right">{t.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {(kpi?.recentAnalyses || []).map((run) => (
                <tr
                  key={run.id}
                  onClick={() => onSelectAccount(run.accountId)}
                  className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                    @{run.account?.username}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-semibold ${
                      run.account?.platform === 'INSTAGRAM'
                        ? 'text-pink-600 bg-pink-50 dark:bg-pink-950/40'
                        : run.account?.platform === 'YOUTUBE'
                        ? 'text-red-600 bg-red-50 dark:bg-red-950/40'
                        : run.account?.platform === 'FACEBOOK'
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                        : 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40'
                    }`}>
                      {run.account?.platform}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                    {run.formulaType === 'FOLLOWER_BASED' ? t.followerBased : t.viewBased}
                  </td>
                  <td className="py-3 px-3 font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                    {run.sampleSize} posts
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                      run.source === 'SIMULATED' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {run.source === 'SIMULATED' ? t.simulatedData : t.realtimeData}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-sm text-brand">
                    {run.engagementRate.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                    {new Date(run.analyzedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
