import { ISocialDataProvider, NormalizedAccountData, AccountCandidate } from './SocialDataProvider.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export class YouTubeScraperProvider implements ISocialDataProvider {
  private pythonUrl: string;

  constructor(pythonUrl?: string) {
    this.pythonUrl = pythonUrl || process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  async getAccount(
    username: string,
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | string
  ): Promise<NormalizedAccountData | null> {
    if (platform !== 'YOUTUBE') {
      return null;
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) return null;

    try {
      console.log(`[YouTubeScraperProvider] Requesting scrape for @${cleanUsername} from Python engine...`);
      const response = await fetch(`${this.pythonUrl}/api/scrape/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          maxVideos: 100,
        }),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const d = json.data;
          return this.normalizeYouTubeData(d);
        }
      }
    } catch (err: any) {
      console.warn(`[YouTubeScraperProvider] HTTP call failed for @${cleanUsername} (${err.message}). Trying direct Python CLI fallback...`);
    }

    // 2. Direct Python CLI Fallback (handles offline or restarting microservice)
    try {
      const rootDir = process.cwd();
      const scriptPath = path.resolve(
        rootDir,
        rootDir.endsWith('backend') ? '../ai_service/cli_scraper.py' : 'ai_service/cli_scraper.py'
      );

      const { stdout } = await execFileAsync('python', [scriptPath, '--platform', 'YOUTUBE', '--username', cleanUsername], {
        timeout: 20000,
        maxBuffer: 20 * 1024 * 1024,
      });

      const jsonStr = stdout.trim().slice(stdout.trim().indexOf('{'));
      const json = JSON.parse(jsonStr);
      if (json.success && json.data) {
        console.log(`[YouTubeScraperProvider] Successfully scraped @${cleanUsername} via Python CLI fallback.`);
        return this.normalizeYouTubeData(json.data);
      }
    } catch (cliErr: any) {
      console.error(`[YouTubeScraperProvider] Python CLI fallback failed for @${cleanUsername}:`, cliErr.message);
    }

    return null;
  }

  private normalizeYouTubeData(d: any): NormalizedAccountData {
    return {
      platform: 'YOUTUBE',
      username: d.username,
      displayName: d.displayName || `@${d.username}`,
      avatarUrl: d.avatarUrl || undefined,
      profileUrl: d.profileUrl || `https://www.youtube.com/@${d.username}`,
      accountType: d.accountType || 'YouTube Creator',
      city: d.city || 'Nasional',
      biography: d.biography || '',
      followers: Number(d.followers || 1),
      following: Number(d.following || 0),
      postsCount: Number(d.postsCount || d.posts?.length || 0),
      isPrivate: false,
      source: 'API',
      breakdown: d.breakdown || {
        totalVideos: 0,
        totalShorts: 0,
        totalLive: 0,
      },
      posts: (d.posts || []).map((p: any) => ({
        likes: Number(p.likes || 0),
        comments: Number(p.comments || 0),
        views: p.views !== undefined && p.views !== null ? Number(p.views) : 0,
        shares: p.shares !== undefined && p.shares !== null ? Number(p.shares) : 0,
        caption: p.caption || '',
        postUrl: p.postUrl || (p.videoId ? `https://www.youtube.com/watch?v=${p.videoId}` : undefined),
        postedAt: p.postedAt ? new Date(p.postedAt) : new Date(),
        contentType: p.contentType || 'LONG_VIDEO',
      })),
    };
  }

  async getCandidates(
    query: string,
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE'
  ): Promise<AccountCandidate[]> {
    if (platform !== 'YOUTUBE') return [];
    const clean = query.replace(/^@/, '').trim();
    if (!clean) return [];

    return [
      {
        username: clean,
        displayName: `@${clean}`,
        platform: 'YOUTUBE',
        followers: 0,
        profileUrl: `https://www.youtube.com/@${clean}`,
        source: 'SUGGESTION',
      },
    ];
  }
}
