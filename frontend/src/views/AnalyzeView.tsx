import React, { useState } from 'react';
import { api, SocialAccount, AccountCandidate, ComprehensiveAnalysisResult } from '../services/api.js';
import { ErHeroCard } from '../components/ErHeroCard.js';
import { ManualPostBuilder, ManualAnalysisPayload, ManualPostRow, ManualPostBuilderInitialData } from '../components/ManualPostBuilder.js';
import { AdvancedAnalysisResult } from '../components/AdvancedAnalysisResult.js';
import { BatchScraperSection } from '../components/BatchScraperSection.js';
import { AiIntelligenceHub } from '../components/AiIntelligenceHub.js';
import { PostContentNicheSection } from '../components/PostContentNicheSection.js';
import {
  Search,
  Calculator,
  Layers,
  Instagram,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Globe,
  Database,
  ExternalLink,
  Link2,
  Users,
  ChevronDown,
  ChevronUp,
  MapPin,
  Trophy,
  Check,
  Eye,
  Heart,
  MessageCircle,
  FileSpreadsheet,
  FileText,
  Download,
  RefreshCw,
  Edit3,
  Lock,
  Calendar,
  Youtube,
  Facebook,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';

interface AnalyzeViewProps {
  initialSearch?: { platform: string; username: string } | null;
  onSelectAccount: (accountId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  initialSearch,
  onSelectAccount,
  onNavigateTab,
}) => {
  const { t, language } = useLanguage();
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'>(
    (initialSearch?.platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK') || 'INSTAGRAM'
  );
  const [username, setUsername] = useState(initialSearch?.username || '');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SocialAccount | null>(null);
  const [candidates, setCandidates] = useState<AccountCandidate[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [searchError, setSearchError] = useState<{ message: string; profileUrl?: string } | null>(null);

  // Share link paste feature state
  const [pasteLinkOpen, setPasteLinkOpen] = useState(false);
  const [pasteLinkInput, setPasteLinkInput] = useState('');
  const [linkResolving, setLinkResolving] = useState(false);

  // Manual & Realtime Calculation State
  const [manualUsernameInput, setManualUsernameInput] = useState<string>('');
  const [manualPlatform, setManualPlatform] = useState<'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'>('INSTAGRAM');
  const [manualCity, setManualCity] = useState<string>('Jakarta');
  const [manualRole, setManualRole] = useState<string>('Jubir Utama');
  const [manualFollowers, setManualFollowers] = useState<string>('');
  const [manualFollowing, setManualFollowing] = useState<string>('');
  const [manualLikes, setManualLikes] = useState<string>('');
  const [manualComments, setManualComments] = useState<string>('');
  const [manualViews, setManualViews] = useState<string>('');
  const [manualShares, setManualShares] = useState<string>('');
  const [manualFormula, setManualFormula] = useState<'FOLLOWER_BASED' | 'VIEW_BASED'>('FOLLOWER_BASED');
  const [manualResult, setManualResult] = useState<any | null>(null);
  const [savingToLeaderboard, setSavingToLeaderboard] = useState(false);
  const [savedLeaderboardMsg, setSavedLeaderboardMsg] = useState<string | null>(null);

  // Tab State & Deep Analytics State
  const [activeTab, setActiveTab] = useState<'LIVE_SEARCH' | 'BATCH_SCRAPER' | 'MANUAL_OCR'>('LIVE_SEARCH');
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [builderInitialData, setBuilderInitialData] = useState<ManualPostBuilderInitialData | null>(null);
  const [showAiHub, setShowAiHub] = useState<boolean>(false);

  const handleDeepAnalyze = async (payload: ManualAnalysisPayload) => {
    try {
      setDeepLoading(true);
      setDeepError(null);
      const result = await api.calculateDeepAnalysis({
        platform: payload.platform,
        username: payload.username,
        followers: payload.followers,
        posts: payload.posts,
        accountId: searchResult?.id,
      });
      setDeepAnalysisResult(result);
    } catch (err: any) {
      console.error('Deep calculation error:', err);
      setDeepError(err.message || 'Gagal menghitung analisis statistik mendalam.');
    } finally {
      setDeepLoading(false);
    }
  };

  const handleTransferToEditor = (acc: SocialAccount) => {
    const postsToTransfer: ManualPostRow[] = (acc.posts || []).map((p, idx) => ({
      id: p.id || `scraped-${Date.now()}-${idx}`,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      views: p.views !== null && p.views !== undefined ? p.views : '',
      shares: p.shares !== null && p.shares !== undefined ? p.shares : '',
      caption: p.caption || `Post #${idx + 1}`,
      postUrl: p.postUrl || undefined,
    }));

    setBuilderInitialData({
      platform: acc.platform,
      username: acc.username,
      followers: acc.snapshots?.[0]?.followers || 1,
      posts: postsToTransfer.length > 0 ? postsToTransfer : undefined,
    });

    setActiveTab('MANUAL_OCR');
    setDeepAnalysisResult(null);
  };

  const handleOpenFullDeepAnalysis = (acc: SocialAccount) => {
    if (acc.deepAnalysis) {
      setDeepAnalysisResult(acc.deepAnalysis);
      setActiveTab('MANUAL_OCR');
    }
  };

  const populateAndComputeMetrics = (account: SocialAccount) => {
    setManualUsernameInput(account.username);
    setManualPlatform(account.platform);
    if (account.city) setManualCity(account.city);
    if (account.roleOrTitle) setManualRole(account.roleOrTitle);

    const f = account.snapshots?.[0]?.followers ?? 0;
    const fol = account.snapshots?.[0]?.following ?? 0;
    setManualFollowers(f > 0 ? String(f) : '');
    setManualFollowing(fol > 0 ? String(fol) : '');

    const selectedFormula = account.platform === 'TIKTOK' ? 'VIEW_BASED' : 'FOLLOWER_BASED';
    setManualFormula(selectedFormula);

    const analysis = account.analyses?.[0];
    let likesVal = 0;
    let commentsVal = 0;
    let viewsVal = 0;
    let sharesVal = 0;

    if (analysis) {
      likesVal = Math.round(analysis.averageLikes || 0);
      commentsVal = Math.round(analysis.averageComments || 0);
      viewsVal = Math.round(analysis.averageViews || 0);
      sharesVal = Math.round(analysis.averageShares || 0);
    } else if (account.posts && account.posts.length > 0) {
      const count = account.posts.length;
      const totalLikes = account.posts.reduce((acc: number, p: any) => acc + (p.likes || 0), 0);
      const totalComments = account.posts.reduce((acc: number, p: any) => acc + (p.comments || 0), 0);
      const totalViews = account.posts.reduce((acc: number, p: any) => acc + (p.views || 0), 0);
      const totalShares = account.posts.reduce((acc: number, p: any) => acc + (p.shares || 0), 0);
      likesVal = Math.round(totalLikes / count);
      commentsVal = Math.round(totalComments / count);
      viewsVal = Math.round(totalViews / count);
      sharesVal = Math.round(totalShares / count);
    }

    setManualLikes(likesVal > 0 ? String(likesVal) : '');
    setManualComments(commentsVal > 0 ? String(commentsVal) : '');
    setManualViews(viewsVal > 0 ? String(viewsVal) : '');
    setManualShares(sharesVal > 0 ? String(sharesVal) : '');

    if ((selectedFormula === 'VIEW_BASED' && viewsVal > 0) || (selectedFormula === 'FOLLOWER_BASED' && f > 0)) {
      const erFollowers = Number((((likesVal + commentsVal) / (f || 1)) * 100).toFixed(2));
      const erViews = Number((((likesVal + commentsVal + sharesVal) / (viewsVal || 1)) * 100).toFixed(2));
      const selectedEr = selectedFormula === 'FOLLOWER_BASED' ? erFollowers : erViews;

      let tier = 'Sedang';
      if (selectedEr >= 5) tier = 'Tinggi (High Interactivity)';
      else if (selectedEr >= 2.5) tier = 'Bagus (Good)';
      else if (selectedEr >= 1) tier = 'Sedang (Average)';
      else tier = 'Rendah (Low)';

      setManualResult({
        engagementRate: selectedEr,
        erFollowers,
        erViews,
        tier,
        formulaType: selectedFormula,
        sampleSize: analysis?.sampleSize || account.posts?.length || 1,
        averageLikes: likesVal,
        averageComments: commentsVal,
        averageViews: viewsVal,
        averageShares: sharesVal,
        followers: f,
        following: fol,
        city: account.city || 'Jakarta',
        roleOrTitle: account.roleOrTitle || 'Jubir',
        explanation:
          selectedFormula === 'FOLLOWER_BASED'
            ? `((${likesVal} likes + ${commentsVal} comments) / ${f.toLocaleString()} followers) × 100 = ${erFollowers}%`
            : `((${likesVal} likes + ${commentsVal} comments + ${sharesVal} shares) / ${viewsVal.toLocaleString()} views) × 100 = ${erViews}%`,
      });
    }
  };

  const [accountSource, setAccountSource] = useState<string>('API');

  const handleSearch = async (
    e?: React.FormEvent,
    targetUsername?: string,
    targetPlatform?: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'
  ) => {
    if (e) e.preventDefault();
    const queryToUse = (targetUsername || username).trim();
    const platformToUse = targetPlatform || platform;
    if (!queryToUse) return;

    try {
      setLoading(true);
      setSearchError(null);
      setSavedLeaderboardMsg(null);
      const res = await api.searchAccount(platformToUse, queryToUse);

      if (res.isNotFound) {
        const cleanU = queryToUse.replace(/^@/, '');
        setSearchError({
          message: res.message || `Akun ${platformToUse} @${cleanU} tidak ditemukan di platform.`,
          profileUrl: res.profileUrl,
        });
        setSearchResult(null);
        setCandidates(res.candidates || []);
        setPasteLinkOpen(true);
      } else if (res.account) {
        setSearchResult(res.account);
        setCandidates(res.candidates || []);
        setIsSimulated(false);
        setAccountSource(res.source || 'API');
        setSearchError(null);
        if (targetUsername) setUsername(targetUsername);
        if (targetPlatform) setPlatform(targetPlatform);

        // Pre-fill manual calculator and auto-compute with real metrics
        populateAndComputeMetrics(res.account);
      }
    } catch (err: any) {
      const cleanU = queryToUse.replace(/^@/, '');
      let profileUrl = `https://www.instagram.com/${cleanU}`;
      if (platformToUse === 'YOUTUBE') profileUrl = `https://www.youtube.com/@${cleanU}`;
      else if (platformToUse === 'TIKTOK') profileUrl = `https://www.tiktok.com/@${cleanU}`;
      else if (platformToUse === 'FACEBOOK') profileUrl = cleanU.startsWith('http') ? cleanU : `https://www.facebook.com/${cleanU}`;

      setSearchError({
        message: err.message || `Akun ${platformToUse} @${cleanU} tidak ditemukan di platform.`,
        profileUrl,
      });
      setSearchResult(null);
      setPasteLinkOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pasteLinkInput.trim()) return;

    try {
      setLinkResolving(true);
      setSearchError(null);
      setSavedLeaderboardMsg(null);
      const res = await api.resolveAccountLink(pasteLinkInput.trim());

      if (res.account) {
        setSearchResult(res.account);
        setCandidates(res.candidates || []);
        setIsSimulated(false);
        setAccountSource(res.source || 'LIVE_ONLINE');
        setUsername(res.account.username);
        setPlatform(res.account.platform);
        populateAndComputeMetrics(res.account);
        setPasteLinkInput('');
        setPasteLinkOpen(false);
      }
    } catch (err: any) {
      setSearchError({
        message: err.message || 'Gagal memproses tautan akun yang dibagikan.',
      });
    } finally {
      setLinkResolving(false);
    }
  };

  const handleManualCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const followers = Number(manualFollowers) || 1;
    const following = Number(manualFollowing) || 0;
    const likes = Number(manualLikes) || 0;
    const comments = Number(manualComments) || 0;
    const views = Number(manualViews) || 1;
    const shares = Number(manualShares) || 0;

    const erFollowers = Number((((likes + comments) / followers) * 100).toFixed(2));
    const erViews = Number((((likes + comments + shares) / views) * 100).toFixed(2));

    const selectedEr = manualFormula === 'FOLLOWER_BASED' ? erFollowers : erViews;

    let tier = 'Sedang';
    if (selectedEr >= 5) tier = 'Tinggi (High Interactivity)';
    else if (selectedEr >= 2.5) tier = 'Bagus (Good)';
    else if (selectedEr >= 1) tier = 'Sedang (Average)';
    else tier = 'Rendah (Low)';

    setManualResult({
      engagementRate: selectedEr,
      erFollowers,
      erViews,
      tier,
      formulaType: manualFormula,
      sampleSize: 1,
      averageLikes: likes,
      averageComments: comments,
      averageViews: views,
      averageShares: shares,
      followers,
      following,
      city: manualCity,
      roleOrTitle: manualRole,
      explanation:
        manualFormula === 'FOLLOWER_BASED'
          ? `((${likes} likes + ${comments} comments) / ${followers.toLocaleString()} followers) × 100 = ${erFollowers}%`
          : `((${likes} likes + ${comments} comments + ${shares} shares) / ${views.toLocaleString()} views) × 100 = ${erViews}%`,
    });
  };

  const handleSaveToLeaderboard = async () => {
    try {
      setSavingToLeaderboard(true);
      setSavedLeaderboardMsg(null);

      let targetAccount = searchResult;
      const targetUser = (manualUsernameInput || username || '').trim().replace(/^@/, '');

      if (!targetAccount) {
        if (!targetUser) {
          alert('Silakan masukkan username akun terlebih dahulu.');
          return;
        }
        const searchRes = await api.searchAccount(manualPlatform, targetUser);
        if (!searchRes.account) {
          alert(`Akun @${targetUser} tidak dapat ditemukan untuk dimasukkan ke leaderboard.`);
          return;
        }
        targetAccount = searchRes.account;
        setSearchResult(targetAccount);
      }

      // 1. Calculate & Save Run to Database
      await api.calculateAndSave({
        accountId: targetAccount.id,
        formulaType: manualFormula,
        manualFollowers: Number(manualFollowers) || 1,
        manualLikes: Number(manualLikes) || 0,
        manualComments: Number(manualComments) || 0,
        manualViews: Number(manualViews) || 0,
        manualShares: Number(manualShares) || 0,
      });

      // 2. Tag with City / Region and Role Jubir
      await api.updateJubir(targetAccount.id, {
        city: manualCity.trim() || 'Nasional',
        roleOrTitle: manualRole.trim() || 'Jubir',
      });

      // 3. Update active searchResult state
      setSearchResult({
        ...targetAccount,
        city: manualCity.trim() || 'Nasional',
        roleOrTitle: manualRole.trim() || 'Jubir',
      });

      // 4. Set success notification
      setSavedLeaderboardMsg(
        `✓ Akun @${targetAccount.username} berhasil disimpan dan masuk ke Peringkat Jubir wilayah ${manualCity || 'Nasional'}!`
      );
    } catch (err: any) {
      console.error('Save to leaderboard error:', err);
      alert(`Gagal menyimpan ke peringkat jubir: ${err.message}`);
    } finally {
      setSavingToLeaderboard(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
          Search & Analyze Engine
        </h1>
        <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
          Lookup social profiles, run simulation benchmarks, or compute custom Engagement Rate formulas.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-black/10 dark:border-white/10 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('LIVE_SEARCH')}
          className={`pb-3 px-4 text-xs font-semibold font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'LIVE_SEARCH'
              ? 'border-brand text-brand font-bold'
              : 'border-transparent text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>{t.tabLiveSearch}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BATCH_SCRAPER')}
          className={`pb-3 px-4 text-xs font-semibold font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'BATCH_SCRAPER'
              ? 'border-brand text-brand font-bold'
              : 'border-transparent text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.tabBatchScraper}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
            Multi-Akun
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MANUAL_OCR')}
          className={`pb-3 px-4 text-xs font-semibold font-mono tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'MANUAL_OCR'
              ? 'border-brand text-brand font-bold'
              : 'border-transparent text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{t.tabManualOcr}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand/10 text-brand">Deep ER</span>
        </button>
      </div>

      {/* Tab: Multi-Account Batch Scraper */}
      {activeTab === 'BATCH_SCRAPER' && (
        <BatchScraperSection
          onSelectAccount={onSelectAccount}
          onOpenSingleSearch={(plat, uname) => {
            const upper = plat.toUpperCase() as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
            const targetPlat = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK'].includes(upper) ? upper : 'INSTAGRAM';
            setPlatform(targetPlat);
            setUsername(uname);
            setActiveTab('LIVE_SEARCH');
            handleSearch(undefined, uname, targetPlat);
          }}
        />
      )}

      {/* Tab 2: Manual Post Builder & OCR Screenshot Deep Analytics */}
      {activeTab === 'MANUAL_OCR' && (
        <div className="space-y-6">
          {deepError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deepError}</span>
            </div>
          )}

          {deepAnalysisResult ? (
            <AdvancedAnalysisResult
              data={deepAnalysisResult}
              onReset={() => setDeepAnalysisResult(null)}
            />
          ) : (
            <ManualPostBuilder
              onAnalyze={handleDeepAnalyze}
              loading={deepLoading}
              initialData={builderInitialData}
            />
          )}
        </div>
      )}

      {/* Tab 1: Live Search Engine */}
      {activeTab === 'LIVE_SEARCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Account Lookup (PRD Section 10 & 11) */}
        <div className="space-y-4">
          <div className="card-surface p-6 bg-white dark:bg-[#12141A]">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                Account Lookup
              </h2>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
                  Platform
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform('INSTAGRAM')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      platform === 'INSTAGRAM'
                        ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold'
                        : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('TIKTOK')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      platform === 'TIKTOK'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                        : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>TikTok</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('YOUTUBE')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      platform === 'YOUTUBE'
                        ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-bold'
                        : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Youtube className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>YouTube</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('FACEBOOK')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      platform === 'FACEBOOK'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span>Facebook</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1.5">
                  Username atau Link Profil
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      platform === 'FACEBOOK'
                        ? 'e.g. jokowi, zuck, atau link facebook.com/...'
                        : platform === 'YOUTUBE'
                        ? 'e.g. @byoncombat, gadgetin, atau link youtube.com/@...'
                        : platform === 'TIKTOK'
                        ? 'e.g. callmebochu atau tempel link https://vt.tiktok.com/...'
                        : 'e.g. prabowo atau tempel link instagram.com/...'
                    }
                    className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Searching & Fetching Data...' : 'Search & Run Live Analysis'}
              </button>
            </form>

            {/* Share Link Resolution Panel */}
            <div className="mt-4 pt-3.5 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setPasteLinkOpen(!pasteLinkOpen)}
                className="w-full flex items-center justify-between text-left py-1 text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark hover:text-brand transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-brand" />
                  <span>Tempel Link Akun dari User yang Share (TikTok / IG / YouTube)</span>
                </div>
                {pasteLinkOpen ? (
                  <ChevronUp className="w-4 h-4 text-ink-tertiary-light dark:text-ink-tertiary-dark" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ink-tertiary-light dark:text-ink-tertiary-dark" />
                )}
              </button>

              {pasteLinkOpen && (
                <form onSubmit={handleResolveLink} className="mt-2.5 space-y-2.5 p-3 rounded-lg bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/5 dark:border-white/5 animate-in fade-in duration-150">
                  <p className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
                    Jika akun sulit ditemukan dengan username biasa, salin dan tempel link profil dari tombol <strong>"Bagikan Profil"</strong> di TikTok (misal: <code>https://vt.tiktok.com/...</code>) atau Instagram.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pasteLinkInput}
                      onChange={(e) => setPasteLinkInput(e.target.value)}
                      placeholder="https://vt.tiktok.com/... atau https://www.tiktok.com/@user"
                      className="flex-1 bg-white dark:bg-[#12141A] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark font-mono focus:ring-2 focus:ring-brand focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={linkResolving || !pasteLinkInput.trim()}
                      className="py-2 px-3.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {linkResolving ? 'Mengurai...' : 'Resolve & Analisis'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {searchError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-3">
                <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="space-y-1">
                    <span className="font-bold block text-sm">Akun Tidak Dapat Diakses / Tidak Ditemukan</span>
                    <span className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark block leading-relaxed">
                      {searchError.message}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-1.5">
                  <span className="text-[11px] font-semibold text-ink-primary-light dark:text-ink-primary-dark block">
                    Pemeriksaan & Solusi Alternatif (Agar Tidak Terlewat):
                  </span>
                  <ul className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark list-disc list-inside space-y-1">
                    <li>Pastikan username ditulis dengan benar tanpa spasi atau karakter tambahan.</li>
                    <li>Jika akun disetel privat, data postingan dilindungi oleh pengaturan privasi pengguna.</li>
                    <li>Anda dapat menempelkan link profil atau link video akun pada kotak tautan di atas.</li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-500/20">
                  {searchError.profileUrl && (
                    <a
                      href={searchError.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-mono"
                    >
                      <span>Buka Profil di {platform}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('MANUAL_OCR');
                      setManualUsernameInput(username.replace(/^@/, ''));
                      setManualPlatform(platform);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-all shadow-2xs ml-auto cursor-pointer"
                  >
                    <span>Gunakan Input Manual / OCR Screenshot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Candidate & Similar Accounts Section */}
          {candidates.length > 0 && (
            <div className="card-surface p-5 bg-white dark:bg-[#12141A] space-y-3.5 border border-black/10 dark:border-white/10 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand" />
                  <h3 className="text-xs font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark uppercase font-mono">
                    Akun Serupa & Hasil Terkait di {platform} ({candidates.length})
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Realtime Platform
                </span>
              </div>

              <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
                Ditemukan beberapa akun di {platform} yang relevan. Klik <strong>Pilih & Analisis</strong> untuk melihat rincian metrik ER secara instan:
              </p>

              <div className="divide-y divide-black/5 dark:divide-white/5 border border-black/5 dark:border-white/5 rounded-lg overflow-hidden">
                {candidates.map((cand) => (
                  <div
                    key={`${cand.platform}-${cand.username}`}
                    className="p-3 bg-surface-subtle-light/40 dark:bg-surface-subtle-dark/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-brand/10 border border-black/10 dark:border-white/10 shrink-0 flex items-center justify-center font-bold text-brand text-xs">
                        {cand.avatarUrl ? (
                          <img src={cand.avatarUrl} alt={cand.username} className="w-full h-full object-cover" />
                        ) : (
                          cand.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-ink-primary-light dark:text-ink-primary-dark truncate">
                            {cand.displayName}
                          </span>
                          {cand.verified && (
                            <CheckCircle2 className="w-3 h-3 text-cyan-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-ink-secondary-light dark:text-ink-secondary-dark font-mono block truncate">
                          @{cand.username} • {cand.followers.toLocaleString()} followers
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSearch(undefined, cand.username, cand.platform)}
                      disabled={loading}
                      className="py-1.5 px-3 bg-brand/10 hover:bg-brand text-brand hover:text-white border border-brand/20 rounded-md text-xs font-semibold transition-all shrink-0 flex items-center gap-1 disabled:opacity-50"
                    >
                      <span>Pilih & Analisis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Result Card */}
          {searchResult && (
            <div className="card-surface p-6 bg-white dark:bg-[#12141A] space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-brand/10 border border-black/10 dark:border-white/10 shrink-0 flex items-center justify-center font-bold text-brand">
                    {searchResult.avatarUrl ? (
                      <img src={searchResult.avatarUrl} alt={searchResult.username} className="w-full h-full object-cover" />
                    ) : (
                      searchResult.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
                      {searchResult.displayName || `@${searchResult.username}`}
                    </h3>
                    <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark font-mono">
                      @{searchResult.username} • {searchResult.platform}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5">
                        <MapPin className="w-3 h-3 text-brand" />
                        <span>{searchResult.city || 'Nasional'}</span>
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-brand/10 text-brand">
                        {searchResult.roleOrTitle || 'Jubir'}
                      </span>
                      {searchResult.joinedText && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shadow-xs">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span>{searchResult.joinedText}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Source & Privacy Status Badges */}
                <div className="flex flex-col items-end gap-1.5">
                  {Boolean(
                    searchResult.isPrivate ||
                    searchResult.accountType === 'Private Account' ||
                    searchResult.accountType?.toLowerCase().includes('private')
                  ) ? (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold">
                      <Lock className="w-3 h-3 text-amber-500" />
                      AKUN PRIVAT
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-bold">
                      <Globe className="w-3 h-3 text-emerald-500" />
                      AKUN PUBLIK
                    </span>
                  )}

                  {accountSource === 'API' || accountSource === 'SCRAPED' || accountSource === 'LIVE_ONLINE' ? (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                      <Globe className="w-2.5 h-2.5" />
                      LIVE ONLINE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-semibold">
                      <Database className="w-2.5 h-2.5" />
                      DATABASE
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 py-3 border-y border-black/5 dark:border-white/5 text-center text-xs">
                <div>
                  <span className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark block">Followers</span>
                  <span className="font-mono font-bold text-sm">
                    {searchResult.snapshots?.[0]?.followers?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark block">Following</span>
                  <span className="font-mono font-bold text-sm">
                    {searchResult.snapshots?.[0]?.following?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark block">Total Posts</span>
                  <span className="font-mono font-bold text-sm">
                    {searchResult.snapshots?.[0]?.postsCount?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark block">Posts Analyzed</span>
                  <span className={`font-mono font-bold text-sm ${
                    Boolean(
                      searchResult.isPrivate ||
                      searchResult.accountType === 'Private Account' ||
                      searchResult.accountType?.toLowerCase().includes('private')
                    )
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Boolean(
                      searchResult.isPrivate ||
                      searchResult.accountType === 'Private Account' ||
                      searchResult.accountType?.toLowerCase().includes('private')
                    )
                      ? '0 (Privat)'
                      : (searchResult.analyses?.[0]?.sampleSize || searchResult.posts?.length || 0)}
                  </span>
                </div>
              </div>

              {/* Verification & Completeness Check Banner */}
              {(() => {
                const totalP = searchResult.snapshots?.[0]?.postsCount || 0;
                const analyzedP = searchResult.analyses?.[0]?.sampleSize || searchResult.posts?.length || 0;
                const isPrivate = Boolean(
                  searchResult.isPrivate ||
                  searchResult.accountType === 'Private Account' ||
                  searchResult.accountType?.toLowerCase().includes('private')
                );

                if (isPrivate) {
                  return (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                          <Lock className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>Akun Privat Terdeteksi — Konten Dilindungi</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20">
                          Privat
                        </span>
                      </div>
                      
                      <p className="text-ink-secondary-light dark:text-ink-secondary-dark text-[11px] leading-relaxed">
                        Akun <strong>@{searchResult.username}</strong> ({searchResult.platform}) mengaktifkan setelan privat. Postingan dan metrik video tidak dapat dibaca oleh publik tanpa izin akun. Sistem tidak membuat data dummy/tiruan demi menjaga validitas data.
                      </p>
                    </div>
                  );
                }

                if (analyzedP < totalP) {
                  return (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>Kelengkapan Data Postingan</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20">
                          {analyzedP} / {totalP} Post
                        </span>
                      </div>
                      
                      <p className="text-ink-secondary-light dark:text-ink-secondary-dark text-[11px] leading-relaxed">
                        Terdeteksi <strong>{analyzedP} postingan publik</strong> berhasil diakses dan dianalisis secara riil dari total <strong>{totalP} postingan</strong> di profil.
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-500/15">
                        <button
                          type="button"
                          onClick={() => onSelectAccount(searchResult.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white font-semibold text-xs shadow-2xs hover:bg-brand-hover transition-all cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Filter Tanggal, Bulan & Tahun di Halaman Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                if (analyzedP >= totalP && totalP > 0) {
                  return (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          <strong>100% Terverifikasi Akurat</strong>: Seluruh {analyzedP} postingan berhasil dibaca dan dianalisis secara realtime.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectAccount(searchResult.id)}
                        className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Filter Berdasarkan Tanggal / Tahun</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Calculated ER Card / Deep Analysis if available */}
              {searchResult.deepAnalysis ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-brand/10 via-brand/5 to-transparent border border-brand/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{language === 'id' ? 'Hasil Analisis Realtime' : 'Live Deep Analysis'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand/10 text-brand border border-brand/20 font-semibold">
                      {searchResult.deepAnalysis.sampleSize} posts analyzed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-brand/15">
                      <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                        Golden Metric: Median ER
                      </span>
                      <span className="text-3xl font-black font-display text-ink-primary-light dark:text-ink-primary-dark tabular-nums">
                        {searchResult.deepAnalysis.medianER}%
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        Tahan Outlier & Bias
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5">
                      <span className="text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                        Rata-Rata Biasa (Mean)
                      </span>
                      <span className="text-3xl font-black font-display text-ink-secondary-light dark:text-ink-secondary-dark tabular-nums">
                        {searchResult.deepAnalysis.averageER}%
                      </span>
                      <span className="text-[10px] text-ink-tertiary-light block mt-0.5">
                        {searchResult.deepAnalysis.averageER > searchResult.deepAnalysis.medianER ? 'Terdongkrak Post Viral' : 'Konsisten'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                      <span className="text-[10px] text-ink-tertiary-light block">Floor (Min)</span>
                      <span className="font-bold text-rose-500">{searchResult.deepAnalysis.minER}%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                      <span className="text-[10px] text-ink-tertiary-light block">Ceiling (Max)</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{searchResult.deepAnalysis.maxER}%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                      <span className="text-[10px] text-ink-tertiary-light block">Konsistensi</span>
                      <span className="font-bold text-brand">{searchResult.deepAnalysis.consistencyScore}%</span>
                    </div>
                  </div>

                  {/* Actions to inspect and transfer to editor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-brand/10">
                    <button
                      type="button"
                      onClick={() => handleOpenFullDeepAnalysis(searchResult)}
                      className="py-2.5 px-3 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Lihat Analisis Penuh</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTransferToEditor(searchResult)}
                      className="py-2.5 px-3 bg-white dark:bg-[#1A1E2B] text-brand border border-brand/30 hover:bg-brand/5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sesuaikan di Editor</span>
                    </button>
                  </div>
                </div>
              ) : searchResult.analyses && searchResult.analyses[0] ? (
                <div className="space-y-3">
                  <ErHeroCard
                    engagementRate={searchResult.analyses[0].engagementRate}
                    formulaType={searchResult.analyses[0].formulaType}
                    sampleSize={searchResult.analyses[0].sampleSize}
                    averageLikes={searchResult.analyses[0].averageLikes}
                    averageComments={searchResult.analyses[0].averageComments}
                    averageViews={searchResult.analyses[0].averageViews}
                    followers={searchResult.snapshots?.[0]?.followers}
                    source={searchResult.analyses[0].source}
                    analyzedAt={searchResult.analyses[0].analyzedAt}
                  />

                  {searchResult.posts && searchResult.posts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTransferToEditor(searchResult)}
                      className="w-full py-2.5 px-3 bg-brand/10 text-brand hover:bg-brand hover:text-white border border-brand/20 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sesuaikan & Periksa {searchResult.posts.length} Postingan di Editor</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-3">
                  <div className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 inline-block ring-2 ring-amber-500/30" />
                    <span>
                      {searchResult.isPrivate || searchResult.accountType?.includes('Private')
                        ? '🔒 Akun Private Terdeteksi'
                        : searchResult.accountType?.includes('Restricted')
                        ? '🔞 Akun Dibatasi Usia (18+) / Terproteksi'
                        : 'Profil Terdeteksi (Media Publik Terproteksi)'}
                    </span>
                  </div>
                  <p className="text-ink-secondary-light dark:text-ink-secondary-dark text-xs leading-relaxed">
                    Akun ini nyata dan aktif di <strong className="font-semibold text-ink-primary-light dark:text-ink-primary-dark">{searchResult.platform}</strong> dengan <strong className="font-semibold text-ink-primary-light dark:text-ink-primary-dark">{searchResult.snapshots?.[0]?.followers?.toLocaleString() || 0} pengikut</strong>. Namun, karena akun ini berstatus privat atau dibatasi umur 18+, platform membatasi akses postingan untuk pengunjung anonim tanpa autentikasi login/follow.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const f = searchResult.snapshots?.[0]?.followers || 0;
                      if (f > 0) setManualFollowers(String(f));
                      const fol = searchResult.snapshots?.[0]?.following || 0;
                      if (fol > 0) setManualFollowing(String(fol));
                      setManualFormula(searchResult.platform === 'TIKTOK' ? 'VIEW_BASED' : 'FOLLOWER_BASED');
                      const el = document.getElementById('manual-calculator-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Hitung ER Akun Ini di Kalkulator Realtime</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Post Level Content Niche Breakdown & Post Inspector */}
              {searchResult.posts && searchResult.posts.length > 0 && (
                <div className="pt-2">
                  <PostContentNicheSection
                    posts={searchResult.posts}
                    platform={searchResult.platform}
                    followers={searchResult.snapshots?.[0]?.followers}
                    primaryNiche={searchResult.primaryNiche}
                    nicheBreakdown={searchResult.nicheBreakdown}
                  />
                </div>
              )}

              {/* Export Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <a
                  href={api.getAccountPdfUrl(searchResult.id)}
                  download={`Laporan_Audit_ER_${searchResult.platform}_${searchResult.username.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                  className="py-2.5 px-3 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
                  title="Cetak Laporan Audit ER Akun ini ke Format PDF (A4 Executive)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.exportPdf}</span>
                </a>

                <a
                  href={api.getAccountsExcelUrl({ accountId: searchResult.id })}
                  download={`Laporan_ER_${searchResult.platform}_${searchResult.username.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`}
                  className="py-2.5 px-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
                  title={t.exportExcel}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t.exportExcel}</span>
                </a>
              </div>

              {searchResult.posts && searchResult.posts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAiHub(!showAiHub)}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-hover hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{showAiHub ? 'Tutup AI Content Intelligence' : 'Buka AI Content Intelligence & Prediksi Viral'}</span>
                </button>
              )}

              {showAiHub && searchResult.id && (
                <div className="pt-4 border-t border-black/5 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
                  <AiIntelligenceHub
                    accountId={searchResult.id}
                    username={searchResult.username}
                    platform={searchResult.platform}
                    followers={searchResult.snapshots?.[0]?.followers}
                  />
                </div>
              )}

              <button
                onClick={() => onSelectAccount(searchResult.id)}
                className="w-full py-2 bg-surface-subtle-light dark:bg-surface-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{t.viewDetail}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Realtime Jubir & Metrics Calculation Mode */}
        <div id="manual-calculator-section" className="card-surface p-6 bg-white dark:bg-[#12141A] space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                Kalkulasi Realtime Jubir & Peringkat
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand/10 text-brand font-semibold">
              Live Formula
            </span>
          </div>

          <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
            Kalkulasi performa interaksi (Engagement Rate) secara realtime berdasarkan followers, following, views Reels/VT, likes, dan komen, lalu masukkan langsung ke peringkat jubir wilayah.
          </p>

          <form onSubmit={handleManualCalculate} className="space-y-3.5">
            {/* Target Account & Platform */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Platform
                </label>
                <select
                  value={manualPlatform}
                  onChange={(e) => {
                    const p = e.target.value as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
                    setManualPlatform(p);
                    setManualFormula(p === 'INSTAGRAM' ? 'FOLLOWER_BASED' : 'VIEW_BASED');
                  }}
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark font-mono focus:ring-2 focus:ring-brand focus:outline-hidden"
                >
                  <option value="INSTAGRAM">Instagram (Reels / Feed)</option>
                  <option value="TIKTOK">TikTok (VT / Video)</option>
                  <option value="YOUTUBE">YouTube (Video / Shorts / Live)</option>
                  <option value="FACEBOOK">Facebook (Post / Video / Reels)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Username Akun
                </label>
                <input
                  type="text"
                  value={manualUsernameInput}
                  onChange={(e) => setManualUsernameInput(e.target.value)}
                  placeholder="e.g. ihsanawawi__"
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Wilayah & Jabatan Jubir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    <span>Kota / Daerah Jubir</span>
                  </span>
                </label>
                <input
                  type="text"
                  list="calc-cities"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="Contoh: Jakarta, Surabaya, Bandung..."
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
                />
                <datalist id="calc-cities">
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
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Peran / Jabatan Jubir
                </label>
                <input
                  type="text"
                  list="calc-roles"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  placeholder="Contoh: Jubir Utama, Jubir Muda..."
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
                />
                <datalist id="calc-roles">
                  <option value="Jubir Utama" />
                  <option value="Jubir Daerah" />
                  <option value="Jubir Komunikasi" />
                  <option value="Jubir Muda" />
                </datalist>
              </div>
            </div>

            {/* Formula Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                Model Formula ER Utama
              </label>
              <select
                value={manualFormula}
                onChange={(e) => setManualFormula(e.target.value as any)}
                className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark font-mono focus:ring-2 focus:ring-brand focus:outline-hidden"
              >
                <option value="FOLLOWER_BASED">ER Berdasarkan Followers — Standar Instagram: ((Likes + Komen) / Followers) × 100</option>
                <option value="VIEW_BASED">ER Berdasarkan Views — Standar TikTok & Reels: ((Likes + Komen + Shares) / Views) × 100</option>
              </select>
            </div>

            {/* Metrics Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Followers
                </label>
                <input
                  type="number"
                  value={manualFollowers}
                  onChange={(e) => setManualFollowers(e.target.value)}
                  placeholder="Contoh: 1171"
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Following
                </label>
                <input
                  type="number"
                  value={manualFollowing}
                  onChange={(e) => setManualFollowing(e.target.value)}
                  placeholder="Contoh: 222"
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Views Reels / VT
                </label>
                <input
                  type="number"
                  value={manualViews}
                  onChange={(e) => setManualViews(e.target.value)}
                  placeholder="Contoh: 84121"
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Rata-Rata Likes
                </label>
                <input
                  type="number"
                  value={manualLikes}
                  onChange={(e) => setManualLikes(e.target.value)}
                  placeholder="Contoh: 11124"
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-pink-600 dark:text-pink-400 font-bold focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Rata-Rata Komen
                </label>
                <input
                  type="number"
                  value={manualComments}
                  onChange={(e) => setManualComments(e.target.value)}
                  placeholder="Contoh: 69"
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                  Shares (Opsional)
                </label>
                <input
                  type="number"
                  value={manualShares}
                  onChange={(e) => setManualShares(e.target.value)}
                  placeholder="Contoh: 744"
                  className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-surface-subtle-light dark:bg-surface-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-ink-primary-light dark:text-ink-primary-dark text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5 text-brand" />
                <span>Kalkulasi Realtime</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToLeaderboard}
                disabled={savingToLeaderboard}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingToLeaderboard ? (
                  <span>Menyimpan ke Peringkat...</span>
                ) : (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Simpan & Masukkan ke Peringkat</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Success Notification Banner */}
          {savedLeaderboardMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{savedLeaderboardMsg}</span>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('leaderboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Buka Peringkat Jubir (Leaderboard)</span>
                </button>
              )}
            </div>
          )}

          {/* Realtime Output Card */}
          {manualResult && (
            <div className="mt-4 p-4 rounded-xl border border-brand/20 bg-brand/5 dark:bg-brand/10 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-brand/10">
                <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark uppercase font-semibold">
                  Hasil Kalkulasi Realtime
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand text-white">
                  {manualResult.tier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/60 dark:bg-black/20 border border-brand/10">
                  <span className="text-[10px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark block uppercase">
                    ER by Followers (Instagram)
                  </span>
                  <span className="text-2xl font-black font-display tabular-nums text-pink-600 dark:text-pink-400">
                    {manualResult.erFollowers}%
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white/60 dark:bg-black/20 border border-brand/10">
                  <span className="text-[10px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark block uppercase">
                    ER by Views (TikTok / Reels)
                  </span>
                  <span className="text-2xl font-black font-display tabular-nums text-cyan-600 dark:text-cyan-400">
                    {manualResult.erViews}%
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs font-mono text-ink-secondary-light dark:text-ink-secondary-dark border-t border-brand/10 space-y-1">
                <p className="font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                  Formula Terpilih ({manualResult.formulaType}):
                </p>
                <p>{manualResult.explanation}</p>
                <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark pt-1">
                  Wilayah: <strong>{manualCity}</strong> • Peran: <strong>{manualRole}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
