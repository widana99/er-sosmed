import { StatisticsService, QuartilesResult, DistributionResult } from './StatisticsService.js';
import { RateCardCalculator, RateCardDeliverable } from './RateCardCalculator.js';

export interface PostMetricInput {
  likes: number;
  comments: number;
  views?: number | null;
  shares?: number | null;
  saves?: number | null;
  reach?: number | null;
  postedAt?: Date | string;
  caption?: string | null;
}

export interface CalculationResult {
  formulaType: 'FOLLOWER_BASED' | 'VIEW_BASED' | 'REACH_BASED';
  sampleSize: number;
  averageLikes: number;
  averageComments: number;
  averageViews: number | null;
  averageShares: number | null;
  totalInteractions: number;
  engagementRate: number; // in percentage e.g. 5.12
  isAnomalous: boolean;
  anomalyReason?: string;
  formulaExplanation: string;
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
    totalVideos?: number;
    totalShorts?: number;
    totalLive?: number;
    totalReels?: number;
    totalFeed?: number;
    totalCarousel?: number;
    totalHighlights?: number;
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
  postsRanked: Array<{
    index: number;
    likes: number;
    comments: number;
    views: number;
    shares: number;
    caption?: string;
    postedAt?: string;
    postER: number;
    tier: 'VIRAL' | 'HIGH' | 'MODERATE' | 'LOW';
    contentType?: string;
    postUrl?: string;
  }>;
}

export class AnalyticsEngine {
  /**
   * Calculate Follower-based Engagement Rate (Instagram Default)
   * Formula: ((Avg Likes + Avg Comments) / Followers) * 100
   */
  static calculateFollowerBased(
    followers: number,
    posts: PostMetricInput[]
  ): CalculationResult {
    if (followers <= 0) {
      throw new Error('Followers count must be greater than zero for follower-based ER calculation.');
    }

    if (!posts || posts.length === 0) {
      throw new Error('At least one post is required to calculate engagement rate.');
    }

    const sampleSize = posts.length;
    let totalLikes = 0;
    let totalComments = 0;
    let totalViews = 0;
    let totalShares = 0;
    let hasViews = false;
    let hasShares = false;

    for (const post of posts) {
      totalLikes += Math.max(0, post.likes || 0);
      totalComments += Math.max(0, post.comments || 0);
      if (post.views !== undefined && post.views !== null) {
        totalViews += Math.max(0, post.views);
        hasViews = true;
      }
      if (post.shares !== undefined && post.shares !== null) {
        totalShares += Math.max(0, post.shares);
        hasShares = true;
      }
    }

    const avgLikes = Number((totalLikes / sampleSize).toFixed(2));
    const avgComments = Number((totalComments / sampleSize).toFixed(2));
    const avgViews = hasViews ? Number((totalViews / sampleSize).toFixed(2)) : null;
    const avgShares = hasShares ? Number((totalShares / sampleSize).toFixed(2)) : null;

    const avgEngagement = avgLikes + avgComments;
    const rawER = (avgEngagement / followers) * 100;
    const er = Number(rawER.toFixed(2));

    const isAnomalous = er > 100;

    return {
      formulaType: 'FOLLOWER_BASED',
      sampleSize,
      averageLikes: avgLikes,
      averageComments: avgComments,
      averageViews: avgViews,
      averageShares: avgShares,
      totalInteractions: totalLikes + totalComments,
      engagementRate: er,
      isAnomalous,
      anomalyReason: isAnomalous
        ? 'Engagement Rate exceeds 100%. Verify follower count and post metrics for viral spikes or bot activity.'
        : undefined,
      formulaExplanation: `((Avg Likes ${avgLikes} + Avg Comments ${avgComments}) / Followers ${followers}) * 100 = ${er}%`,
    };
  }

