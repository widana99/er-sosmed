import { PostMetricInput } from './AnalyticsEngine.js';

export interface NormalizedAccountData {
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  username: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl?: string;
  accountType?: string;
  city?: string;
  biography?: string;
  followers: number;
  following: number;
  postsCount: number;
  isPrivate?: boolean;
  isRestricted?: boolean;
  joinedText?: string;
  source: 'MANUAL' | 'CSV_IMPORT' | 'API';
  breakdown?: {
    totalVideos?: number;
    totalShorts?: number;
    totalLive?: number;
    totalReels?: number;
    totalFeed?: number;
    totalCarousel?: number;
    totalHighlights?: number;
  };
  contentNiche?: string;
  posts: Array<PostMetricInput & {
    postUrl?: string;
    caption?: string;
    postedAt: Date;
    contentType?: string;
    contentNiche?: string;
  }>;
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

export interface ISocialDataProvider {
  getAccount(username: string, platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | string): Promise<NormalizedAccountData | null>;
  getCandidates?(query: string, platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | string): Promise<AccountCandidate[]>;
}

/**
 * Composite provider: tries RapidAPI, BrowserScraper, PublicScraper, PythonScraper,
 * and YouTubeScraperProvider for YouTube.
 * Never fabricates dummy data.
 */
export class CompositeSocialDataProvider implements ISocialDataProvider {
  private rapidApiProvider: ISocialDataProvider;
  private browserScraperProvider: ISocialDataProvider;
  private publicScraperProvider: ISocialDataProvider;
  private pythonScraperProvider: ISocialDataProvider;
  private youtubeScraperProvider: ISocialDataProvider;

  constructor(
    rapidApiProvider?: ISocialDataProvider,
    browserScraperProvider?: ISocialDataProvider,
    publicScraperProvider?: ISocialDataProvider,
    pythonScraperProvider?: ISocialDataProvider,
    youtubeScraperProvider?: ISocialDataProvider
  ) {
    this.rapidApiProvider = rapidApiProvider || ({} as any);
    this.browserScraperProvider = browserScraperProvider || ({} as any);
    this.publicScraperProvider = publicScraperProvider || ({} as any);
    this.pythonScraperProvider = pythonScraperProvider || ({} as any);
    this.youtubeScraperProvider = youtubeScraperProvider || ({} as any);
  }

  static async createDefault(): Promise<CompositeSocialDataProvider> {
    const { RapidApiProvider } = await import('./RapidApiProvider.js');
    const { BrowserScraperProvider } = await import('./BrowserScraperProvider.js');
    const { PublicScraperProvider } = await import('./PublicScraperProvider.js');
    const { PythonScraperProvider } = await import('./PythonScraperProvider.js');
    const { YouTubeScraperProvider } = await import('./YouTubeScraperProvider.js');

    return new CompositeSocialDataProvider(
      new RapidApiProvider(),
      new BrowserScraperProvider(),
      new PublicScraperProvider(),
      new PythonScraperProvider(),
      new YouTubeScraperProvider()
    );
  }

  async getAccount(
    username: string,
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'
  ): Promise<NormalizedAccountData | null> {
    // 0. Specialized routing for YouTube
    if (platform === 'YOUTUBE') {
      try {
        if (typeof (this.youtubeScraperProvider as any).getAccount === 'function') {
          const ytResult = await this.youtubeScraperProvider.getAccount(username, 'YOUTUBE');
          if (ytResult) return ytResult;
        }
      } catch (err: any) {
        console.warn(`[CompositeSocialDataProvider] YouTube scraping failed for @${username}:`, err.message);
        throw err;
      }
      return null;
    }

    // 0b. Specialized routing for Facebook (High-Accuracy Python Engine)
    if (platform === 'FACEBOOK') {
      try {
        const fbResult = await this.pythonScraperProvider.getAccount(username, 'FACEBOOK');
        if (fbResult) return fbResult;
      } catch (err: any) {
        console.warn(`[CompositeSocialDataProvider] Facebook scraping failed for @${username}:`, err.message);
        throw err;
      }
      return null;
    }

    let pythonResult: NormalizedAccountData | null = null;
    let browserResult: NormalizedAccountData | null = null;
    let rapidResult: NormalizedAccountData | null = null;
    let scraperResult: NormalizedAccountData | null = null;
    let notFoundErr: any = null;

    // 1. Try Python Native Scraper FIRST (High-Accuracy Engine & Content Niche Intelligence)
    try {
      pythonResult = await this.pythonScraperProvider.getAccount(username, platform);
      if (pythonResult && (pythonResult.followers > 0 || pythonResult.posts.length > 0)) {
        console.log(`[CompositeSocialDataProvider] Successfully scraped @${username} (${platform}) using Python Scraper Engine`);
        return pythonResult;
      }
    } catch (err: any) {
      if (err?.isNotFound) notFoundErr = err;
    }

    // 2. Try Browser Scraper (Puppeteer with authenticated session cookies)
    try {
      browserResult = await this.browserScraperProvider.getAccount(username, platform);
      if (browserResult && (browserResult.followers > 0 || browserResult.posts.length > 0)) {
        return browserResult;
      }
    } catch (err: any) {
      if (err?.isNotFound) notFoundErr = err;
    }

    // 3. Try RapidAPI (if configured with API key)
    try {
      rapidResult = await this.rapidApiProvider.getAccount(username, platform);
      if (rapidResult && rapidResult.followers > 0 && rapidResult.posts.length > 0) {
        return rapidResult;
      }
    } catch (err: any) {
      if (err?.isNotFound) notFoundErr = err;
    }

    // 4. Try Public Web Scraper (fast SSR HTTP fetch fallback)
    try {
      scraperResult = await this.publicScraperProvider.getAccount(username, platform);
      if (scraperResult) {
        return scraperResult;
      }
    } catch (err: any) {
      if (err?.isNotFound) notFoundErr = err;
    }

    // Return the best partial result if any
    if (pythonResult) return pythonResult;
    if (browserResult) return browserResult;
    if (rapidResult) return rapidResult;
    if (scraperResult) return scraperResult;

    if (notFoundErr) {
      throw notFoundErr;
    }

    return null;
  }

  async getCandidates(
    query: string,
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | string
  ): Promise<AccountCandidate[]> {
    if (platform === 'YOUTUBE') {
      if (typeof (this.youtubeScraperProvider as any).getCandidates === 'function') {
        return (this.youtubeScraperProvider as any).getCandidates(query, platform);
      }
      return [];
    }

    if (platform === 'FACEBOOK') {
      const clean = query.replace(/^@/, '').trim();
      if (!clean) return [];
      return [
        {
          username: clean,
          displayName: `@${clean}`,
          platform: 'FACEBOOK',
          followers: 0,
          profileUrl: `https://www.facebook.com/${clean}`,
          source: 'SUGGESTION',
        },
      ];
    }

    const results: AccountCandidate[] = [];
    const seen = new Set<string>();

    // Try RapidAPI candidates first
    try {
      if (typeof (this.rapidApiProvider as any).getCandidates === 'function') {
        const rapidCandidates = await (this.rapidApiProvider as any).getCandidates(query, platform);
        for (const c of rapidCandidates) {
          const key = c.username.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push(c);
          }
        }
      }
    } catch {
      // continue
    }

    // Then try scraper candidates
    try {
      if (typeof (this.publicScraperProvider as any).getCandidates === 'function') {
        const scraperCandidates = await (this.publicScraperProvider as any).getCandidates(query, platform);
        for (const c of scraperCandidates) {
          const key = c.username.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push(c);
          }
        }
      }
    } catch {
      // continue
    }

    return results;
  }
}
