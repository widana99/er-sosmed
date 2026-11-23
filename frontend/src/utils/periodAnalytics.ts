import { RankedPostItem, ComprehensiveAnalysisResult } from '../services/api.js';

export type PeriodFilterMode = 'ALL' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'YEAR' | 'MONTH' | 'CUSTOM';

export interface PeriodFilterConfig {
  mode: PeriodFilterMode;
  year?: number;
  month?: number; // 0 = Jan, 11 = Dec
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string; // YYYY-MM-DD
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Calculate numerical median
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return Number(sorted[mid].toFixed(2));
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

/**
 * Calculate Min, Max, and Spread Range
 */
export function calculateMinMax(values: number[]) {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, spread: 0 };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    spread: Number((max - min).toFixed(2)),
  };
}

/**
 * Calculate Quartiles (Q1, Median, Q3, IQR)
 */
export function calculateQuartiles(values: number[]) {
  if (!values || values.length === 0) {
    return { q1: 0, median: 0, q3: 0, iqr: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const median = calculateMedian(sorted);

  let lowerHalf: number[];
  let upperHalf: number[];

  if (n % 2 === 0) {
    lowerHalf = sorted.slice(0, n / 2);
    upperHalf = sorted.slice(n / 2);
  } else {
    const mid = Math.floor(n / 2);
    lowerHalf = sorted.slice(0, mid);
    upperHalf = sorted.slice(mid + 1);
  }

  const q1 = lowerHalf.length > 0 ? calculateMedian(lowerHalf) : sorted[0];
  const q3 = upperHalf.length > 0 ? calculateMedian(upperHalf) : sorted[n - 1];
  const iqr = Number(Math.max(0, q3 - q1).toFixed(2));

  return {
    q1: Number(q1.toFixed(2)),
    median: Number(median.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr,
  };
}

/**
 * Performance distribution buckets
 */
export function calculateDistribution(erValues: number[]) {
  if (!erValues || erValues.length === 0) {
    return {
      viralCount: 0,
      highCount: 0,
      moderateCount: 0,
      lowCount: 0,
      viralPct: 0,
      highPct: 0,
      moderatePct: 0,
      lowPct: 0,
    };
  }

  const total = erValues.length;
  let viral = 0;
  let high = 0;
  let moderate = 0;
  let low = 0;

  for (const er of erValues) {
    if (er > 8.0) viral++;
    else if (er >= 5.0) high++;
    else if (er >= 2.0) moderate++;
    else low++;
  }

  return {
    viralCount: viral,
    highCount: high,
    moderateCount: moderate,
    lowCount: low,
    viralPct: Number(((viral / total) * 100).toFixed(1)),
    highPct: Number(((high / total) * 100).toFixed(1)),
    moderatePct: Number(((moderate / total) * 100).toFixed(1)),
    lowPct: Number(((low / total) * 100).toFixed(1)),
  };
}

/**
 * Consistency score (0 - 100%)
 */
export function calculateConsistency(values: number[]): number {
  if (!values || values.length <= 1) return 100;
  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  if (mean === 0) return 0;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return Math.max(0, Math.min(100, Math.round(100 / (1 + cv * 1.5))));
}

/**
 * Rate card valuation estimate in IDR
 */
export function calculateRateCard(followers: number, engagementRate: number) {
  const validFollowers = Math.max(100, followers || 0);
  const validER = Math.max(0, engagementRate || 0);

  let basePricePerFollower = 55;
  if (validFollowers >= 1_000_000) basePricePerFollower = 28;
  else if (validFollowers >= 250_000) basePricePerFollower = 35;
  else if (validFollowers >= 50_000) basePricePerFollower = 42;
  else if (validFollowers >= 10_000) basePricePerFollower = 48;

  let multiplier = 1.0;
  if (validER >= 8.0) multiplier = 1.45;
  else if (validER >= 5.0) multiplier = 1.25;
  else if (validER >= 2.0) multiplier = 1.0;
  else multiplier = 0.75;

  const basePrice = validFollowers * basePricePerFollower * multiplier * 1.25; // Video deliverable factor
  const minIdr = Math.round((basePrice * 0.85) / 10000) * 10000;
  const maxIdr = Math.round((basePrice * 1.25) / 10000) * 10000;

  const formatShort = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return {
    minIdr,
    maxIdr,
    formatted: `${formatShort(minIdr)} - ${formatShort(maxIdr)}`,
  };
}

/**
 * Filter posts by period configuration
 */
export function filterPostsByPeriod(
  posts: RankedPostItem[],
  config: PeriodFilterConfig,
  language: string = 'id'
): {
  filteredPosts: RankedPostItem[];
  label: string;
  hasActiveFilter: boolean;
  totalAvailableWithDates: number;
} {
  const monthNames = language === 'id' ? MONTH_NAMES_ID : MONTH_NAMES_EN;
  const totalAvailableWithDates = posts.filter(
    (p) => p.postedAt && !isNaN(new Date(p.postedAt).getTime())
  ).length;

  if (config.mode === 'ALL') {
    return {
      filteredPosts: posts,
      label: language === 'id' ? 'Semua Waktu' : 'All Time',
      hasActiveFilter: false,
      totalAvailableWithDates,
    };
  }

  // Find latest post date or default to now
  const validTimestamps = posts
    .map((p) => (p.postedAt ? new Date(p.postedAt).getTime() : 0))
    .filter((ts) => ts > 0);

  const anchorTime = validTimestamps.length > 0 ? Math.max(...validTimestamps) : Date.now();

  let startBound = 0;
  let endBound = Infinity;
  let label = '';

  if (config.mode === 'LAST_30_DAYS') {
    const days30Ms = 30 * 24 * 60 * 60 * 1000;
    startBound = anchorTime - days30Ms;
    endBound = anchorTime + 86400000;
    const startD = new Date(startBound).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const endD = new Date(anchorTime).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    label = language === 'id' ? `30 Hari Terakhir (${startD} – ${endD})` : `Last 30 Days (${startD} – ${endD})`;
  } else if (config.mode === 'LAST_90_DAYS') {
    const days90Ms = 90 * 24 * 60 * 60 * 1000;
    startBound = anchorTime - days90Ms;
    endBound = anchorTime + 86400000;
    const startD = new Date(startBound).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const endD = new Date(anchorTime).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    label = language === 'id' ? `90 Hari Terakhir (${startD} – ${endD})` : `Last 90 Days (${startD} – ${endD})`;
  } else if (config.mode === 'YEAR') {
    const y = config.year ?? new Date().getFullYear();
    startBound = new Date(y, 0, 1, 0, 0, 0, 0).getTime();
    endBound = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
    label = language === 'id' ? `Tahun ${y}` : `Year ${y}`;
  } else if (config.mode === 'MONTH') {
    const y = config.year ?? new Date().getFullYear();
    const m = config.month ?? 0;
    startBound = new Date(y, m, 1, 0, 0, 0, 0).getTime();
    endBound = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
    label = `${monthNames[m]} ${y}`;
  } else if (config.mode === 'CUSTOM') {
    if (config.customStartDate) {
      startBound = new Date(`${config.customStartDate}T00:00:00`).getTime();
    }
    if (config.customEndDate) {
      endBound = new Date(`${config.customEndDate}T23:59:59.999`).getTime();
    }
    const startStr = config.customStartDate || 'Awal';
    const endStr = config.customEndDate || 'Sekarang';
    label = language === 'id' ? `Rentang: ${startStr} s/d ${endStr}` : `Range: ${startStr} to ${endStr}`;
  }

  const filteredPosts = posts.filter((p) => {
    if (!p.postedAt) return false;
    const t = new Date(p.postedAt).getTime();
    if (isNaN(t)) return false;
    return t >= startBound && t <= endBound;
  });

  return {
    filteredPosts,
    label,
    hasActiveFilter: true,
    totalAvailableWithDates,
  };
}

/**
 * Recomputes full ComprehensiveAnalysisResult for the filtered subset of posts
 */
export function computeFilteredAnalytics(
  baseData: ComprehensiveAnalysisResult,
  filteredPosts: RankedPostItem[]
): ComprehensiveAnalysisResult {
  if (filteredPosts.length === 0) {
    return {
      ...baseData,
      sampleSize: 0,
      totalLikes: 0,
      totalComments: 0,
      totalViews: 0,
      totalShares: 0,
      averageLikes: 0,
      averageComments: 0,
      averageViews: 0,
      averageER: 0,
      medianLikes: 0,
      medianComments: 0,
      medianViews: 0,
      medianER: 0,
      minER: 0,
      maxER: 0,
      spreadRange: 0,
      quartiles: { q1: 0, median: 0, q3: 0, iqr: 0 },
      distribution: {
        viralCount: 0,
        highCount: 0,
        moderateCount: 0,
        lowCount: 0,
        viralPct: 0,
        highPct: 0,
        moderatePct: 0,
        lowPct: 0,
      },
      consistencyScore: 0,
      rateCardValuation: { minIdr: 0, maxIdr: 0, formatted: 'Rp 0' },
      postsRanked: [],
    };
  }

  const sampleSize = filteredPosts.length;
  const totalLikes = filteredPosts.reduce((s, p) => s + p.likes, 0);
  const totalComments = filteredPosts.reduce((s, p) => s + p.comments, 0);
  const totalViews = filteredPosts.reduce((s, p) => s + (p.views || 0), 0);
  const totalShares = filteredPosts.reduce((s, p) => s + (p.shares || 0), 0);

  const averageLikes = Number((totalLikes / sampleSize).toFixed(2));
  const averageComments = Number((totalComments / sampleSize).toFixed(2));
  const averageViews = Number((totalViews / sampleSize).toFixed(2));

  const averageER =
    baseData.formulaType === 'VIEW_BASED' && totalViews > 0
      ? Number((((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(2))
      : Number((((averageLikes + averageComments) / (baseData.followers || 1)) * 100).toFixed(2));

  const erList = filteredPosts.map((p) => p.postER);
  const likesList = filteredPosts.map((p) => p.likes);
  const commentsList = filteredPosts.map((p) => p.comments);
  const viewsList = filteredPosts.map((p) => p.views || 0);

  const medianLikes = calculateMedian(likesList);
  const medianComments = calculateMedian(commentsList);
  const medianViews = calculateMedian(viewsList);
  const medianER = calculateMedian(erList);

  const minMax = calculateMinMax(erList);
  const quartiles = calculateQuartiles(erList);
  const distribution = calculateDistribution(erList);
  const consistencyScore = calculateConsistency(erList);
  const rateCard = calculateRateCard(baseData.followers, medianER);

  return {
    ...baseData,
    sampleSize,
    totalLikes,
    totalComments,
    totalViews,
    totalShares,
    averageLikes,
    averageComments,
    averageViews,
    averageER,
    medianLikes,
    medianComments,
    medianViews,
    medianER,
    minER: minMax.min,
    maxER: minMax.max,
    spreadRange: minMax.spread,
    quartiles,
    distribution,
    consistencyScore,
    rateCardValuation: rateCard,
    postsRanked: filteredPosts,
  };
}

/**
 * Extract available years and months from posts for UI filter dropdowns
 */
export function extractAvailableDates(posts: RankedPostItem[]) {
  const yearsSet = new Set<number>();
  const monthsByYear: Record<number, Set<number>> = {};
  let validDatesCount = 0;

  for (const post of posts) {
    if (post.postedAt) {
      const d = new Date(post.postedAt);
      if (!isNaN(d.getTime())) {
        validDatesCount++;
        const y = d.getFullYear();
        const m = d.getMonth();
        yearsSet.add(y);
        if (!monthsByYear[y]) monthsByYear[y] = new Set<number>();
        monthsByYear[y].add(m);
      }
    }
  }

  // Ensure continuous range from earliest post year (e.g. 2013 or inception) up to current year
  const currentYear = new Date().getFullYear();
  yearsSet.add(currentYear);
  if (yearsSet.size > 0) {
    const minYear = Math.min(...Array.from(yearsSet));
    for (let y = minYear; y <= currentYear; y++) {
      yearsSet.add(y);
    }
  } else {
    for (let y = currentYear; y >= currentYear - 5; y--) {
      yearsSet.add(y);
    }
  }

  const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
  const sortedMonthsByYear: Record<number, number[]> = {};
  for (const y of sortedYears) {
    sortedMonthsByYear[y] = Array.from({ length: 12 }, (_, i) => i);
  }

  return {
    years: sortedYears,
    monthsByYear: sortedMonthsByYear,
    hasPostedAtData: validDatesCount > 0,
    validDatesCount,
  };
}
