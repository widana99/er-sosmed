import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Filter,
  MapPin,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Instagram,
  RefreshCw,
  Search,
  ExternalLink,
  Edit3,
  Check,
  X,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Download,
  Trash2,
  AlertTriangle,
  Youtube,
  Facebook,
} from 'lucide-react';
import { api, LeaderboardItem, LeaderboardStats } from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext.js';

interface LeaderboardViewProps {
  onSelectAccount: (accountId: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onSelectAccount }) => {
  const { t, language } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'ER' | 'VIEWS' | 'FOLLOWERS' | 'LIKES'>('ER');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Jubir City / Role Modal State
  const [editingJubir, setEditingJubir] = useState<LeaderboardItem | null>(null);
  const [editCityInput, setEditCityInput] = useState('');
  const [editRoleInput, setEditRoleInput] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Deletion Modal State
  const [accountToDelete, setAccountToDelete] = useState<LeaderboardItem | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      setDeletingAccount(true);
      setDeleteAccountError(null);
      await api.deleteAccount(accountToDelete.id);
      setAccountToDelete(null);
      await fetchLeaderboard();
    } catch (err: any) {
      setDeleteAccountError(err.message || 'Gagal menghapus akun.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLeaderboard({
        city: selectedCity,
        platform: selectedPlatform,
        sortBy,
      });
      setLeaderboard(data.leaderboard);
      setStats(data.stats);
      setAvailableCities(data.availableCities);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Gagal memuat data peringkat jubir.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCity, selectedPlatform, sortBy]);

  // Client-side quick search filter
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase().trim();
    return leaderboard.filter(
      (item) =>
        item.username.toLowerCase().includes(q) ||
        item.displayName.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.roleOrTitle.toLowerCase().includes(q)
    );
  }, [leaderboard, searchQuery]);

  const top3 = useMemo(() => {
    return filteredLeaderboard.slice(0, 3);
  }, [filteredLeaderboard]);

  const handleOpenEdit = (item: LeaderboardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJubir(item);
    setEditCityInput(item.city || 'Nasional');
    setEditRoleInput(item.roleOrTitle || 'Jubir');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJubir) return;

    try {
      setSavingEdit(true);
      await api.updateJubir(editingJubir.id, {
        city: editCityInput.trim() || 'Nasional',
        roleOrTitle: editRoleInput.trim() || 'Jubir',
      });
      setEditingJubir(null);
      await fetchLeaderboard();
    } catch (err: any) {
      alert(`Gagal memperbarui profil: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'High Interactivity':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Tinggi (≥5%)
          </span>
        );
      case 'Good':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Bagus (2.5-5%)
          </span>
        );
      case 'Average':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Sedang (1-2.5%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            Rendah (&lt;1%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              {t.leaderboard}
            </h1>
          </div>
          <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark">
            {language === 'id' ? 'Leaderboard performa keterlibatan (ER), views Reels/VT, serta jangkauan juru bicara per kota & daerah secara aktual.' : 'Leaderboard of engagement performance, Reels/TikTok views, and regional spokesperson impact in realtime.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE REALTIME
          </span>

          {/* Ekspor Excel Button */}
          <a
            href={api.getAccountsExcelUrl({ city: selectedCity, platform: selectedPlatform, sortBy })}
            download="Laporan_Peringkat_Jubir_Sosial_Media.xlsx"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Download seluruh data peringkat dan postingan ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t.exportExcel}</span>
          </a>

          <button
            type="button"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-subtle-light dark:bg-surface-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-xs font-medium text-ink-primary-light dark:text-ink-primary-dark transition-colors disabled:opacity-50"
            title={t.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="card-surface p-4 bg-white dark:bg-[#12141A] rounded-xl border border-black/10 dark:border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Filter Kota / Daerah */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span>{t.city}</span>
              </span>
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
            >
              <option value="ALL">{t.allCities}</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Platform */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
              Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
              <button
                type="button"
                onClick={() => setSelectedPlatform('ALL')}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                  selectedPlatform === 'ALL'
                    ? 'border-brand bg-brand text-white shadow-xs'
                    : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('INSTAGRAM')}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  selectedPlatform === 'INSTAGRAM'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-semibold'
                    : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>IG</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('TIKTOK')}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  selectedPlatform === 'TIKTOK'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                    : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>TikTok</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('YOUTUBE')}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  selectedPlatform === 'YOUTUBE'
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                    : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('FACEBOOK')}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 transition-all ${
                  selectedPlatform === 'FACEBOOK'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Facebook className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {/* Urutkan Berdasarkan (Sort By) */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
              <span className="flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-brand" />
                <span>{t.sortBy}</span>
              </span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
            >
              <option value="ER">{t.highestEr}</option>
              <option value="VIEWS">{t.mostViews}</option>
              <option value="FOLLOWERS">{t.mostFollowers}</option>
              <option value="LIKES">{t.mostLikes}</option>
            </select>
          </div>

          {/* Cari Cepat */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
              Cari Jubir / Akun
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-tertiary-light dark:text-ink-tertiary-dark absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchFilter}
                className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Regional Summary KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#12141A] border border-black/10 dark:border-white/10 space-y-1">
            <span className="text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand" />
              <span>Total Jubir Terdata</span>
            </span>
            <p className="text-2xl font-bold font-display tabular-nums text-ink-primary-light dark:text-ink-primary-dark">
              {stats.totalJubir}
            </p>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              Wilayah: <strong className="text-ink-primary-light dark:text-ink-primary-dark">{selectedCity === 'ALL' ? 'Nasional' : selectedCity}</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#12141A] border border-black/10 dark:border-white/10 space-y-1">
            <span className="text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Rata-Rata ER Wilayah</span>
            </span>
            <p className="text-2xl font-bold font-display tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.averageEr}%
            </p>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              Tingkat interaktivitas audiens
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#12141A] border border-black/10 dark:border-white/10 space-y-1">
            <span className="text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Total Jangkauan (Followers)</span>
            </span>
            <p className="text-2xl font-bold font-display tabular-nums text-ink-primary-light dark:text-ink-primary-dark">
              {stats.totalReach.toLocaleString()}
            </p>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              Akumulasi pengikut seluruh akun
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#12141A] border border-black/10 dark:border-white/10 space-y-1">
            <span className="text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-500" />
              <span>Total Views Reels / VT</span>
            </span>
            <p className="text-2xl font-bold font-display tabular-nums text-cyan-600 dark:text-cyan-400">
              {stats.totalViews.toLocaleString()}
            </p>
            <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
              Rata-rata tayangan per video
            </p>
          </div>
        </div>
      )}

      {/* Podium Top 3 Spotlight */}
      {top3.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              Podium Teratas (Top 3 Jubir Terbaik)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* 2nd Place */}
            {top3[1] && (
              <div
                onClick={() => onSelectAccount(top3[1].id)}
                className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-slate-300 dark:border-slate-700/60 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                  <Medal className="w-3.5 h-3.5 text-slate-500" />
                  <span>#2 Perak</span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {top3[1].avatarUrl ? (
                      <img
                        src={top3[1].avatarUrl}
                        alt={top3[1].username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-300 dark:border-slate-700"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-sm border-2 border-slate-300 dark:border-slate-700">
                        {top3[1].displayName[0] || 'J'}
                      </div>
                    )}
                    <div className="min-w-0 pr-12">
                      <h3 className="font-semibold text-sm text-ink-primary-light dark:text-ink-primary-dark truncate group-hover:text-brand transition-colors">
                        {top3[1].displayName}
                      </h3>
                      <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark truncate">
                        @{top3[1].username}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5">
                      <MapPin className="w-3 h-3 text-brand" />
                      <span>{top3[1].city}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-brand/10 text-brand">
                      {top3[1].roleOrTitle}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 dark:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark">
                      {top3[1].platform}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark font-medium">Engagement Rate</span>
                    <span className="text-xl font-black font-display text-slate-700 dark:text-slate-300 tabular-nums">
                      {top3[1].engagementRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-mono py-1 rounded-lg bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60">
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Followers</span>
                      <span className="font-bold">{top3[1].followers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Views Reels/VT</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{top3[1].averageViews.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Likes</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">{top3[1].averageLikes.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Gold Champion) */}
            {top3[0] && (
              <div
                onClick={() => onSelectAccount(top3[0].id)}
                className="cursor-pointer group p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-white to-white dark:via-[#12141A] dark:to-[#12141A] border-2 border-amber-500/50 shadow-md hover:shadow-lg hover:border-amber-500 transition-all flex flex-col justify-between relative overflow-hidden md:-translate-y-2"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold font-mono shadow-xs">
                  <Trophy className="w-4 h-4 text-amber-100" />
                  <span>#1 JUARA EMAS</span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {top3[0].avatarUrl ? (
                      <img
                        src={top3[0].avatarUrl}
                        alt={top3[0].username}
                        className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 ring-4 ring-amber-500/20"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-lg border-2 border-amber-400 ring-4 ring-amber-500/20">
                        {top3[0].displayName[0] || 'J'}
                      </div>
                    )}
                    <div className="min-w-0 pr-16">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark truncate group-hover:text-brand transition-colors">
                          {top3[0].displayName}
                        </h3>
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      </div>
                      <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark truncate">
                        @{top3[0].username}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{top3[0].city}</span>
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-brand text-white">
                      {top3[0].roleOrTitle}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 dark:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark">
                      {top3[0].platform}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-500/20 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">Engagement Rate</span>
                    <span className="text-2xl font-black font-display text-amber-600 dark:text-amber-400 tabular-nums">
                      {top3[0].engagementRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-xs font-mono py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Followers</span>
                      <span className="font-bold">{top3[0].followers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Views Reels/VT</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{top3[0].averageViews.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Likes</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">{top3[0].averageLikes.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div
                onClick={() => onSelectAccount(top3[2].id)}
                className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-[#12141A] border border-amber-700/30 dark:border-amber-800/40 shadow-xs hover:border-amber-700/60 transition-all flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-900/10 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
                  <Medal className="w-3.5 h-3.5 text-amber-700" />
                  <span>#3 Perunggu</span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {top3[2].avatarUrl ? (
                      <img
                        src={top3[2].avatarUrl}
                        alt={top3[2].username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-700/40 dark:border-amber-800/50"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-800/20 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-sm border-2 border-amber-700/30">
                        {top3[2].displayName[0] || 'J'}
                      </div>
                    )}
                    <div className="min-w-0 pr-12">
                      <h3 className="font-semibold text-sm text-ink-primary-light dark:text-ink-primary-dark truncate group-hover:text-brand transition-colors">
                        {top3[2].displayName}
                      </h3>
                      <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark truncate">
                        @{top3[2].username}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5">
                      <MapPin className="w-3 h-3 text-brand" />
                      <span>{top3[2].city}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-brand/10 text-brand">
                      {top3[2].roleOrTitle}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 dark:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark">
                      {top3[2].platform}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark font-medium">Engagement Rate</span>
                    <span className="text-xl font-black font-display text-amber-700 dark:text-amber-400 tabular-nums">
                      {top3[2].engagementRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-mono py-1 rounded-lg bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60">
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Followers</span>
                      <span className="font-bold">{top3[2].followers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Views Reels/VT</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{top3[2].averageViews.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark block text-[9px] uppercase">Likes</span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">{top3[2].averageLikes.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
            Tabel Peringkat Lengkap ({filteredLeaderboard.length} Jubir)
          </h2>
          <span className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
            Klik akun untuk melihat rincian detail postingan
          </span>
        </div>

        <div className="card-surface bg-white dark:bg-[#12141A] rounded-xl border border-black/10 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle-light/80 dark:bg-surface-subtle-dark/80 border-b border-black/5 dark:border-white/5 font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-12">{t.rank}</th>
                  <th className="py-3 px-4">{t.account}</th>
                  <th className="py-3 px-4">{t.city}</th>
                  <th className="py-3 px-4 text-right">{t.followers}</th>
                  <th className="py-3 px-4 text-right">{t.following}</th>
                  <th className="py-3 px-4 text-right">{t.views}</th>
                  <th className="py-3 px-4 text-right">{t.likes}</th>
                  <th className="py-3 px-4 text-right">{t.comments}</th>
                  <th className="py-3 px-4 text-right">{t.erTitle}</th>
                  <th className="py-3 px-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {loading && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-ink-tertiary-light dark:text-ink-tertiary-dark">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-brand" />
                        <span>Mengalkulasi data peringkat realtime...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-ink-secondary-light dark:text-ink-secondary-dark">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="w-6 h-6 text-ink-tertiary-light dark:text-ink-tertiary-dark" />
                        <p className="font-semibold text-sm">Tidak ada jubir yang cocok dengan filter</p>
                        <p className="text-xs text-ink-tertiary-light">
                          Coba ganti filter kota atau platform untuk melihat akun lainnya.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredLeaderboard.map((item) => {
                    const isTop1 = item.rank === 1;
                    const isTop2 = item.rank === 2;
                    const isTop3 = item.rank === 3;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelectAccount(item.id)}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors group"
                      >
                        {/* Rank Column */}
                        <td className="py-3.5 px-3 text-center font-mono">
                          {isTop1 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold flex items-center justify-center text-xs">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="w-7 h-7 mx-auto rounded-full bg-amber-800/30 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark">
                              #{item.rank}
                            </span>
                          )}
                        </td>

                        {/* Account Name & Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {item.avatarUrl ? (
                              <img
                                src={item.avatarUrl}
                                alt={item.username}
                                className="w-9 h-9 rounded-full object-cover border border-black/10 dark:border-white/10 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-surface-subtle-light dark:bg-surface-subtle-dark text-ink-secondary-light dark:text-ink-secondary-dark font-bold flex items-center justify-center text-xs shrink-0 border border-black/5 dark:border-white/5">
                                {item.displayName[0] || 'J'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-ink-primary-light dark:text-ink-primary-dark truncate group-hover:text-brand transition-colors">
                                  {item.displayName}
                                </span>
                                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
                                  item.platform === 'INSTAGRAM'
                                    ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 font-semibold'
                                    : item.platform === 'YOUTUBE'
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                                    : item.platform === 'FACEBOOK'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                                    : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                                }`}>
                                  {item.platform === 'INSTAGRAM' ? 'IG' : item.platform === 'YOUTUBE' ? 'YT' : item.platform === 'FACEBOOK' ? 'FB' : 'TT'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-ink-secondary-light dark:text-ink-secondary-dark">
                                <span className="font-mono text-[11px]">@{item.username}</span>
                                <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark">•</span>
                                <span className="text-[10px] font-medium text-brand truncate max-w-[120px]">
                                  {item.roleOrTitle}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* City / Daerah */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5 text-ink-primary-light dark:text-ink-primary-dark">
                              <MapPin className="w-3 h-3 text-brand shrink-0" />
                              <span>{item.city}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(item, e)}
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-ink-tertiary-light hover:text-ink-primary-light transition-colors"
                              title="Ubah Kota atau Peran Jubir"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Followers */}
                        <td className="py-3.5 px-4 text-right font-mono font-medium">
                          {item.followers.toLocaleString()}
                        </td>

                        {/* Following */}
                        <td className="py-3.5 px-4 text-right font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                          {item.following.toLocaleString()}
                        </td>

                        {/* Views Reels / VT */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {item.averageViews.toLocaleString()}
                        </td>

                        {/* Average Likes */}
                        <td className="py-3.5 px-4 text-right font-mono text-pink-600 dark:text-pink-400">
                          {item.averageLikes.toLocaleString()}
                        </td>

                        {/* Average Comments */}
                        <td className="py-3.5 px-4 text-right font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                          {item.averageComments.toLocaleString()}
                        </td>

                        {/* Engagement Rate */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-extrabold font-display text-sm tabular-nums text-ink-primary-light dark:text-ink-primary-dark">
                              {item.engagementRate}%
                            </span>
                            {getTierBadge(item.tier)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={api.getAccountPdfUrl(item.id)}
                              download={`Laporan_Audit_ER_${item.platform}_${item.username.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                              title="Cetak Laporan PDF Audit untuk akun ini"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAccount(item.id);
                              }}
                              className="p-1.5 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark hover:bg-brand hover:text-white border border-black/5 dark:border-white/5 transition-colors text-ink-secondary-light dark:text-ink-secondary-dark"
                              title="Lihat Detail Analisis & Postingan"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAccountToDelete(item);
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 transition-all"
                              title="Hapus Akun / Jubir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Jubir Profile Modal */}
      {editingJubir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#12141A] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
                  Atur Penugasan Wilayah & Peran Jubir
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingJubir(null)}
                className="p-1 rounded-lg text-ink-tertiary-light hover:text-ink-primary-light"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5">
              <div className="w-10 h-10 rounded-full bg-brand text-white font-bold flex items-center justify-center text-sm">
                {editingJubir.displayName[0] || 'J'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-ink-primary-light dark:text-ink-primary-dark truncate">
                  {editingJubir.displayName}
                </p>
                <p className="text-[11px] font-mono text-ink-secondary-light dark:text-ink-secondary-dark truncate">
                  @{editingJubir.username} ({editingJubir.platform})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Kota / Daerah Penugasan
                </label>
                <input
                  type="text"
                  list="city-suggestions"
                  value={editCityInput}
                  onChange={(e) => setEditCityInput(e.target.value)}
                  placeholder="Contoh: Jakarta, Surabaya, Bandung, Medan..."
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
                  required
                />
                <datalist id="city-suggestions">
                  <option value="Nasional" />
                  <option value="Jakarta" />
                  <option value="Surabaya" />
                  <option value="Bandung" />
                  <option value="Medan" />
                  <option value="Semarang" />
                  <option value="Makassar" />
                  <option value="Denpasar" />
                  <option value="Yogyakarta" />
                </datalist>
                <p className="text-[10px] text-ink-tertiary-light mt-1">
                  Peringkat realtime akan otomatis dikelompokkan berdasarkan kota ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Peran / Jabatan Juru Bicara
                </label>
                <input
                  type="text"
                  list="role-suggestions"
                  value={editRoleInput}
                  onChange={(e) => setEditRoleInput(e.target.value)}
                  placeholder="Contoh: Jubir Utama, Jubir Muda, Jubir Daerah..."
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
                  required
                />
                <datalist id="role-suggestions">
                  <option value="Jubir Utama" />
                  <option value="Jubir Daerah" />
                  <option value="Jubir Komunikasi" />
                  <option value="Jubir Muda" />
                  <option value="Jubir Wilayah" />
                </datalist>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingJubir(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#12141A] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark">
                  Hapus Akun / Jubir?
                </h3>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
                  Konfirmasi penghapusan permanen akun
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-sm">
                {accountToDelete.displayName[0] || 'J'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-ink-primary-light dark:text-ink-primary-dark truncate">
                  {accountToDelete.displayName}
                </p>
                <p className="text-[11px] font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                  @{accountToDelete.username} • {accountToDelete.platform}
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
              Akun ini akan dihapus secara permanen beserta seluruh snapshot followers, postingan, dan riwayat kalkulasi analisis ER yang terkait.
            </p>

            {deleteAccountError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {deleteAccountError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={deletingAccount}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingAccount ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