  /**
   * Calculate View-based Engagement Rate (TikTok Default)
   * Formula: ((Likes + Comments + Shares) / Views) * 100
   */
  static calculateViewBased(posts: PostMetricInput[]): CalculationResult {
    if (!posts || posts.length === 0) {
      throw new Error('At least one post is required to calculate engagement rate.');
    }

    const sampleSize = posts.length;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;

    for (const post of posts) {
      totalLikes += Math.max(0, post.likes || 0);
      totalComments += Math.max(0, post.comments || 0);
      totalShares += Math.max(0, post.shares || 0);
      totalViews += Math.max(0, post.views || 0);
    }

    if (totalViews <= 0) {
      throw new Error('Total views must be greater than zero for view-based ER calculation.');
    }

    const avgLikes = Number((totalLikes / sampleSize).toFixed(2));
    const avgComments = Number((totalComments / sampleSize).toFixed(2));
    const avgShares = Number((totalShares / sampleSize).toFixed(2));
    const avgViews = Number((totalViews / sampleSize).toFixed(2));

    const totalInteractions = totalLikes + totalComments + totalShares;
    const rawER = (totalInteractions / totalViews) * 100;
    const er = Number(rawER.toFixed(2));

    const isAnomalous = er > 100;

    return {
      formulaType: 'VIEW_BASED',
      sampleSize,
      averageLikes: avgLikes,
      averageComments: avgComments,
      averageViews: avgViews,
      averageShares: avgShares,
      totalInteractions,
      engagementRate: er,
      isAnomalous,
      anomalyReason: isAnomalous
        ? 'Engagement Rate exceeds 100%. Post views count may be under-reported or engagement metrics inflated.'
        : undefined,
      formulaExplanation: `((Total Likes ${totalLikes} + Comments ${totalComments} + Shares ${totalShares}) / Total Views ${totalViews}) * 100 = ${er}%`,
    };
  }

  /**
   * Smart auto-selection for calculation formula with fallback
   */
  static calculateAuto(
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | string,
    followers: number,
    posts: PostMetricInput[]
  ): CalculationResult {
    if (platform === 'TIKTOK' || platform === 'YOUTUBE') {
      const hasViews = posts.some((p) => p.views !== null && p.views !== undefined && p.views > 0);
      if (hasViews) {
        try {
          return this.calculateViewBased(posts);
        } catch {
          // fallback to follower based if views failed
        }
      }
    }

    const safeFollowers = Math.max(1, followers);
    return this.calculateFollowerBased(safeFollowers, posts);
  }

