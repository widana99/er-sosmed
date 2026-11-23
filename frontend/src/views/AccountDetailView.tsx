import React, { useEffect, useState } from 'react';
import { api, SocialAccount, RankedPostItem } from '../services/api.js';
import { ErHeroCard } from '../components/ErHeroCard.js';
import { EngagementTrendChart } from '../components/Charts/EngagementTrendChart.js';
import { AiIntelligenceHub } from '../components/AiIntelligenceHub.js';
import { PeriodFilterBar } from '../components/PeriodFilterBar.js';
import {
  PeriodFilterConfig,
  filterPostsByPeriod,
  computeFilteredAnalytics,
} from '../utils/periodAnalytics.js';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  Lock,
  Globe,
  Sparkles,
  Calendar,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Info,
  Youtube,
  Instagram,
  Facebook,
  ExternalLink,
  PlaySquare,
  Video,
  Radio,
  Clapperboard,
  Layers,
  Image as ImageIcon,
  LayoutGrid,
  Tag,
} from 'lucide-react';
import { getNicheBadgeStyle } from '../components/PostContentNicheSection.js';
import { useLanguage } from '../i18n/LanguageContext.js';

interface AccountDetailViewProps {
  accountId: string;
  onBack: () => void;
}

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({
  accountId,
  onBack,
}) => {
  const [account, setAccount] = useState<SocialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  // Content Type Filter (YouTube & Instagram format slicing)
  type ContentTypeOption = 'ALL' | 'LONG_VIDEO' | 'SHORTS' | 'LIVE' | 'REELS' | 'FEED_POST' | 'PHOTO_CAROUSEL' | 'HIGHLIGHT';
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeOption>('ALL');

  // Period / Date / Month / Year Filter State
  const [filterConfig, setFilterConfig] = useState<PeriodFilterConfig>({ mode: 'ALL' });
  const [filteringAsync, setFilteringAsync] = useState(false);

  // New Post Form
  const [newPostLikes, setNewPostLikes] = useState('');
  const [newPostComments, setNewPostComments] = useState('');
  const [newPostViews, setNewPostViews] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  const loadAccount = async (filterParams?: {
    year?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
    contentType?: string;
  }) => {
    try {
      setLoading(true);
      const paramsToSend = {
        ...(filterParams || {}),
        contentType:
          filterParams?.contentType !== undefined
            ? filterParams.contentType
            : selectedContentType !== 'ALL'
            ? selectedContentType
            : undefined,
      };
      const data = await api.getAccountDetail(accountId, paramsToSend);
      setAccount(data);
    } catch (err) {
      console.error('Failed to load account detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContentTypeChange = async (newType: ContentTypeOption) => {
    setSelectedContentType(newType);
    if (!account) return;

    const params: { year?: string; month?: string; startDate?: string; endDate?: string; contentType?: string } = {};
    if (filterConfig.mode === 'YEAR' && filterConfig.year) {
      params.year = String(filterConfig.year);
    } else if (filterConfig.mode === 'MONTH' && filterConfig.year !== undefined && filterConfig.month !== undefined) {
      params.year = String(filterConfig.year);
      params.month = String(filterConfig.month);
    } else if (filterConfig.mode === 'CUSTOM') {
      if (filterConfig.customStartDate) params.startDate = filterConfig.customStartDate;
      if (filterConfig.customEndDate) params.endDate = filterConfig.customEndDate;
    }
    if (newType !== 'ALL') {
      params.contentType = newType;
    }

    try {
      setFilteringAsync(true);
      const updated = await api.getAccountDetail(account.id, params);
      setAccount(updated);
    } catch (err) {
      console.warn('Content type filter reload failed:', err);
    } finally {
      setFilteringAsync(false);
    }
  };

  const handlePeriodChange = async (newConfig: PeriodFilterConfig) => {
    setFilterConfig(newConfig);
    if (!account) return;

    // Build backend query params to execute fast Python Pandas slicing
    const params: { year?: string; month?: string; startDate?: string; endDate?: string; contentType?: string } = {};
    if (newConfig.mode === 'YEAR' && newConfig.year) {
      params.year = String(newConfig.year);
    } else if (newConfig.mode === 'MONTH' && newConfig.year !== undefined && newConfig.month !== undefined) {
      params.year = String(newConfig.year);
      params.month = String(newConfig.month);
    } else if (newConfig.mode === 'CUSTOM') {
      if (newConfig.customStartDate) params.startDate = newConfig.customStartDate;
      if (newConfig.customEndDate) params.endDate = newConfig.customEndDate;
    }
    if (selectedContentType !== 'ALL') {
      params.contentType = selectedContentType;
    }

    try {
      setFilteringAsync(true);
      const updated = await api.getAccountDetail(account.id, Object.keys(params).length > 0 ? params : undefined);
      setAccount(updated);
    } catch (err) {
      console.warn('Period filter reload failed, using client-side analytics fallback:', err);
    } finally {
      setFilteringAsync(false);
    }
  };

  const handleRecalculate = async () => {
    if (!account) return;
    try {
      setRecalculating(true);
      await api.calculateAndSave({
        accountId: account.id,
        formulaType: account.platform === 'INSTAGRAM' ? 'FOLLOWER_BASED' : 'VIEW_BASED',
      });
      await loadAccount();
    } catch (err) {
      console.error('Recalculate failed:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await api.deleteAccount(account.id);
      setShowDeleteModal(false);
      onBack();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus akun.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !newPostLikes || !newPostComments) return;

    try {
      await fetch(`/api/accounts/${account.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likes: Number(newPostLikes),
          comments: Number(newPostComments),
          views: newPostViews ? Number(newPostViews) : undefined,
          caption: newPostCaption,
        }),
      });

      setShowAddPostModal(false);
      setNewPostLikes('');
      setNewPostComments('');
      setNewPostViews('');
      setNewPostCaption('');

      // Recalculate ER automatically with new post!
      await handleRecalculate();
    } catch (err) {
      console.error('Failed to add post:', err);
    }
  };

  if (loading || !account) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-black/5 dark:bg-white/5 rounded-xl" />
        <div className="h-44 bg-black/5 dark:bg-white/5 rounded-2xl" />
        <div className="h-72 bg-black/5 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const snapshot = account.snapshots?.[0];
  const latestAnalysis = account.analyses?.[0];
  const followers = snapshot?.followers || 1;
  const isInstagram = account.platform === 'INSTAGRAM';
  const isYouTube = account.platform === 'YOUTUBE';
  const isFacebook = account.platform === 'FACEBOOK';
  const isAccountPrivate =
    Boolean(account.isPrivate) ||
    account.accountType === 'Private Account' ||
    account.accountType?.toLowerCase().includes('private');

  // Convert raw posts to RankedPostItem format for client filtering & analytics
  const allRankedPosts: RankedPostItem[] = (account.posts || []).map((p, idx) => {
    const viewsVal = p.views ?? 0;
    const sharesVal = p.shares ?? 0;
    const postContentType = (p as any).contentType || (isYouTube ? 'LONG_VIDEO' : 'FEED_POST');
    const pCtUpper = postContentType.toUpperCase();

    let postER = 0;
    if (isYouTube) {
      postER = Number((((p.likes + p.comments) / (viewsVal || 1)) * 100).toFixed(2));
    } else if (isFacebook) {
      if ((pCtUpper === 'VIDEO' || pCtUpper === 'REELS' || pCtUpper === 'REEL') && viewsVal > 0) {
        postER = Number((((p.likes + p.comments + sharesVal) / viewsVal) * 100).toFixed(2));
      } else {
        postER = Number((((p.likes + p.comments + sharesVal) / followers) * 100).toFixed(2));
      }
    } else if (isInstagram) {
      if ((pCtUpper === 'REELS' || pCtUpper === 'REEL') && viewsVal > 0) {
        postER = Number((((p.likes + p.comments + sharesVal) / viewsVal) * 100).toFixed(2));
      } else {
        postER = Number((((p.likes + p.comments) / followers) * 100).toFixed(2));
      }
    } else {
      postER = Number((((p.likes + p.comments + sharesVal) / (viewsVal || 1)) * 100).toFixed(2));
    }

    let tier: 'VIRAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
    if (postER >= 8.0) tier = 'VIRAL';
    else if (postER >= 5.0) tier = 'HIGH';
    else if (postER < 2.0) tier = 'LOW';

    return {
      index: idx + 1,
      likes: p.likes,
      comments: p.comments,
      views: viewsVal,
      shares: sharesVal,
      caption: p.caption,
      postedAt: p.postedAt,
      postER,
      tier,
      contentType: postContentType,
      postUrl: p.postUrl,
      contentNiche: p.contentNiche,
    };
  });

  // Filter by selected format if applicable (YouTube or Instagram)
  const postsToFilter = selectedContentType !== 'ALL'
    ? allRankedPosts.filter(p => {
        const ct = (p.contentType || (isYouTube ? 'LONG_VIDEO' : 'FEED_POST')).toUpperCase();
        if (isYouTube) {
          if (selectedContentType === 'LONG_VIDEO') return ct === 'LONG_VIDEO' || ct === 'VIDEO';
          return ct === selectedContentType;
        } else if (isInstagram) {
          if (selectedContentType === 'FEED_POST') return ct === 'FEED_POST' || ct === 'FEED' || ct === 'POST';
          if (selectedContentType === 'PHOTO_CAROUSEL') return ct === 'PHOTO_CAROUSEL' || ct === 'CAROUSEL' || ct === 'ALBUM';
          if (selectedContentType === 'REELS') return ct === 'REELS' || ct === 'REEL';
          if (selectedContentType === 'HIGHLIGHT') return ct === 'HIGHLIGHT' || ct === 'HIGHLIGHTS';
          return ct === selectedContentType;
        }
        return ct === selectedContentType;
      })
    : allRankedPosts;

  // Client-side instant period filtering
  const { filteredPosts, label: periodLabel, hasActiveFilter } = filterPostsByPeriod(
    postsToFilter,
    filterConfig,
    language
  );

  // Compute period-adjusted metrics
  const filteredCount = filteredPosts.length;
  const filteredLikes = filteredPosts.reduce((acc, p) => acc + p.likes, 0);
  const filteredComments = filteredPosts.reduce((acc, p) => acc + p.comments, 0);
  const filteredViews = filteredPosts.reduce((acc, p) => acc + p.views, 0);
  const filteredShares = filteredPosts.reduce((acc, p) => acc + p.shares, 0);

  const avgFilteredLikes = filteredCount > 0 ? Math.round(filteredLikes / filteredCount) : 0;
  const avgFilteredComments = filteredCount > 0 ? Math.round(filteredComments / filteredCount) : 0;
  const avgFilteredViews = filteredCount > 0 ? Math.round(filteredViews / filteredCount) : 0;
  const avgFilteredShares = filteredCount > 0 ? Math.round(filteredShares / filteredCount) : 0;

  const isReelsFilter = isInstagram && selectedContentType === 'REELS';
  const filteredER =
    filteredCount === 0
      ? 0
      : isYouTube
      ? Number((((filteredLikes + filteredComments) / (filteredViews || 1)) * 100).toFixed(2))
      : isInstagram
      ? (isReelsFilter && filteredViews > 0
          ? Number((((filteredLikes + filteredComments + filteredShares) / filteredViews) * 100).toFixed(2))
          : Number((((avgFilteredLikes + avgFilteredComments) / followers) * 100).toFixed(2)))
      : Number((((filteredLikes + filteredComments + filteredShares) / (filteredViews || 1)) * 100).toFixed(2));

  // Chart data from filtered posts
  const postTrendData = filteredPosts.map((post, idx) => ({
    date: `Post #${filteredPosts.length - idx}`,
    er: post.postER,
    likes: post.likes,
    comments: post.comments,
  })).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-secondary-light dark:text-ink-secondary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download PDF Audit Report */}
          <a
            href={`/api/export/account/${account.id}/pdf`}
            download={`Laporan_Audit_ER_${account.platform}_${account.username.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all shadow-xs hover:scale-[1.02]"
            title={t.exportPdf}
          >
            <FileText className="w-4 h-4" />
            <span>{t.exportPdf}</span>
          </a>

          {/* Download Excel */}
          <a
            href={api.getAccountsExcelUrl({
              accountId: account.id,
              periodMode: filterConfig.mode,
              year: filterConfig.year,
              month: filterConfig.month,
              startDate: filterConfig.customStartDate,
              endDate: filterConfig.customEndDate,
            })}
            download={`Laporan_ER_${account.platform}_${account.username.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all shadow-xs hover:scale-[1.02]"
            title={t.exportExcel}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.exportExcel}</span>
          </a>

          {!isAccountPrivate && (
            <>
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                <span>{t.recalculate}</span>
              </button>
              <button
                onClick={() => setShowAddPostModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addPost}</span>
              </button>
            </>
          )}

          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-600 hover:text-white transition-all shadow-xs hover:scale-[1.02]"
            title="Hapus Akun / Jubir Ini"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Akun</span>
          </button>
        </div>
      </div>

      {/* Account Profile Header */}
      <div className="card-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand/10 border-2 border-brand/20 shrink-0 flex items-center justify-center font-display font-bold text-2xl text-brand shadow-sm">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.username} className="w-full h-full object-cover" />
              ) : (
                account.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                  {account.displayName || `@${account.username}`}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                  isInstagram
                    ? 'bg-pink-500/10 text-pink-600'
                    : isYouTube
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                    : isFacebook
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                }`}>
                  {account.platform}
                </span>

                {account.joinedText && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shadow-xs">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>{account.joinedText}</span>
                  </span>
                )}

                {/* Explicit Public vs Private Detection Badge */}
                {isAccountPrivate ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>AKUN PRIVAT</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>AKUN PUBLIK TERVERIFIKASI</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
                @{account.username} • {account.accountType || (isAccountPrivate ? 'Private Profile' : 'Creator / Influencer')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-black/5 dark:border-white/5 font-mono text-xs">
            <div>
              <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark text-[11px] block">{t.followers}</span>
              <span className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark">
                {followers.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark text-[11px] block">{t.following}</span>
              <span className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark">
                {snapshot?.following?.toLocaleString() || 0}
              </span>
            </div>
            <div>
              <span className="text-ink-tertiary-light dark:text-ink-tertiary-dark text-[11px] block">
                {isAccountPrivate ? 'Total Postingan (Privat)' : t.totalPosts}
              </span>
              <span className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark">
                {isAccountPrivate ? snapshot?.postsCount || 0 : account.posts?.length || snapshot?.postsCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRIVACY PROTECTED NOTICE: Rendered when account is private */}
      {isAccountPrivate ? (
        <div className="card-surface p-6 sm:p-8 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                <span>Akun Privat Terdeteksi — Konten Dilindungi Privasi</span>
              </h2>
              <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
                Akun @{account.username} ({account.platform}) mengaktifkan setelan akun privat.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
            <p>
              Sesuai dengan standar audit data sosial media yang jujur dan presisi, sistem mendeteksi bahwa akun ini berstatus <strong>Privat</strong>. Seluruh postingan, reel, dan metrik interaksi video dibatasi oleh platform sehingga tidak dapat diakses secara publik tanpa otorisasi pertemanan.
            </p>
            <p className="text-amber-800 dark:text-amber-300 font-semibold">
              🛡️ Kebijakan Anti-Dummy Data: Sistem menolak menghasilkan data tiruan atau angka ER rekaan untuk akun privat agar integritas audit Anda tetap 100% kredibel.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5 space-y-2 text-xs font-mono">
            <div className="text-ink-primary-light dark:text-ink-primary-dark font-semibold">
              Rincian Akses Profil:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark">
                <span className="text-[10px] text-ink-tertiary-light block">Followers Teridentifikasi</span>
                <span className="font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
                  {followers.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark">
                <span className="text-[10px] text-ink-tertiary-light block">Following Teridentifikasi</span>
                <span className="font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
                  {snapshot?.following?.toLocaleString() || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark">
                <span className="text-[10px] text-ink-tertiary-light block">Status Postingan</span>
                <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                  {snapshot?.postsCount || 0} Post (Privat / Dilindungi)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PUBLIC ACCOUNT: Full Analytical Engine & Deep Period Breakdown */
        <>
          {/* YouTube Content Format Slicer (Semua, Video Panjang, Shorts, Live) */}
          {isYouTube && (
            <div className="card-surface p-4 border border-red-500/20 bg-gradient-to-r from-red-500/5 via-surface-light dark:via-surface-dark to-surface-light dark:to-surface-dark space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-primary-light dark:text-ink-primary-dark">
                    Filter Format Konten YouTube
                  </span>
                </div>
                <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                  {selectedContentType === 'ALL'
                    ? 'Menampilkan Semua Format'
                    : selectedContentType === 'LONG_VIDEO'
                    ? 'Khusus Video Panjang'
                    : selectedContentType === 'SHORTS'
                    ? 'Khusus Shorts'
                    : 'Khusus Live / Replay'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleContentTypeChange('ALL')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'ALL'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <PlaySquare className="w-3.5 h-3.5" />
                  <span>Semua Konten ({allRankedPosts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleContentTypeChange('LONG_VIDEO')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'LONG_VIDEO'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>
                    Video Panjang (
                    {
                      allRankedPosts.filter(
                        (p) =>
                          (p.contentType || 'LONG_VIDEO').toUpperCase() === 'LONG_VIDEO' ||
                          (p.contentType || 'LONG_VIDEO').toUpperCase() === 'VIDEO'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleContentTypeChange('SHORTS')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'SHORTS'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <PlaySquare className="w-3.5 h-3.5" />
                  <span>
                    Shorts (
                    {
                      allRankedPosts.filter(
                        (p) => (p.contentType || '').toUpperCase() === 'SHORTS'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleContentTypeChange('LIVE')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'LIVE'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>
                    Live / Replay (
                    {
                      allRankedPosts.filter(
                        (p) => (p.contentType || '').toUpperCase() === 'LIVE'
                      ).length
                    }
                    )
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Instagram Content Format Slicer (Semua, Reels, Feed Post, Carousel, Highlight) */}
          {isInstagram && (
            <div className="card-surface p-4 border border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-surface-light dark:to-surface-dark space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-primary-light dark:text-ink-primary-dark">
                    Filter Format Konten Instagram
                  </span>
                </div>
                <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                  {selectedContentType === 'ALL'
                    ? 'Menampilkan Semua Format'
                    : selectedContentType === 'REELS'
                    ? 'Khusus Reels (Video Pendek)'
                    : selectedContentType === 'FEED_POST'
                    ? 'Khusus Postingan Feed'
                    : selectedContentType === 'PHOTO_CAROUSEL'
                    ? 'Khusus Carousel Album'
                    : 'Khusus Highlight / Sorotan'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleContentTypeChange('ALL')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'ALL'
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Semua Konten ({allRankedPosts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleContentTypeChange('REELS')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'REELS'
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>
                    Reels (
                    {
                      allRankedPosts.filter(
                        (p) =>
                          (p.contentType || '').toUpperCase() === 'REELS' ||
                          (p.contentType || '').toUpperCase() === 'REEL'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleContentTypeChange('FEED_POST')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'FEED_POST'
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>
                    Postingan Feed (
                    {
                      allRankedPosts.filter(
                        (p) =>
                          (p.contentType || 'FEED_POST').toUpperCase() === 'FEED_POST' ||
                          (p.contentType || '').toUpperCase() === 'FEED' ||
                          (p.contentType || '').toUpperCase() === 'POST'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleContentTypeChange('PHOTO_CAROUSEL')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'PHOTO_CAROUSEL'
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    Carousel Album (
                    {
                      allRankedPosts.filter(
                        (p) =>
                          (p.contentType || '').toUpperCase() === 'PHOTO_CAROUSEL' ||
                          (p.contentType || '').toUpperCase() === 'CAROUSEL' ||
                          (p.contentType || '').toUpperCase() === 'ALBUM'
                      ).length
                    }
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleContentTypeChange('HIGHLIGHT')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    selectedContentType === 'HIGHLIGHT'
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-xs'
                      : 'bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Highlight / Sorotan (
                    {
                      allRankedPosts.filter(
                        (p) =>
                          (p.contentType || '').toUpperCase() === 'HIGHLIGHT' ||
                          (p.contentType || '').toUpperCase() === 'HIGHLIGHTS'
                      ).length
                    }
                    )
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Period & Temporal Filter Bar (Custom Range, Year, Month, 30D, 90D) */}
          {allRankedPosts.length > 0 && (
            <div className="space-y-2">
              <PeriodFilterBar
                posts={allRankedPosts}
                config={filterConfig}
                onChange={handlePeriodChange}
                activeLabel={periodLabel}
                hasActiveFilter={hasActiveFilter}
                totalFiltered={filteredCount}
                totalOriginal={allRankedPosts.length}
                language={language}
              />
              {filteringAsync && (
                <div className="flex items-center gap-2 text-xs font-mono text-brand px-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memperbarui analitik statistik mendalam Python untuk periode terpilih...</span>
                </div>
              )}
            </div>
          )}

          {/* Python Deep Statistical Engine Card if available */}
          {account.deepAnalysis && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand/10 via-brand/5 to-transparent border border-brand/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                      <span>Python Data Engine — Analisis Presisi Multi-Metrik</span>
                    </h3>
                    <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark">
                      Dihitung secara vektorisasi via Pandas & NumPy bebas distorsi outlier.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {hasActiveFilter && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-brand/15 text-brand font-bold border border-brand/25">
                      {periodLabel}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark">
                    {account.deepAnalysis.sampleSize} posts
                  </span>
                </div>
              </div>

              {/* 4 Golden Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-black/40 border border-brand/20 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                    Median ER (Golden Metric)
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-display text-ink-primary-light dark:text-ink-primary-dark tabular-nums">
                    {account.deepAnalysis.medianER}%
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">
                    Tahan Outlier Viral
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-black/40 border border-black/5 dark:border-white/5 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                    Mean ER (Rata-Rata Biasa)
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-display text-ink-secondary-light dark:text-ink-secondary-dark tabular-nums">
                    {account.deepAnalysis.averageER}%
                  </span>
                  <span className="text-[10px] text-ink-tertiary-light block mt-0.5">
                    {account.deepAnalysis.averageER > account.deepAnalysis.medianER
                      ? 'Terdongkrak Post Viral'
                      : 'Distribusi Merata'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-black/40 border border-black/5 dark:border-white/5 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                    Skor Konsistensi Konten
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-display text-brand tabular-nums">
                    {account.deepAnalysis.consistencyScore}%
                  </span>
                  <span className="text-[10px] text-ink-tertiary-light block mt-0.5">
                    Stabilitas Audiens
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-black/40 border border-black/5 dark:border-white/5 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                    Valuasi Rate Card (IDR)
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-purple-600 dark:text-purple-400 truncate block mt-1">
                    {account.deepAnalysis.rateCardValuation?.formatted || 'N/A'}
                  </span>
                  <span className="text-[10px] text-ink-tertiary-light block mt-0.5">
                    Estimasi Komersial Riil
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid: ER Hero Card & Post Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {latestAnalysis ? (
                <ErHeroCard
                  engagementRate={hasActiveFilter ? filteredER : latestAnalysis.engagementRate}
                  formulaType={latestAnalysis.formulaType}
                  sampleSize={hasActiveFilter ? filteredCount : latestAnalysis.sampleSize}
                  averageLikes={hasActiveFilter ? avgFilteredLikes : latestAnalysis.averageLikes}
                  averageComments={hasActiveFilter ? avgFilteredComments : latestAnalysis.averageComments}
                  averageViews={hasActiveFilter ? avgFilteredViews : latestAnalysis.averageViews}
                  averageShares={hasActiveFilter ? avgFilteredShares : latestAnalysis.averageShares}
                  followers={followers}
                  source={latestAnalysis.source}
                  analyzedAt={latestAnalysis.analyzedAt}
                />
              ) : (
                <div className="card-surface p-6 text-center text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                  {language === 'id' ? 'Belum ada data analisis. Klik Hitung Ulang ER.' : 'No analysis run yet. Click Recalculate ER.'}
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <EngagementTrendChart
                data={postTrendData}
                title={
                  hasActiveFilter
                    ? `${language === 'id' ? 'Grafik Keterlibatan' : 'Engagement Rate'} — ${periodLabel} (${filteredCount} Post)`
                    : (language === 'id' ? 'Grafik Keterlibatan per Postingan (%)' : 'Individual Post Engagement Rate (%)')
                }
              />
            </div>
          </div>

          {/* AI Content Intelligence & Viral Prediction Suite */}
          {account.posts && account.posts.length > 0 && (
            <AiIntelligenceHub
              accountId={account.id}
              username={account.username}
              platform={account.platform}
              followers={followers}
            />
          )}

          {/* Post Analytics Table */}
          <div className="card-surface p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-2">
                  <span>{language === 'id' ? 'Rincian Postingan Terakhir' : 'Post Performance Breakdown'}</span>
                  {hasActiveFilter && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand/10 text-brand border border-brand/20">
                      {periodLabel}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
                  {language === 'id'
                    ? 'Tabel rincian angka interaksi, suka, komentar, tayangan, dan nilai ER per video/foto yang terverifikasi.'
                    : 'Breakdown of individual posts metrics, likes, comments, views, and calculated ER.'}
                </p>
              </div>
              <span className="text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
                {filteredCount} / {account.posts?.length || 0} {t.posts.toLowerCase()}
              </span>
            </div>

            {/* Content Niche Distribution Summary */}
            {account.nicheBreakdown && account.nicheBreakdown.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-primary-light dark:text-ink-primary-dark flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand" />
                    <span>{language === 'id' ? 'Distribusi Jenis Konten Akun' : 'Content Niche Distribution'}</span>
                  </span>
                  {account.primaryNiche && (
                    <span className="text-[11px] font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                      {language === 'id' ? 'Kategori Utama:' : 'Primary Niche:'}{' '}
                      <strong className="text-brand font-bold">{account.primaryNiche}</strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {account.nicheBreakdown.map((item) => {
                    const style = getNicheBadgeStyle(item.niche);
                    return (
                      <span
                        key={item.niche}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        <span>{item.niche}</span>
                        <span className="font-mono text-[10px] opacity-75 font-bold">
                          ({item.count} · {item.percentage}%)
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredCount === 0 ? (
              <div className="p-8 text-center rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5 space-y-2">
                <Info className="w-6 h-6 text-ink-tertiary-light mx-auto" />
                <p className="text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                  Tidak ada postingan pada rentang waktu: {periodLabel}
                </p>
                <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark">
                  Coba ubah tahun, pilih bulan lain, atau reset filter ke "Semua Waktu".
                </p>
                <button
                  type="button"
                  onClick={() => handlePeriodChange({ mode: 'ALL' })}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
                >
                  Tampilkan Semua Postingan
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-black/5 dark:border-white/5 font-mono uppercase text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
                    <tr>
                      <th className="py-2.5 px-3">Post #</th>
                      {(isYouTube || isInstagram || isFacebook) && <th className="py-2.5 px-3">Format</th>}
                      <th className="py-2.5 px-3">{language === 'id' ? 'Jenis Konten' : 'Content Niche'}</th>
                      <th className="py-2.5 px-3">{t.date}</th>
                      <th className="py-2.5 px-3">{t.caption}</th>
                      <th className="py-2.5 px-3 text-right">{t.likes}</th>
                      <th className="py-2.5 px-3 text-right">{t.comments}</th>
                      <th className="py-2.5 px-3 text-right">{t.views}</th>
                      <th className="py-2.5 px-3 text-right">Shares</th>
                      <th className="py-2.5 px-3 text-right">{t.postEr}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
                    {filteredPosts.map((post, idx) => (
                      <tr key={`post-${post.index}-${idx}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-semibold text-brand">
                          #{filteredPosts.length - idx}
                        </td>
                        {isYouTube && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            {(post.contentType || 'LONG_VIDEO').toUpperCase() === 'SHORTS' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                <PlaySquare className="w-3 h-3" />
                                Shorts
                              </span>
                            ) : (post.contentType || '').toUpperCase() === 'LIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <Radio className="w-3 h-3" />
                                Live
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <Video className="w-3 h-3" />
                                Video
                              </span>
                            )}
                          </td>
                        )}
                        {isInstagram && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            {((post.contentType || '').toUpperCase() === 'REELS' || (post.contentType || '').toUpperCase() === 'REEL') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
                                <Clapperboard className="w-3 h-3" />
                                Reels
                              </span>
                            ) : ((post.contentType || '').toUpperCase() === 'PHOTO_CAROUSEL' || (post.contentType || '').toUpperCase() === 'CAROUSEL' || (post.contentType || '').toUpperCase() === 'ALBUM') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <Layers className="w-3 h-3" />
                                Carousel
                              </span>
                            ) : ((post.contentType || '').toUpperCase() === 'HIGHLIGHT' || (post.contentType || '').toUpperCase() === 'HIGHLIGHTS') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Sparkles className="w-3 h-3" />
                                Highlight
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <ImageIcon className="w-3 h-3" />
                                Feed Post
                              </span>
                            )}
                          </td>
                        )}
                        {isFacebook && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            {((post.contentType || '').toUpperCase() === 'REELS' || (post.contentType || '').toUpperCase() === 'REEL') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                <Clapperboard className="w-3 h-3" />
                                Reels
                              </span>
                            ) : ((post.contentType || '').toUpperCase() === 'VIDEO') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <Video className="w-3 h-3" />
                                Video
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <ImageIcon className="w-3 h-3" />
                                Post
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {(() => {
                            const style = getNicheBadgeStyle(post.contentNiche);
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                <span>{post.contentNiche || 'General / Campuran'}</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3 text-ink-tertiary-light dark:text-ink-tertiary-dark whitespace-nowrap">
                          {post.postedAt
                            ? new Date(post.postedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-3 font-sans text-ink-primary-light dark:text-ink-primary-dark max-w-xs truncate">
                          {post.postUrl ? (
                            <a
                              href={post.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 hover:text-brand hover:underline transition-colors group"
                              title={`Buka Postingan di ${isYouTube ? 'YouTube' : isFacebook ? 'Facebook' : isInstagram ? 'Instagram' : 'TikTok'}`}
                            >
                              <span className="truncate">{post.caption || (isYouTube ? 'Video YouTube' : isFacebook ? 'Postingan Facebook' : isInstagram ? 'Postingan Instagram' : 'Video TikTok')}</span>
                              <ExternalLink className={`w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0 ${isYouTube ? 'text-red-500' : isFacebook ? 'text-blue-500' : isInstagram ? 'text-pink-500' : 'text-cyan-500'}`} />
                            </a>
                          ) : (
                            post.caption || '—'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                          {post.likes.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-ink-secondary-light dark:text-ink-secondary-dark">
                          {post.comments.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-ink-secondary-light dark:text-ink-secondary-dark">
                          {post.views !== null && post.views !== undefined
                            ? post.views.toLocaleString()
                            : isInstagram
                            ? 'N/A (Foto)'
                            : '0'}
                        </td>
                        <td className="py-3 px-3 text-right text-ink-secondary-light dark:text-ink-secondary-dark">
                          {post.shares !== null && post.shares !== undefined
                            ? post.shares.toLocaleString()
                            : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-brand">
                          {post.postER.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Post Modal */}
      {showAddPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="card-surface p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-display text-ink-primary-light dark:text-ink-primary-dark">
              {language === 'id' ? `Tambah Postingan Baru: @${account.username}` : `Add New Post: @${account.username}`}
            </h3>

            <form onSubmit={handleAddPost} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  {t.likes} *
                </label>
                <input
                  type="number"
                  required
                  value={newPostLikes}
                  onChange={(e) => setNewPostLikes(e.target.value)}
                  placeholder="e.g. 750"
                  className="w-full bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  {t.comments} *
                </label>
                <input
                  type="number"
                  required
                  value={newPostComments}
                  onChange={(e) => setNewPostComments(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  {t.views} ({language === 'id' ? 'Opsional untuk IG, Wajib untuk TikTok' : 'Optional for IG, Required for TikTok'})
                </label>
                <input
                  type="number"
                  value={newPostViews}
                  onChange={(e) => setNewPostViews(e.target.value)}
                  placeholder="e.g. 8500"
                  className="w-full bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  {t.caption}
                </label>
                <input
                  type="text"
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  placeholder="e.g. Highlight kegiatan terbaru"
                  className="w-full bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddPostModal(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {t.save} & {t.recalculate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#12141A] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark">
                  Hapus Akun @{account.username}?
                </h3>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
                  Konfirmasi penghapusan akun dari sistem
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
              Akun <strong className="text-ink-primary-light dark:text-ink-primary-dark">@{account.username}</strong> ({account.platform}) akan dihapus secara permanen beserta seluruh {account.posts?.length || 0} postingan, snapshot followers, dan riwayat analisisnya. Tindakan ini tidak dapat dibatalkan.
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
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
