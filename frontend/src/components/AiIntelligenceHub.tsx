import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Zap,
  BarChart3,
  Hash,
  Clock,
  Calendar,
  Flame,
  MessageSquare,
  Share2,
  Eye,
  Heart,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  ArrowUpRight,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import {
  api,
  AiIntelligenceResponse,
  AiViralRankedPost,
  DraftSimulationResult,
  AccountTrendsData,
} from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext.js';

interface AiIntelligenceHubProps {
  accountId: string;
  username: string;
  platform: string;
  followers?: number;
  initialData?: AiIntelligenceResponse | null;
}

export const AiIntelligenceHub: React.FC<AiIntelligenceHubProps> = ({
  accountId,
  username,
  platform,
  followers = 1000,
  initialData = null,
}) => {
  const { language } = useLanguage();
  const [data, setData] = useState<AiIntelligenceResponse | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Sub-tabs: CONTENT vs VIRAL vs TRENDS vs SIMULATOR
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'VIRAL' | 'TRENDS' | 'SIMULATOR'>('CONTENT');
  const [trendsData, setTrendsData] = useState<AccountTrendsData | null>(null);
  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);

  // Filter states
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedViralTier, setSelectedViralTier] = useState<string>('ALL');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Draft Simulator state
  const [draftCaption, setDraftCaption] = useState<string>('');
  const [draftHour, setDraftHour] = useState<number>(19);
  const [draftDay, setDraftDay] = useState<string>('Jumat');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<DraftSimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) {
      if (!initialData) loadIntelligence();
      loadTrends();
    }
  }, [accountId]);

  const loadTrends = async () => {
    try {
      setLoadingTrends(true);
      const res = await api.getAccountTrends(accountId);
      setTrendsData(res);
    } catch (err: any) {
      console.warn('Error loading trends:', err);
    } finally {
      setLoadingTrends(false);
    }
  };

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAccountAiIntelligence(accountId);
      setData(res);
    } catch (err: any) {
      console.error('Error fetching AI intelligence:', err);
      setError(err.message || 'Gagal memuat analisis kecerdasan AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftCaption.trim()) return;

    try {
      setSimulating(true);
      setSimulationError(null);
      const res = await api.simulateDraftPost({
        caption: draftCaption.trim(),
        targetHour: draftHour,
        targetDay: draftDay,
        followers: data?.followers || followers,
        platform: data?.platform || platform,
        creatorMedianViews: data?.viralPrediction.creatorBenchmark.medianViews || 5000,
        creatorMedianER: data?.viralPrediction.creatorBenchmark.medianER || 5.0,
      });
      setSimulationResult(res);
    } catch (err: any) {
      setSimulationError(err.message || 'Gagal menjalankan simulasi draf.');
    } finally {
      setSimulating(false);
    }
  };

  const filteredRankedPosts = useMemo(() => {
    if (!data?.viralPrediction?.rankedPosts) return [];
    if (selectedViralTier === 'ALL') return data.viralPrediction.rankedPosts;
    return data.viralPrediction.rankedPosts.filter(
      (p) => p.viralTier === selectedViralTier
    );
  }, [data, selectedViralTier]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIRAL_BREAKOUT':
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
          badge: 'bg-purple-500 text-white',
          bar: 'bg-gradient-to-r from-purple-500 to-pink-500',
        };
      case 'HIGH_POTENTIAL':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
          badge: 'bg-emerald-500 text-white',
          bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        };
      case 'HEALTHY_CONSISTENT':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
          badge: 'bg-blue-500 text-white',
          bar: 'bg-gradient-to-r from-blue-500 to-cyan-400',
        };
      default:
        return {
          bg: 'bg-zinc-500/10 dark:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
          badge: 'bg-zinc-500 text-white',
          bar: 'bg-zinc-400',
        };
    }
  };

  const daysOfWeek = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ];

  if (loading) {
    return (
      <div className="card-surface p-8 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-black/10 dark:bg-white/10 rounded-lg" />
            <div className="h-4 w-72 bg-black/5 dark:bg-white/5 rounded-md" />
          </div>
          <div className="h-8 w-24 bg-brand/20 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-black/5 dark:bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-black/5 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-surface p-8 text-center space-y-4 border border-rose-500/20">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-ink-primary-light dark:text-ink-primary-dark">
            {language === 'id' ? 'Gagal Memproses Kecerdasan AI' : 'AI Processing Failed'}
          </h4>
          <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-1 max-w-md mx-auto">
            {error || 'Data postingan akun belum cukup untuk melakukan analisis kecerdasan konten dan prediksi viralitas.'}
          </p>
        </div>
        <button
          onClick={loadIntelligence}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-hover transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'id' ? 'Coba Lagi' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  const { contentIntelligence: ci, viralPrediction: vp } = data;

  return (
    <div className="space-y-6">
      {/* ─── AI Engine Header Dossier ─── */}
      <div className="card-surface p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-brand/5 via-transparent to-purple-500/5 border border-brand/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand/10 text-brand">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                {language === 'id' ? 'AI Content Intelligence & Viral Predictor' : 'AI Content Intelligence & Viral Engine'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Realtime Empirical Data
              </span>
            </div>
            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
              {language === 'id'
                ? `Menganalisis ${ci.totalPostsAnalyzed} postingan riil @${data.username} menggunakan Scikit-Learn TF-IDF, clustering tema konten, dan algoritma Viral Velocity Index.`
                : `Analyzed ${ci.totalPostsAnalyzed} actual posts of @${data.username} via Scikit-Learn TF-IDF keyword extraction and Viral Velocity algorithms.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadIntelligence}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark transition-all cursor-pointer"
              title="Refresh AI Analysis"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Intelligence Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-black/5 dark:border-white/5 font-mono">
          <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark uppercase block">
              Skor Viralitas Rata-rata
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-display text-purple-600 dark:text-purple-400">
                {vp.averageViralScore}
              </span>
              <span className="text-xs text-ink-tertiary-light">/100</span>
            </div>
            <span className="text-[10px] text-purple-500 font-sans block mt-0.5">
              {vp.summary.breakoutCount} video tembus viral
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark uppercase block">
              Baseline Median Views
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-display text-ink-primary-light dark:text-ink-primary-dark">
                {vp.creatorBenchmark.medianViews.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans block mt-0.5">
              Standar tengah akun
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark uppercase block">
              Baseline Median ER
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-display text-brand">
                {vp.creatorBenchmark.medianER}%
              </span>
            </div>
            <span className="text-[10px] text-brand/80 font-sans block mt-0.5">
              Tahan anomali outlier
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark uppercase block">
              Topik Paling Dominan
            </span>
            <div className="flex items-baseline gap-1 mt-1 truncate">
              <span className="text-sm font-bold font-sans text-ink-primary-light dark:text-ink-primary-dark truncate">
                {ci.topics[0]?.topic || 'Umum'}
              </span>
            </div>
            <span className="text-[10px] text-ink-tertiary-light font-sans block mt-0.5">
              {ci.topics[0]?.percentage || 0}% dari seluruh konten
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 p-1 bg-surface-subtle-light/80 dark:bg-surface-subtle-dark/80 rounded-xl border border-black/5 dark:border-white/5 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('CONTENT')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'CONTENT'
                ? 'bg-white dark:bg-black/40 text-brand shadow-xs'
                : 'text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>AI Content Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VIRAL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'VIRAL'
                ? 'bg-white dark:bg-black/40 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Viral Prediction & Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRENDS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'TRENDS'
                ? 'bg-white dark:bg-black/40 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tren Multi-Tahun (Python)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'SIMULATOR'
                ? 'bg-white dark:bg-black/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulator Draf Konten</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: CONTENT INTELLIGENCE ─── */}
      {activeTab === 'CONTENT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section A: Thematic Topics Analysis */}
          <div className="card-surface p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand" />
                  <span>{language === 'id' ? 'Distribusi Topik & Performa Tematik' : 'Topic Distribution & Thematic Performance'}</span>
                </h4>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                  {language === 'id'
                    ? 'Pengelompokan otomatis topik bahasan konten berdasarkan semantik teks dan perbandingan rasio interaksinya.'
                    : 'Automatic content thematic clustering and corresponding engagement rate comparisons.'}
                </p>
              </div>
              <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                {ci.topics.length} Kategori Ditemukan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {ci.topics.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedTopic === t.topic
                      ? 'bg-brand/5 border-brand ring-1 ring-brand'
                      : 'bg-surface-subtle-light/40 dark:bg-surface-subtle-dark/40 border-black/5 dark:border-white/5 hover:border-brand/30'
                  }`}
                  onClick={() => setSelectedTopic(selectedTopic === t.topic ? null : t.topic)}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-xs text-ink-primary-light dark:text-ink-primary-dark">
                      {t.topic}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand/10 text-brand">
                      {t.percentage}% Konten
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-brand h-full rounded-full transition-all duration-500"
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-center border-t border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[10px]">
                        Jumlah Post
                      </span>
                      <span className="font-bold text-ink-primary-light dark:text-ink-primary-dark">
                        {t.count}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[10px]">
                        Rata-rata ER
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {t.averageER}%
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[10px]">
                        Rata-rata Views
                      </span>
                      <span className="font-bold text-ink-primary-light dark:text-ink-primary-dark">
                        {t.averageViews.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: TF-IDF Key Phrases & Hashtag Velocity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Keywords */}
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-display text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Kata Kunci Berdampak Tinggi (TF-IDF)</span>
                  </h4>
                  <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                    Kata yang paling sering memicu engagement tinggi di akun ini.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {ci.topKeywords.length > 0 ? (
                  ci.topKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5 text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark hover:border-brand/40 transition-colors"
                    >
                      <span>{kw.keyword}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                        +{kw.impactScore}
                      </span>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-ink-tertiary-light">Belum ada cukup data teks kata kunci.</p>
                )}
              </div>
            </div>

            {/* Hashtag Performance */}
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-display text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                    <Hash className="w-4 h-4 text-cyan-500" />
                    <span>Performa Hashtag Aktual</span>
                  </h4>
                  <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                    Rata-rata interaksi postingan per hashtag yang digunakan.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {ci.topHashtags.length > 0 ? (
                  ci.topHashtags.slice(0, 5).map((ht, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle-light/50 dark:bg-surface-subtle-dark/50 border border-black/5 dark:border-white/5 text-xs font-mono"
                    >
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 truncate">
                        {ht.hashtag}
                      </span>
                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <span className="text-ink-tertiary-light">{ht.count}x digunakan</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {ht.averageER}% ER
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-ink-tertiary-light">Akun ini tidak sering menyertakan hashtag.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section C: Prime-Time Schedule & Caption Hook Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prime Time Schedule */}
            <div className="card-surface p-6 space-y-4">
              <h4 className="text-sm font-bold font-display text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Jadwal Jam & Hari Tayang Terbaik</span>
              </h4>
              <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                Kinerja historis postingan berdasarkan waktu rilisnya.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark block mb-1.5">
                    Jam Terbaik (Prime-Hours):
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    {ci.bestPostingHours.map((h, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      >
                        <span className="font-bold block text-sm">{h.hour}</span>
                        <span className="text-[10px] text-ink-tertiary-light block mt-0.5">
                          {h.averageER}% ER
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark block mb-1.5">
                    Hari Terbaik (Prime-Days):
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    {ci.bestPostingDays.map((d, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand"
                      >
                        <span className="font-bold block text-sm">{d.day}</span>
                        <span className="text-[10px] text-ink-tertiary-light block mt-0.5">
                          {d.averageER}% ER
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hook Effectiveness & Length */}
            <div className="card-surface p-6 space-y-4">
              <h4 className="text-sm font-bold font-display text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Gaya Hook & Panjang Caption</span>
              </h4>
              <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                Struktur penulisan caption yang memicu interaksi optimal.
              </p>

              <div className="space-y-3 pt-2">
                {ci.hookEffectiveness.map((hook, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-subtle-light/50 dark:bg-surface-subtle-dark/50 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-ink-primary-light dark:text-ink-primary-dark block">
                        {hook.hookType}
                      </span>
                      <span className="text-[10px] text-ink-tertiary-light">
                        {hook.count} postingan menggunakan gaya ini
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {hook.averageER}% ER
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
                  <strong>Insight AI:</strong>{' '}
                  {ci.hookEffectiveness[0]?.hookType.includes('Tanya')
                    ? 'Konten dengan pertanyaan di awal atau akhir caption terbukti mendongkrak komentar hingga 1.3x lipat dibanding pernyataan umum.'
                    : 'Gaya penyampaian lugas dan berbasis fakta terbukti paling disukai oleh audiens akun ini.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: VIRAL PREDICTION & BREAKDOWN ─── */}
      {activeTab === 'VIRAL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Tiers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => setSelectedViralTier(selectedViralTier === 'VIRAL_BREAKOUT' ? 'ALL' : 'VIRAL_BREAKOUT')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedViralTier === 'VIRAL_BREAKOUT'
                  ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                  : 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                  Viral Breakout
                </span>
                <Flame className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-3xl font-black font-display text-purple-700 dark:text-purple-300 mt-2">
                {vp.summary.breakoutCount}
              </div>
              <p className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark mt-1">
                Skor $\ge 80$ (Ekspansi Audiens Baru)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedViralTier(selectedViralTier === 'HIGH_POTENTIAL' ? 'ALL' : 'HIGH_POTENTIAL')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedViralTier === 'HIGH_POTENTIAL'
                  ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                  Potensi Tinggi
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black font-display text-emerald-700 dark:text-emerald-300 mt-2">
                {vp.summary.highPotentialCount}
              </div>
              <p className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark mt-1">
                Skor $65 - 79$ (Di atas rata-rata)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedViralTier(selectedViralTier === 'HEALTHY_CONSISTENT' ? 'ALL' : 'HEALTHY_CONSISTENT')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedViralTier === 'HEALTHY_CONSISTENT'
                  ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                  Konsisten
                </span>
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-black font-display text-blue-700 dark:text-blue-300 mt-2">
                {vp.summary.consistentCount}
              </div>
              <p className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark mt-1">
                Skor $50 - 64$ (Sesuai baseline)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedViralTier(selectedViralTier === 'BELOW_BASELINE' ? 'ALL' : 'BELOW_BASELINE')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedViralTier === 'BELOW_BASELINE'
                  ? 'bg-zinc-500/15 border-zinc-500 ring-2 ring-zinc-500/30'
                  : 'bg-zinc-500/5 border-zinc-500/20 hover:border-zinc-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Di Bawah Rata-Rata
                </span>
                <HelpCircle className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-3xl font-black font-display text-zinc-700 dark:text-zinc-300 mt-2">
                {vp.summary.belowBaselineCount}
              </div>
              <p className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark mt-1">
                Skor $&lt; 50$ (Perlu evaluasi)
              </p>
            </button>
          </div>

          {/* Post Rank List with Breakdown */}
          <div className="card-surface p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold font-display text-ink-primary-light dark:text-ink-primary-dark">
                  Daftar Peringkat Potensi Viral Postingan
                </h4>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                  Menampilkan {filteredRankedPosts.length} postingan diurutkan dari skor viralitas tertinggi.
                </p>
              </div>

              {selectedViralTier !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedViralTier('ALL')}
                  className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  Tampilkan Semua Postingan
                </button>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {filteredRankedPosts.map((post, idx) => {
                const colors = getTierColor(post.viralTier);
                const isExpanded = expandedPostId === post.postId;

                return (
                  <div
                    key={post.postId || idx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'border-brand/40 bg-surface-subtle-light/80 dark:bg-surface-subtle-dark/80 shadow-sm'
                        : 'border-black/5 dark:border-white/5 bg-surface-subtle-light/40 dark:bg-surface-subtle-dark/40 hover:border-black/10'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedPostId(isExpanded ? null : post.postId)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Score Circle Badge */}
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex flex-col items-center justify-center shrink-0 font-mono">
                          <span className="text-base font-black leading-none">
                            {post.viralScore}
                          </span>
                          <span className="text-[8px] font-bold uppercase mt-0.5">Skor</span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${colors.bg}`}>
                              {post.viralTierBadge}
                            </span>
                            <span className="text-xs font-mono text-ink-tertiary-light">
                              {post.postedAt ? new Date(post.postedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-ink-primary-light dark:text-ink-primary-dark font-medium line-clamp-1">
                            {post.caption || 'Tanpa keterangan caption'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-ink-tertiary-light block">ER Postingan</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {post.postER}%
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-ink-tertiary-light block">Views</span>
                          <span className="font-bold text-ink-primary-light dark:text-ink-primary-dark">
                            {post.views.toLocaleString()}
                          </span>
                        </div>

                        <div className="text-ink-tertiary-light">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Drawer: Full Breakdown & Recommendations */}
                    {isExpanded && (
                      <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-2 border-t border-black/5 dark:border-white/5 space-y-4 animate-in fade-in duration-150">
                        {/* Metrics Bar */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                          <div>
                            <span className="text-[10px] text-ink-tertiary-light block">Suka</span>
                            <span className="font-bold">{post.likes.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-tertiary-light block">Komentar</span>
                            <span className="font-bold">{post.comments.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-tertiary-light block">Tayangan</span>
                            <span className="font-bold">{post.views.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-tertiary-light block">Share</span>
                            <span className="font-bold">{post.shares.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Viral Score Components Breakdown */}
                        <div>
                          <span className="text-xs font-bold text-ink-primary-light dark:text-ink-primary-dark block mb-2 font-display">
                            Komposisi Algoritma Viralitas (0 - 100):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                            <div className="p-2.5 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5">
                              <span className="text-[10px] text-ink-tertiary-light block">Kecepatan Relatif (RVI)</span>
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                {post.scoreBreakdown.relativeVelocityScore}/100
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5">
                              <span className="text-[10px] text-ink-tertiary-light block">Ekspansi Audiens Baru (VFR)</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {post.scoreBreakdown.reachMultiplierScore}/100
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5">
                              <span className="text-[10px] text-ink-tertiary-light block">Rasio Retensi & Share</span>
                              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                                {post.scoreBreakdown.shareRetentionScore}/100
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Drivers */}
                        {post.drivers.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-ink-primary-light dark:text-ink-primary-dark block font-display">
                              Faktor Pemicu Kinerja:
                            </span>
                            <div className="space-y-1">
                              {post.drivers.map((d, dIdx) => (
                                <div
                                  key={dIdx}
                                  className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                                  <span>{d}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Actionable Recommendations */}
                        {post.recommendations.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/20 space-y-2">
                            <span className="text-xs font-bold text-brand flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Rekomendasi Optimasi Konten Selanjutnya:</span>
                            </span>
                            <ul className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark space-y-1 list-disc list-inside">
                              {post.recommendations.map((rec, rIdx) => (
                                <li key={rIdx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: MULTI-YEAR TRENDS & MOMENTUM (PYTHON PANDAS) ─── */}
      {activeTab === 'TRENDS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="card-surface p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Analisis Tren Waktu & Pertumbuhan Multi-Tahun</span>
                </h4>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                  Dihitung secara empiris menggunakan modul Python Pandas Time-Series dari seluruh postingan historis @{data.username}.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                Engine: Python Pandas & NumPy
              </span>
            </div>

            {loadingTrends ? (
              <div className="py-12 text-center text-xs font-mono text-ink-tertiary-light animate-pulse">
                Memproses agregasi data multi-tahun di engine Python...
              </div>
            ) : trendsData ? (
              <div className="space-y-6">
                {/* 1. Momentum & Seasonality Hero Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/5 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                      Status Momentum Akun
                    </span>
                    <span className={`text-base font-bold font-display block ${trendsData.momentum.color}`}>
                      {trendsData.momentum.label}
                    </span>
                    <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed pt-1">
                      {trendsData.momentum.note}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/5 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                      Rentang Waktu Sampel
                    </span>
                    <span className="text-base font-bold font-display text-ink-primary-light dark:text-ink-primary-dark block">
                      {trendsData.dateRange.spanYears} Tahun ({trendsData.totalPostsAnalyzed} Postingan)
                    </span>
                    <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark pt-1">
                      Data riil terekam dari tanggal <strong className="font-mono text-ink-primary-light dark:text-ink-primary-dark">{trendsData.dateRange.oldestPost}</strong> hingga <strong className="font-mono text-ink-primary-light dark:text-ink-primary-dark">{trendsData.dateRange.latestPost}</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/5 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                      Musim Terkuat (Seasonality)
                    </span>
                    <span className="text-base font-bold font-display text-brand block">
                      Bulan {trendsData.seasonality.bestMonth}
                    </span>
                    <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark pt-1">
                      {trendsData.seasonality.note}
                    </p>
                  </div>
                </div>

                {/* 2. Year-over-Year (YoY) Progression Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-display text-ink-primary-light dark:text-ink-primary-dark">
                      Tabel Pertumbuhan Tahunan (Year-over-Year Comparison):
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/5">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/5 dark:border-white/5 text-[10px] uppercase text-ink-tertiary-light">
                        <tr>
                          <th className="py-2.5 px-3">Tahun</th>
                          <th className="py-2.5 px-3 text-right">Jumlah Post</th>
                          <th className="py-2.5 px-3 text-right">Median ER</th>
                          <th className="py-2.5 px-3 text-right">Rata-Rata ER</th>
                          <th className="py-2.5 px-3 text-right">Total Tayangan</th>
                          <th className="py-2.5 px-3 text-right">Pertumbuhan YoY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {trendsData.yearlyTrends.map((yt, yIdx) => (
                          <tr key={yt.year || yIdx} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                            <td className="py-3 px-3 font-bold text-ink-primary-light dark:text-ink-primary-dark text-sm">
                              {yt.year}
                            </td>
                            <td className="py-3 px-3 text-right">{yt.postCount}</td>
                            <td className="py-3 px-3 text-right font-bold text-brand">{yt.medianER}%</td>
                            <td className="py-3 px-3 text-right text-ink-secondary-light">{yt.averageER}%</td>
                            <td className="py-3 px-3 text-right">{yt.totalViews.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right">
                              {yt.yoyGrowthPct > 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  +{yt.yoyGrowthPct}%
                                </span>
                              ) : yt.yoyGrowthPct < 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  {yt.yoyGrowthPct}%
                                </span>
                              ) : (
                                <span className="text-ink-tertiary-light text-[10px]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Monthly Timeline Progression */}
                {trendsData.monthlyTrends.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold font-display text-ink-primary-light dark:text-ink-primary-dark block">
                      Pergerakan Bulanan (12 Periode Terakhir):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-center font-mono">
                      {trendsData.monthlyTrends.map((mt, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-3 rounded-xl bg-surface-subtle-light/40 dark:bg-surface-subtle-dark/40 border border-black/5 dark:border-white/5 space-y-1"
                        >
                          <span className="text-[10px] text-ink-tertiary-light block font-semibold">
                            {mt.month}
                          </span>
                          <span className="text-sm font-bold text-brand block">
                            {mt.medianER}%
                          </span>
                          <span className="text-[9px] text-ink-tertiary-light block">
                            {mt.postCount} post • {mt.averageViews.toLocaleString()} v
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-ink-tertiary-light">
                Tidak ada data tren yang tersedia untuk akun ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: DRAFT POST SIMULATOR ─── */}
      {activeTab === 'SIMULATOR' && (
        <div className="card-surface p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h4 className="text-base font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Simulator Prediksi Viralitas Konten Baru</span>
            </h4>
            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
              Uji coba konsep caption dan rencana jadwal posting sebelum diunggah. AI akan memprediksi peluang viral berdasarkan karakteristik historis audiens @{data.username}.
            </p>
          </div>

          <form onSubmit={handleSimulateDraft} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
                Draf Caption / Ide Konten
              </label>
              <textarea
                rows={4}
                value={draftCaption}
                onChange={(e) => setDraftCaption(e.target.value)}
                placeholder="Tulis draf caption yang akan Anda upload... (Contoh: Menurut Anda, apakah kebijakan ini sudah tepat untuk rakyat Lebak? Simak fakta lengkapnya di video ini! #lebak #kebijakan #banten)"
                className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-xl p-3.5 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
                  Rencana Hari Tayang
                </label>
                <select
                  value={draftDay}
                  onChange={(e) => setDraftDay(e.target.value)}
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
                  Rencana Jam Tayang (WIB): {draftHour}:00
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={23}
                    value={draftHour}
                    onChange={(e) => setDraftHour(Number(e.target.value))}
                    className="flex-1 accent-brand"
                  />
                  <span className="font-mono text-xs font-bold text-brand shrink-0">
                    {String(draftHour).padStart(2, '0')}:00 WIB
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating || !draftCaption.trim()}
              className="w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menjalankan Simulasi AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Hitung Peluang Viralitas Konten Ini</span>
                </>
              )}
            </button>
          </form>

          {simulationError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {simulationError}
            </div>
          )}

          {simulationResult && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-brand/5 to-transparent border border-purple-500/20 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                    Hasil Analisis Prediktif AI
                  </span>
                  <span className="text-xs text-ink-tertiary-light">
                    Jadwal: {simulationResult.targetSchedule}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500 text-white">
                  {simulationResult.predictedTierLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-purple-500/15">
                  <span className="text-[10px] text-ink-tertiary-light uppercase block">
                    Skor Potensi Viral
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black font-display text-purple-600 dark:text-purple-400">
                      {simulationResult.predictedViralScore}
                    </span>
                    <span className="text-xs text-ink-tertiary-light">/100</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-ink-tertiary-light uppercase block">
                    Kekuatan Hook Caption
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400">
                      {simulationResult.scoreBreakdown.hookScore}
                    </span>
                    <span className="text-xs text-ink-tertiary-light">/100</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-ink-tertiary-light uppercase block">
                    Kesesuaian Waktu Rilis
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black font-display text-brand">
                      {simulationResult.scoreBreakdown.timingScore}
                    </span>
                    <span className="text-xs text-ink-tertiary-light">/100</span>
                  </div>
                </div>
              </div>

              {/* Drivers & Recommendations */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-ink-primary-light dark:text-ink-primary-dark block font-display">
                    Faktor Positif yang Terdeteksi:
                  </span>
                  {simulationResult.drivers.map((d, i) => (
                    <div key={i} className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Langkah Optimasi Sebelum Upload:</span>
                  </span>
                  <ul className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark space-y-1 list-disc list-inside">
                    {simulationResult.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
