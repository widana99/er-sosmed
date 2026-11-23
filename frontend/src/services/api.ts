export interface SocialPost {
  id: string;
  accountId: string;
  postUrl?: string;
  caption?: string;
  postedAt: string;
  likes: number;
  comments: number;
  views?: number | null;
  shares?: number | null;
  saves?: number | null;
  reach?: number | null;
  contentType?: 'LONG_VIDEO' | 'SHORTS' | 'LIVE' | string;
  contentNiche?: string;
  postEr?: number;
  source: string;
}

export interface AccountSnapshot {
  id: string;
  followers: number;
  following: number;
  postsCount: number;
  capturedAt: string;
  source: string;
}

export interface AnalysisRun {
  id: string;
  accountId: string;
  formulaType: 'FOLLOWER_BASED' | 'VIEW_BASED' | 'REACH_BASED';
  sampleSize: number;
  averageLikes: number;
  averageComments: number;
  averageViews: number | null;
  averageShares: number | null;
  engagementRate: number;
  source: string;
  analyzedAt: string;
  account?: {
    username: string;
    platform: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface RateCardDeliverable {
  key: 'STORY' | 'FEED_POST' | 'VIDEO';
  label: string;
  description: string;
  priceLow: number;
  priceMid: number;
  priceHigh: number;
  formattedRange: string;
  formattedMid: string;
}

export interface RateCardResult {
  tier: 'NANO' | 'MICRO' | 'MID' | 'MACRO' | 'MEGA';
  tierLabel: string;
  qualityMultiplier: number;
  erAssessment: 'LOW' | 'AVERAGE' | 'HIGH' | 'EXCELLENT';
  assessmentNote: string;
  deliverables: RateCardDeliverable[];
  currency: string;
}

export interface QuartilesResult {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
}

export interface DistributionResult {
  viralCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  viralPct: number;
  highPct: number;
  moderatePct: number;
  lowPct: number;
}

export interface RankedPostItem {
  index: number;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  caption?: string;
  postedAt?: string;
  postER: number;
  tier: 'VIRAL' | 'HIGH' | 'MODERATE' | 'LOW';
  contentType?: 'LONG_VIDEO' | 'SHORTS' | 'LIVE' | string;
  postUrl?: string;
  contentNiche?: string;
}

export interface ComprehensiveAnalysisResult {
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  username?: string;
  followers: number;
  formulaType: 'FOLLOWER_BASED' | 'VIEW_BASED';
  sampleSize: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  totalShares: number;
  averageLikes: number;
  averageComments: number;
  averageViews: number;
  averageER: number;
  medianLikes: number;
  medianComments: number;
  medianViews: number;
  medianER: number;
  minER: number;
  maxER: number;
  spreadRange: number;
  quartiles: QuartilesResult;
  distribution: DistributionResult;
  consistencyScore: number;
  commentToLikeRatio: number;
  botRisk: 'LOW' | 'MODERATE' | 'HIGH';
  botRiskReason?: string;
  rateCardValuation: { minIdr: number; maxIdr: number; formatted: string };
  contentBreakdown?: {
    totalVideos: number;
    totalShorts: number;
    totalLive: number;
  };
  filterMeta?: {
    applied: boolean;
    contentType?: string;
    filterYear?: string;
    filterMonth?: string;
    startDate?: string;
    endDate?: string;
    filteredPostsCount: number;
    totalPostsCount: number;
    availableYears?: string[];
    availableMonths?: string[];
    message?: string;
  };
  postsRanked: RankedPostItem[];
}

export interface SocialAccount {
  id: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  accountType?: string;
  city?: string;
  roleOrTitle?: string;
  joinedText?: string;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
  snapshots?: AccountSnapshot[];
  posts?: SocialPost[];
  analyses?: AnalysisRun[];
  _count?: { posts: number };
  rateCard?: RateCardResult;
  deepAnalysis?: ComprehensiveAnalysisResult;
  primaryNiche?: string;
  nicheBreakdown?: Array<{
    niche: string;
    count: number;
    percentage: number;
    averageER?: number;
  }>;
}

export interface LeaderboardItem {
  id: string;
  rank: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl?: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  accountType?: string;
  city: string;
  roleOrTitle: string;
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: number;
  formulaType: string;
  averageLikes: number;
  averageComments: number;
  averageViews: number;
  averageShares: number;
  sampleSize: number;
  tier: string;
  analyzedAt: string;
}

export interface LeaderboardStats {
  totalJubir: number;
  totalReach: number;
  totalViews: number;
  averageEr: number;
  filterCity: string;
  filterPlatform: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardItem[];
  stats: LeaderboardStats;
  availableCities: string[];
}

export interface DashboardKPI {
  totalAccounts: number;
  instagramCount: number;
  tiktokCount: number;
  youtubeCount?: number;
  facebookCount?: number;
  totalAnalyses: number;
  averageER: number;
  recentAnalyses: AnalysisRun[];
}

export interface ComparisonItem {
  id: string;
  username: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  displayName?: string;
  avatarUrl?: string;
  followers: number;
  sampleSize: number;
  averageLikes: number;
  averageComments: number;
  averageViews: number;
  engagementRate: number;
  formulaType: string;
  source: string;
}

export interface AccountCandidate {
  username: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  following?: number;
  verified?: boolean;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  profileUrl: string;
  isExactMatch?: boolean;
  source: 'LIVE_ONLINE' | 'DATABASE' | 'SUGGESTION';
}

export interface SearchAccountResponse {
  account: SocialAccount | null;
  candidates?: AccountCandidate[];
  source?: string;
  isSimulated?: boolean;
  isNotFound?: boolean;
  message?: string;
  profileUrl?: string;
  canPasteLink?: boolean;
  resolvedLink?: {
    originalUrl: string;
    resolvedUrl?: string;
  } | null;
  deepAnalysis?: ComprehensiveAnalysisResult;
}

export interface BatchTargetItem {
  username: string;
  platform?: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK';
  city?: string;
  roleOrTitle?: string;
}

export interface BatchAccountItemResult {
  input: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  platform?: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK';
  city?: string;
  roleOrTitle?: string;
  status: 'SUCCESS' | 'RESTRICTED' | 'NOT_FOUND' | 'ERROR';
  source?: string;
  account?: SocialAccount;
  deepAnalysis?: ComprehensiveAnalysisResult;
  verification?: {
    isComplete: boolean;
    isRestricted: boolean;
    totalPosts: number;
    analyzedPosts: number;
    coveragePercent: number;
  };
  error?: string;
}

export interface BatchAnalyzeResponse {
  total: number;
  successCount: number;
  failedCount: number;
  results: BatchAccountItemResult[];
}

const API_BASE = '/api';

export const api = {
  async getDashboardKPI(): Promise<DashboardKPI> {
    const res = await fetch(`${API_BASE}/analytics/kpi`);
    if (!res.ok) throw new Error('Failed to fetch KPI');
    return res.json();
  },

  async searchAccount(platform: string, username: string): Promise<SearchAccountResponse> {
    const res = await fetch(`${API_BASE}/accounts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, username }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Search failed' }));
      throw new Error(err.error || 'Search failed');
    }
    return res.json();
  },

  async resolveAccountLink(link: string): Promise<SearchAccountResponse> {
    const res = await fetch(`${API_BASE}/accounts/resolve-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengurai tautan' }));
      throw new Error(err.error || 'Gagal mengurai tautan akun');
    }
    return res.json();
  },

  async listAccounts(platform?: string): Promise<SocialAccount[]> {
    const url = platform ? `${API_BASE}/accounts?platform=${platform}` : `${API_BASE}/accounts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to list accounts');
    return res.json();
  },

  async getAccountDetail(
    id: string,
    filters?: {
      year?: string;
      month?: string;
      startDate?: string;
      endDate?: string;
      contentType?: string;
    }
  ): Promise<SocialAccount> {
    let url = `${API_BASE}/accounts/${id}`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== 'ALL') params.set('year', filters.year);
      if (filters.month && filters.month !== 'ALL') params.set('month', filters.month);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.contentType && filters.contentType !== 'ALL') params.set('contentType', filters.contentType);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to get account detail');
    return res.json();
  },

  async getLeaderboard(params?: {
    city?: string;
    platform?: string;
    sortBy?: string;
  }): Promise<LeaderboardResponse> {
    const searchParams = new URLSearchParams();
    if (params?.city && params.city !== 'ALL') searchParams.set('city', params.city);
    if (params?.platform && params.platform !== 'ALL') searchParams.set('platform', params.platform);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);

    const query = searchParams.toString();
    const url = query ? `${API_BASE}/leaderboard?${query}` : `${API_BASE}/leaderboard`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  async updateJubir(id: string, data: { city?: string; roleOrTitle?: string }): Promise<SocialAccount> {
    const res = await fetch(`${API_BASE}/accounts/${id}/jubir`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update jubir profile' }));
      throw new Error(err.error || 'Failed to update jubir profile');
    }
    return res.json();
  },

  async calculateAndSave(data: {
    accountId: string;
    formulaType?: string;
    postLimit?: number;
    manualFollowers?: number;
    manualLikes?: number;
    manualComments?: number;
    manualViews?: number;
    manualShares?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/analysis/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Calculation failed' }));
      throw new Error(err.error || 'Calculation failed');
    }
    return res.json();
  },

  async getAllAnalyses(): Promise<AnalysisRun[]> {
    const res = await fetch(`${API_BASE}/analytics/history`);
    if (!res.ok) throw new Error('Failed to get analyses history');
    return res.json();
  },

  async compareAccounts(accountIds: string[]): Promise<{ comparison: ComparisonItem[] }> {
    const res = await fetch(`${API_BASE}/comparison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountIds }),
    });
    if (!res.ok) throw new Error('Failed to compare accounts');
    return res.json();
  },

  async previewCsv(csvData: string): Promise<any> {
    const res = await fetch(`${API_BASE}/csv/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData }),
    });
    if (!res.ok) throw new Error('Failed to preview CSV');
    return res.json();
  },

  async importCsv(csvData: string): Promise<any> {
    const res = await fetch(`${API_BASE}/csv/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(err.error || 'Import failed');
    }
    return res.json();
  },

  getAccountPdfUrl(accountId: string): string {
    return `${API_BASE}/export/account/${accountId}/pdf`;
  },

  getAccountsExcelUrl(params?: {
    platform?: string;
    city?: string;
    sortBy?: string;
    accountId?: string;
    accountIds?: string[];
    groupId?: string;
    periodMode?: string;
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  }): string {
    const query = new URLSearchParams();
    if (params?.platform && params.platform !== 'ALL') query.append('platform', params.platform);
    if (params?.city && params.city !== 'ALL') query.append('city', params.city);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.accountId) query.append('accountId', params.accountId);
    if (params?.accountIds && params.accountIds.length > 0) query.append('accountIds', params.accountIds.join(','));
    if (params?.groupId) query.append('groupId', params.groupId);
    if (params?.periodMode && params.periodMode !== 'ALL') query.append('periodMode', params.periodMode);
    if (params?.year) query.append('year', String(params.year));
    if (params?.month !== undefined) query.append('month', String(params.month));
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return `${API_BASE}/export/accounts/excel${qs ? `?${qs}` : ''}`;
  },

  downloadAccountPdf(accountId: string): void {
    const url = this.getAccountPdfUrl(accountId);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 2000);
  },

  downloadAccountsExcel(params?: {
    platform?: string;
    city?: string;
    sortBy?: string;
    accountId?: string;
    accountIds?: string[];
    groupId?: string;
    periodMode?: string;
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  }): void {
    const url = this.getAccountsExcelUrl(params);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 2000);
  },

  async exportBatchExcel(payload: {
    accountIds?: string[];
    groupId?: string;
    platform?: string;
    city?: string;
    sortBy?: string;
    periodConfig?: {
      mode: string;
      year?: number;
      month?: number;
      customStartDate?: string;
      customEndDate?: string;
    };
    groupName?: string;
  }): Promise<void> {
    const res = await fetch(`${API_BASE}/export/batch-excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengekspor file Excel batch.' }));
      throw new Error(err.error || 'Gagal mengekspor file Excel batch.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (payload.groupName || 'Batch_Scraper').replace(/[^a-zA-Z0-9_-]/g, '_');
    const periodLabel = payload.periodConfig?.mode || 'All';
    link.setAttribute('download', `Laporan_ER_${safeName}_${periodLabel}_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);
  },

  async calculateDeepAnalysis(payload: {
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
    username?: string;
    followers: number;
    posts: Array<{
      likes: number;
      comments: number;
      views?: number;
      shares?: number;
      caption?: string;
    }>;
    accountId?: string;
  }): Promise<ComprehensiveAnalysisResult> {
    const res = await fetch(`${API_BASE}/analysis/calculate-deep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Kalkulasi mendalam gagal' }));
      throw new Error(err.error || 'Gagal menghitung analisis mendalam.');
    }
    return res.json();
  },

  async batchAnalyze(payload: {
    platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK' | 'AUTO';
    targets: Array<string | BatchTargetItem>;
    forceRefresh?: boolean;
  }): Promise<BatchAnalyzeResponse> {
    const res = await fetch(`${API_BASE}/accounts/batch-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal memproses batch scraper' }));
      throw new Error(err.error || 'Gagal memproses batch scraper.');
    }
    return res.json();
  },

  async extractLinksFromFile(fileBase64: string, fileName?: string): Promise<{
    success: boolean;
    fileName: string;
    count: number;
    links: string[];
    detectedPlatforms: {
      tiktok: number;
      instagram: number;
      youtube: number;
      facebook: number;
    };
  }> {
    const res = await fetch(`${API_BASE}/accounts/extract-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64, fileName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengekstrak link dari file Excel' }));
      throw new Error(err.error || 'Gagal mengekstrak link dari file Excel.');
    }
    return res.json();
  },

  // ─── Deletion APIs (Accidental Data Loss Prevention) ───

  async deleteAccount(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal menghapus akun.' }));
      throw new Error(err.error || 'Gagal menghapus akun.');
    }
    return res.json();
  },

  async deleteAnalysisRun(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/analytics/runs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal menghapus riwayat analisis.' }));
      throw new Error(err.error || 'Gagal menghapus riwayat analisis.');
    }
    return res.json();
  },

  async clearAnalysisHistory(platform?: string): Promise<{ success: boolean; message: string; count: number }> {
    const qs = platform && platform !== 'ALL' ? `?platform=${encodeURIComponent(platform)}` : '';
    const res = await fetch(`${API_BASE}/analytics/history${qs}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal membersihkan riwayat analisis.' }));
      throw new Error(err.error || 'Gagal membersihkan riwayat analisis.');
    }
    return res.json();
  },

  // ─── Batch Groups & Categories APIs ───

  async getGroupCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/groups/categories`);
    if (!res.ok) return ['Politik & Pemerintahan', 'KOL & Kreator', 'Bisnis & Brand', 'Edukasi & Riset', 'Kuliner & Lifestyle', 'Hiburan & Media', 'Umum'];
    return res.json();
  },

  async getBatchGroups(params?: { category?: string; search?: string; platform?: string }): Promise<BatchGroup[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'ALL' && params.category !== 'Semua Kategori') {
      query.append('category', params.category);
    }
    if (params?.platform && params.platform !== 'ALL') {
      query.append('platform', params.platform);
    }
    if (params?.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/groups${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Gagal mengambil daftar riwayat grup batch.');
    return res.json();
  },

  async getBatchGroupDetail(id: string): Promise<BatchGroup> {
    const res = await fetch(`${API_BASE}/groups/${id}`);
    if (!res.ok) throw new Error('Gagal mengambil rincian grup.');
    return res.json();
  },

  async createBatchGroup(payload: {
    name?: string;
    category?: string;
    platform?: string;
    items: any[];
    metadata?: any;
  }): Promise<BatchGroup> {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal menyimpan grup batch.' }));
      throw new Error(err.error || 'Gagal menyimpan grup batch.');
    }
    return res.json();
  },

  async deleteBatchGroup(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal menghapus grup batch.' }));
      throw new Error(err.error || 'Gagal menghapus grup batch.');
    }
    return res.json();
  },

  // ─── Group Export URLs & Triggers ───

  getGroupExcelUrl(groupId: string, params?: {
    periodMode?: string;
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  }): string {
    const query = new URLSearchParams();
    if (params?.periodMode && params.periodMode !== 'ALL') query.append('periodMode', params.periodMode);
    if (params?.year) query.append('year', String(params.year));
    if (params?.month !== undefined) query.append('month', String(params.month));
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return `${API_BASE}/export/group/${groupId}/excel${qs ? `?${qs}` : ''}`;
  },

  getGroupPdfUrl(groupId: string): string {
    return `${API_BASE}/export/group/${groupId}/pdf`;
  },

  downloadGroupExcel(groupId: string, groupName?: string, params?: {
    periodMode?: string;
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  }): void {
    const url = this.getGroupExcelUrl(groupId, params);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (groupName || 'Grup').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Laporan_Grup_ER_${safeName}.xlsx`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 2000);
  },

  downloadGroupPdf(groupId: string, groupName?: string): void {
    const url = this.getGroupPdfUrl(groupId);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (groupName || 'Grup').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Laporan_Audit_Grup_ER_${safeName}.pdf`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 2000);
  },

  // ─── AI Content Analysis & Viral Prediction APIs ───

  async getAccountAiIntelligence(accountId: string): Promise<AiIntelligenceResponse> {
    const res = await fetch(`${API_BASE}/ai/account/${accountId}/intelligence`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengambil analisis AI.' }));
      throw new Error(err.error || 'Gagal memproses analisis AI konten.');
    }
    return res.json();
  },

  async simulateDraftPost(payload: DraftSimulationPayload): Promise<DraftSimulationResult> {
    const res = await fetch(`${API_BASE}/ai/simulate-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal melakukan simulasi draf.' }));
      throw new Error(err.error || 'Gagal melakukan simulasi draf postingan.');
    }
    const data = await res.json();
    return data.data;
  },

  async getAccountTrends(accountId: string): Promise<AccountTrendsData> {
    const res = await fetch(`${API_BASE}/ai/account/${accountId}/trends`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengambil data tren akun.' }));
      throw new Error(err.error || 'Gagal mengambil analisis tren multi-tahun.');
    }
    const json = await res.json();
    return json.data;
  },
};