  /**
   * Primary statistical calculation delegated to Python Pandas & NumPy Engine.
   * Gracefully falls back to native mathematical calculations if Python microservice is restarting.
   */
  static async calculateComprehensiveAnalyticsAsync(params: {
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
    username?: string;
    followers: number;
    posts: PostMetricInput[];
    startDate?: string;
    endDate?: string;
    filterYear?: string;
    filterMonth?: string;
    contentType?: string;
  }): Promise<ComprehensiveAnalysisResult> {
    const pythonUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
    try {
      const response = await fetch(`${pythonUrl}/api/calculate/comprehensive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: params.platform,
          username: params.username || '',
          followers: params.followers,
          startDate: params.startDate,
          endDate: params.endDate,
          filterYear: params.filterYear,
          filterMonth: params.filterMonth,
          contentType: params.contentType,
          posts: params.posts.map((p) => ({
            likes: p.likes || 0,
            comments: p.comments || 0,
            views: p.views ?? 0,
            shares: p.shares ?? 0,
            caption: p.caption || '',
            postedAt: p.postedAt ? (typeof p.postedAt === 'string' ? p.postedAt : p.postedAt.toISOString()) : undefined,
            contentType: (p as any).contentType || 'LONG_VIDEO',
            postUrl: (p as any).postUrl || '',
          })),
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data as ComprehensiveAnalysisResult;
        }
      }
    } catch (err: any) {
      console.warn('[AnalyticsEngine] Python Pandas engine call failed, using native calculation:', err.message);
    }

    return this.calculateComprehensiveAnalytics(params);
  }

  /**
   * Calculate Comprehensive Deep Statistical Analytics across all individual posts:
   * Median, Min/Max, Quartiles, Distribution, Consistency, Interaction Quality & Rate Card
   */
  static calculateComprehensiveAnalytics(params: {
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
    username?: string;
    followers: number;
    posts: PostMetricInput[];
    filterYear?: string;
    filterMonth?: string;
    startDate?: string;
    endDate?: string;
    contentType?: string;
  }): ComprehensiveAnalysisResult {
    const { platform, username, followers, filterYear, filterMonth, startDate, endDate, contentType } = params;
    const isTikTok = platform === 'TIKTOK';
    const isYouTube = platform === 'YOUTUBE';
    const isInstagram = platform === 'INSTAGRAM';
    const isFacebook = platform === 'FACEBOOK';

    // Calculate content format breakdown across the complete dataset
    const contentBreakdown = {
      totalVideos: params.posts.filter((p) => {
        const ct = ((p as any).contentType || '').toUpperCase();
        return ct === 'LONG_VIDEO' || ct === 'VIDEO';
      }).length,
      totalShorts: params.posts.filter((p) => ((p as any).contentType || '').toUpperCase() === 'SHORTS').length,
      totalLive: params.posts.filter((p) => ((p as any).contentType || '').toUpperCase() === 'LIVE').length,
      totalReels: params.posts.filter((p) => {
        const ct = ((p as any).contentType || '').toUpperCase();
        return ct === 'REELS' || ct === 'REEL';
      }).length,
      totalFeed: params.posts.filter((p) => {
        const ct = ((p as any).contentType || '').toUpperCase();
        return ct === 'FEED_POST' || ct === 'FEED' || ct === 'POST' || ct === 'STATUS' || ct === 'PHOTO';
      }).length,
      totalCarousel: params.posts.filter((p) => {
        const ct = ((p as any).contentType || '').toUpperCase();
        return ct === 'PHOTO_CAROUSEL' || ct === 'CAROUSEL' || ct === 'ALBUM';
      }).length,
      totalHighlights: params.posts.filter((p) => {
        const ct = ((p as any).contentType || '').toUpperCase();
        return ct === 'HIGHLIGHT' || ct === 'HIGHLIGHTS';
      }).length,
    };

    let posts = params.posts;

    if (contentType && contentType !== 'ALL') {
      const targetCt = contentType.toUpperCase();
      posts = posts.filter((p) => {
        const pCt = ((p as any).contentType || (isYouTube ? 'LONG_VIDEO' : isTikTok ? 'VIDEO' : 'FEED_POST')).toUpperCase();
        if (targetCt === 'LONG_VIDEO') return pCt === 'LONG_VIDEO' || pCt === 'VIDEO';
        if (targetCt === 'FEED_POST') return pCt === 'FEED_POST' || pCt === 'FEED' || pCt === 'POST';
        if (targetCt === 'PHOTO_CAROUSEL') return pCt === 'PHOTO_CAROUSEL' || pCt === 'CAROUSEL' || pCt === 'ALBUM';
        if (targetCt === 'REELS') return pCt === 'REELS' || pCt === 'REEL';
        if (targetCt === 'HIGHLIGHT') return pCt === 'HIGHLIGHT' || pCt === 'HIGHLIGHTS';
        return pCt === targetCt;
      });
    }

    if (filterYear || filterMonth || startDate || endDate) {
      posts = posts.filter((p) => {
        if (!p.postedAt) return false;
        const d = new Date(p.postedAt);
        if (isNaN(d.getTime())) return false;
        if (filterYear && d.getFullYear() !== parseInt(filterYear, 10)) return false;
        if (filterMonth && d.getMonth() !== parseInt(filterMonth, 10)) return false;
        if (startDate && d < new Date(startDate)) return false;
        if (endDate && d > new Date(endDate)) return false;
        return true;
      });
    }

    if (!posts || posts.length === 0) {
      throw new Error('Minimal 1 postingan dibutuhkan untuk kalkulasi analisis ER.');
    }

    const sampleSize = posts.length;
    const safeFollowers = Math.max(1, followers || 0);

    // 1. Determine Formula
    const isReelsFilter = contentType && (contentType.toUpperCase() === 'REELS' || contentType.toUpperCase() === 'REEL');
    const hasViews = posts.some((p) => p.views !== null && p.views !== undefined && p.views > 0);
    const formulaType: 'FOLLOWER_BASED' | 'VIEW_BASED' =
      ((isTikTok || isYouTube) && hasViews) || ((isInstagram || isFacebook) && isReelsFilter && hasViews)
        ? 'VIEW_BASED'
        : 'FOLLOWER_BASED';

    // 2. Compute individual post ER and aggregate metrics
    const likesList: number[] = [];
    const commentsList: number[] = [];
    const viewsList: number[] = [];
    const erList: number[] = [];

    let totalLikes = 0;
    let totalComments = 0;
    let totalViews = 0;
    let totalShares = 0;

    const evaluatedPosts = posts.map((post, idx) => {
      const likes = Math.max(0, post.likes || 0);
      const comments = Math.max(0, post.comments || 0);
      const views = Math.max(0, post.views || 0);
      const shares = Math.max(0, post.shares || 0);
      const postCt = ((post as any).contentType || '').toUpperCase();

      likesList.push(likes);
      commentsList.push(comments);
      viewsList.push(views);

      totalLikes += likes;
      totalComments += comments;
      totalViews += views;
      totalShares += shares;

      // Individual Post ER calculation
      let postER = 0;
      if (isYouTube) {
        const divisor = views > 0 ? views : 1;
        postER = Number((((likes + comments) / divisor) * 100).toFixed(2));
      } else if (isTikTok) {
        const divisor = views > 0 ? views : safeFollowers;
        postER = Number((((likes + comments + shares) / divisor) * 100).toFixed(2));
      } else if (isFacebook) {
        if (views > 0 && (postCt === 'VIDEO' || postCt === 'REELS' || postCt === 'REEL')) {
          postER = Number((((likes + comments + shares) / views) * 100).toFixed(2));
        } else {
          postER = Number((((likes + comments + shares) / safeFollowers) * 100).toFixed(2));
        }
      } else if (isInstagram) {
        if ((postCt === 'REELS' || postCt === 'REEL') && views > 0) {
          postER = Number((((likes + comments + shares) / views) * 100).toFixed(2));
        } else {
          postER = Number((((likes + comments) / safeFollowers) * 100).toFixed(2));
        }
      } else {
        postER = Number((((likes + comments) / safeFollowers) * 100).toFixed(2));
      }

      erList.push(postER);

      // Determine tier
      let tier: 'VIRAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      if (postER > 8.0) tier = 'VIRAL';
      else if (postER >= 5.0) tier = 'HIGH';
      else if (postER >= 2.0) tier = 'MODERATE';

      return {
        index: idx + 1,
        likes,
        comments,
        views,
        shares,
        caption: (post as any).caption,
        postedAt: (post as any).postedAt ? new Date((post as any).postedAt).toISOString() : undefined,
        postER,
        tier,
        contentType: (post as any).contentType,
        postUrl: (post as any).postUrl,
      };
    });

    // 3. Mathematical Calculations
    const averageLikes = Number((totalLikes / sampleSize).toFixed(2));
    const averageComments = Number((totalComments / sampleSize).toFixed(2));
    const averageViews = Number((totalViews / sampleSize).toFixed(2));

    const averageER =
      formulaType === 'VIEW_BASED' && totalViews > 0
        ? Number((((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(2))
        : isFacebook
        ? Number((((totalLikes + totalComments + totalShares) / (sampleSize * safeFollowers)) * 100).toFixed(2))
        : Number((((averageLikes + averageComments) / safeFollowers) * 100).toFixed(2));

    const medianLikes = StatisticsService.calculateMedian(likesList);
    const medianComments = StatisticsService.calculateMedian(commentsList);
    const medianViews = StatisticsService.calculateMedian(viewsList);
    const medianER = StatisticsService.calculateMedian(erList);

    const minMax = StatisticsService.calculateMinMax(erList);
    const quartiles = StatisticsService.calculateQuartiles(erList);
    const distribution = StatisticsService.calculateDistribution(erList);
    const consistencyScore = StatisticsService.calculateConsistency(erList);
    const interactionQuality = StatisticsService.evaluateInteractionQuality(totalLikes, totalComments);

    // 4. Rate Card Calculation
    const rateCardData = RateCardCalculator.calculate(safeFollowers, medianER);
    const videoDeliverable = rateCardData.deliverables.find((d) => d.key === 'VIDEO') || rateCardData.deliverables[0];

    // 5. Rank posts by performance descending
    const postsRanked = [...evaluatedPosts].sort((a, b) => b.postER - a.postER);

    return {
      platform,
      username: username || 'User Account',
      followers: safeFollowers,
      formulaType,
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
      commentToLikeRatio: interactionQuality.ratio,
      botRisk: interactionQuality.botRisk,
      botRiskReason: interactionQuality.reason,
      contentBreakdown,
      rateCardValuation: {
        minIdr: videoDeliverable?.priceLow || 500000,
        maxIdr: videoDeliverable?.priceHigh || 1500000,
        formatted: videoDeliverable?.formattedRange || 'Rp 500.000 - Rp 1.500.000',
      },
      postsRanked,
    };
  }
}

