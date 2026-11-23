import { ISocialDataProvider, NormalizedAccountData } from './SocialDataProvider.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export class PythonScraperProvider implements ISocialDataProvider {
  private pythonUrl: string;

  constructor(pythonUrl?: string) {
    this.pythonUrl = pythonUrl || process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  private normalizeData(d: any): NormalizedAccountData {
    const defaultUrl = d.platform === 'FACEBOOK'
      ? `https://www.facebook.com/${d.username}`
      : d.platform === 'YOUTUBE'
      ? `https://www.youtube.com/@${d.username}`
      : d.platform === 'INSTAGRAM'
      ? `https://www.instagram.com/${d.username}`
      : `https://www.tiktok.com/@${d.username}`;

    return {
      platform: d.platform,
      username: d.username,
      displayName: d.displayName || d.username,
      avatarUrl: d.avatarUrl || undefined,
      profileUrl: d.profileUrl || defaultUrl,
      biography: d.biography || undefined,
      followers: Number(d.followers || 0),
      following: Number(d.following || 0),
      postsCount: Number(d.postsCount || 0),
      isPrivate: Boolean(d.isPrivate),
      joinedText: d.joinedText || undefined,
      contentNiche: d.contentNiche || undefined,
      source: 'API',
      posts: (d.posts || []).map((p: any) => ({
        likes: Number(p.likes || 0),
        comments: Number(p.comments || 0),
        views: p.views !== undefined && p.views !== null ? Number(p.views) : null,
        shares: p.shares !== undefined && p.shares !== null ? Number(p.shares) : null,
        caption: p.caption || '',
        postUrl: p.postUrl || undefined,
        postedAt: p.postedAt ? new Date(p.postedAt) : new Date(),
        contentNiche: p.contentNiche || undefined,
        contentType: p.contentType || (d.platform === 'TIKTOK' ? 'VIDEO' : d.platform === 'YOUTUBE' ? 'LONG_VIDEO' : 'FEED_POST'),
      })),
    };
  }

  async getAccount(
    username: string,
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | string
  ): Promise<NormalizedAccountData | null> {
    // 1. Try fast HTTP microservice first
    try {
      const response = await fetch(`${this.pythonUrl}/api/scraper/scrape-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, username }),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return this.normalizeData(json.data);
        }
        if (json.success === false && json.message && (json.message.includes('tidak ditemukan') || json.message.includes('not found'))) {
          // Account definitively not found, skip redundant CLI invocation
          return null;
        }
      }
    } catch (err: any) {
      console.warn(`[PythonScraperProvider] HTTP call failed for @${username} (${err.message}). Trying direct Python CLI fallback...`);
    }

    // 2. Resilient Direct Python CLI Fallback (always works even if port 8000 microservice is offline)
    try {
      const rootDir = process.cwd();
      const scriptPath = path.resolve(
        rootDir,
        rootDir.endsWith('backend') ? '../ai_service/cli_scraper.py' : 'ai_service/cli_scraper.py'
      );

      const { stdout } = await execFileAsync('python', [scriptPath, '--platform', String(platform), '--username', username], {
        timeout: 18000,
        maxBuffer: 20 * 1024 * 1024,
      });

      const jsonStr = stdout.trim().slice(stdout.trim().indexOf('{'));
      const json = JSON.parse(jsonStr);
      if (json.success && json.data) {
        console.log(`[PythonScraperProvider] Successfully scraped @${username} via Python CLI fallback.`);
        return this.normalizeData(json.data);
      }
    } catch (cliErr: any) {
      console.error(`[PythonScraperProvider] Python CLI fallback failed for @${username}:`, cliErr.message);
    }

    return null;
  }
}