export interface BatchGroupItem {
  id: string;
  groupId: string;
  accountId?: string | null;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  platform: 'INSTAGRAM' | 'TIKTOK';
  status: 'SUCCESS' | 'RESTRICTED' | 'NOT_FOUND' | 'ERROR';
  followers: number;
  following: number;
  postsCount: number;
  analyzedPosts: number;
  averageLikes: number;
  averageComments: number;
  averageViews: number;
  averageShares: number;
  engagementRate: number;
  city?: string | null;
  roleOrTitle?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface BatchGroup {
  id: string;
  name: string;
  category: string;
  platform: string;
  totalAccounts: number;
  successfulAccounts: number;
  failedAccounts: number;
  averageER: number;
  totalFollowers: number;
  status: string;
  metadata?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
  items?: BatchGroupItem[];
}

// ─── AI Intelligence & Viral Prediction Interfaces ───

export interface AiTopicInsight {
  topic: string;
  count: number;
  percentage: number;
  averageER: number;
  averageViews: number;
  averageLikes: number;
}

export interface AiKeywordInsight {
  keyword: string;
  impactScore: number;
}

export interface AiHashtagInsight {
  hashtag: string;
  count: number;
  averageER: number;
  averageViews: number;
}

export interface AiTimingInsight {
  hour?: string;
  day?: string;
  count: number;
  averageER: number;
  averageViews: number;
}

export interface AiCaptionInsight {
  category: string;
  count: number;
  averageER: number;
  averageViews: number;
}

export interface AiHookInsight {
  hookType: string;
  count: number;
  averageER: number;
}

export interface AiContentIntelligence {
  totalPostsAnalyzed: number;
  topics: AiTopicInsight[];
  topKeywords: AiKeywordInsight[];
  topHashtags: AiHashtagInsight[];
  bestPostingHours: AiTimingInsight[];
  bestPostingDays: AiTimingInsight[];
  captionLengthInsights: AiCaptionInsight[];
  hookEffectiveness: AiHookInsight[];
}

export interface AiViralRankedPost {
  postId: string;
  caption: string;
  postedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  postER: number;
  viralScore: number;
  viralTier: 'VIRAL_BREAKOUT' | 'HIGH_POTENTIAL' | 'HEALTHY_CONSISTENT' | 'BELOW_BASELINE' | string;
  viralTierLabel: string;
  viralTierBadge: string;
  scoreBreakdown: {
    relativeVelocityScore: number;
    reachMultiplierScore: number;
    shareRetentionScore: number;
    hookScore: number;
    timingScore: number;
  };
  drivers: string[];
  recommendations: string[];
}

export interface AiViralPrediction {
  averageViralScore: number;
  summary: {
    breakoutCount: number;
    highPotentialCount: number;
    consistentCount: number;
    belowBaselineCount: number;
  };
  creatorBenchmark: {
    medianViews: number;
    medianER: number;
    followers: number;
  };
  rankedPosts: AiViralRankedPost[];
}

export interface AiIntelligenceResponse {
  success: boolean;
  username: string;
  platform: string;
  followers: number;
  contentIntelligence: AiContentIntelligence;
  viralPrediction: AiViralPrediction;
}

export interface DraftSimulationPayload {
  caption: string;
  targetHour?: number;
  targetDay?: string;
  followers?: number;
  platform?: string;
  creatorMedianViews?: number;
  creatorMedianER?: number;
}

export interface DraftSimulationResult {
  draftCaption: string;
  targetSchedule: string;
  predictedViralScore: number;
  predictedTier: string;
  predictedTierLabel: string;
  predictedTierBadge: string;
  scoreBreakdown: {
    relativeVelocityScore: number;
    reachMultiplierScore: number;
    shareRetentionScore: number;
    hookScore: number;
    timingScore: number;
  };
  drivers: string[];
  recommendations: string[];
}

export interface YearlyTrendItem {
  year: string;
  postCount: number;
  averageER: number;
  medianER: number;
  averageViews: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  yoyGrowthPct: number;
}

export interface MonthlyTrendItem {
  month: string;
  postCount: number;
  averageER: number;
  medianER: number;
  averageViews: number;
}

export interface AccountTrendsData {
  success: boolean;
  username: string;
  platform: string;
  followers: number;
  totalPostsAnalyzed: number;
  dateRange: {
    oldestPost: string;
    latestPost: string;
    spanYears: number;
  };
  yearlyTrends: YearlyTrendItem[];
  monthlyTrends: MonthlyTrendItem[];
  momentum: {
    status: 'ACCELERATING' | 'STABLE' | 'DECELERATING' | string;
    label: string;
    color: string;
    note: string;
  };
  seasonality: {
    bestMonth: string;
    note: string;
  };
}

/**
 * Builds an accurate, canonical profile access URL for any platform
 */
export function getAccountProfileUrl(platform?: string, username?: string, storedUrl?: string | null): string {
  if (storedUrl && storedUrl.trim().startsWith('http')) {
    return storedUrl.trim();
  }
  const clean = (username || '').replace(/^@+/, '').trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const p = (platform || '').toUpperCase();
  if (p === 'TIKTOK') {
    return `https://www.tiktok.com/@${clean}`;
  }
  if (p === 'INSTAGRAM') {
    return `https://www.instagram.com/${clean}`;
  }
  if (p === 'YOUTUBE') {
    return clean.startsWith('@') ? `https://www.youtube.com/${clean}` : `https://www.youtube.com/@${clean}`;
  }
  if (p === 'FACEBOOK') {
    return `https://www.facebook.com/${clean}`;
  }
  return `https://${(platform || 'social').toLowerCase()}.com/${clean}`;
}



