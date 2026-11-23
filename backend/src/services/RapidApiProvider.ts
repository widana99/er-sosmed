import {
  ISocialDataProvider,
  NormalizedAccountData,
  AccountCandidate,
} from './SocialDataProvider.js';

/**
 * RapidAPI-backed provider for TikTok and Instagram.
 *
 * Supported APIs (configure via .env):
 *   TikTok:    "TikTok Scraper" by Flavor — host: tiktok-scraper7.p.rapidapi.com
 *   Instagram: "Instagram Scraper API" by Social Starter — host: instagram-scraper-api2.p.rapidapi.com
 *
 * Both APIs offer free tiers (100-150 req/month) sufficient for testing.
 */
export class RapidApiProvider implements ISocialDataProvider {
  private apiKey?: string;
  private tiktokHost: string;
  private instagramHost: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.tiktokHost = process.env.RAPIDAPI_TIKTOK_HOST || 'tiktok-scraper7.p.rapidapi.com';
    this.instagramHost = process.env.RAPIDAPI_INSTAGRAM_HOST || 'instagram-scraper-api2.p.rapidapi.com';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async getAccount(
    username: string,
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | string
  ): Promise<NormalizedAccountData | null> {
    if (!this.apiKey) return null;
    if (platform !== 'INSTAGRAM' && platform !== 'TIKTOK') return null;

    const cleanUsername = username.replace(/^@/, '').toLowerCase().trim();

    try {
      if (platform === 'TIKTOK') {
        return await this.fetchTikTokAccount(cleanUsername);
      } else {
        return await this.fetchInstagramAccount(cleanUsername);
      }
    } catch (err: unknown) {
      if ((err as any)?.isNotFound) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[RapidApiProvider] Failed @${cleanUsername} on ${platform}: ${msg}`);
      return null;
    }
  }

  async getCandidates(
    query: string,
    platform: 'INSTAGRAM' | 'TIKTOK'
  ): Promise<AccountCandidate[]> {
    if (!this.apiKey) return [];

    const cleanQ = query.replace(/^@/, '').trim();
    if (!cleanQ) return [];

    try {
      if (platform === 'TIKTOK') {
        return await this.searchTikTokUsers(cleanQ);
      } else {
        return await this.searchInstagramUsers(cleanQ);
      }
    } catch {
      return [];
    }
  }

  // ─── TikTok ────────────────────────────────────────────────

  private async fetchTikTokAccount(username: string): Promise<NormalizedAccountData | null> {
    // Step 1: Get user info
    const infoUrl = `https://${this.tiktokHost}/user/info?unique_id=${encodeURIComponent(username)}`;
    const infoRes = await this.rapidFetch(infoUrl, this.tiktokHost);

    if (!infoRes.ok) {
      if (infoRes.status === 404) {
        const err = new Error(`ACCOUNT_NOT_FOUND: Akun TikTok @${username} tidak ditemukan.`);
        (err as any).isNotFound = true;
        throw err;
      }
      return null;
    }

    const infoData = (await infoRes.json()) as any;
    const userData = infoData?.data || infoData?.user_info || infoData;

    if (!userData || infoData?.status === 'fail' || infoData?.msg?.includes('not found')) {
      const err = new Error(`ACCOUNT_NOT_FOUND: Akun TikTok @${username} tidak ditemukan.`);
      (err as any).isNotFound = true;
      throw err;
    }

    const user = userData.user || userData;
    const stats = userData.stats || user.stats || {};

    const followers = Number(stats.followerCount || stats.follower_count || user.follower_count || 0);
    const following = Number(stats.followingCount || stats.following_count || user.following_count || 0);
    const postsCount = Number(stats.videoCount || stats.video_count || user.video_count || 0);
    const heartCount = Number(stats.heartCount || stats.heart_count || stats.heart || user.total_favorited || 0);
    const displayName = user.nickname || user.nick_name || `@${username}`;
    const avatarUrl = user.avatarLarger || user.avatar_larger || user.avatarMedium || user.avatar_medium || undefined;
    const isPrivate = Boolean(user.secret || user.privateAccount || user.private_account);
    const isRestricted = Boolean(user.ftc);
    const isVerified = Boolean(user.verified);

    let accountType = isVerified ? 'Verified Creator' : 'Creator (Public)';
    if (isPrivate) accountType = 'Private Account';
    else if (isRestricted) accountType = 'Restricted (18+)';

    // Step 2: Get user posts (all of them, with pagination)
    let posts: NormalizedAccountData['posts'] = [];

    if (!isPrivate) {
      const secUid = user.secUid || user.sec_uid || '';
      posts = await this.fetchTikTokPosts(username, secUid, postsCount);
    }

    // Do not synthesize dummy posts if API returns no posts. Only return genuine posts.

    return {
      platform: 'TIKTOK',
      username,
      displayName,
      avatarUrl,
      profileUrl: `https://www.tiktok.com/@${username}`,
      accountType,
      followers,
      following,
      postsCount,
      isPrivate,
      isRestricted,
      source: 'API',
      posts,
    };
  }

  private async fetchTikTokPosts(
    username: string,
    secUid: string,
    totalPosts: number
  ): Promise<NormalizedAccountData['posts']> {
    const allPosts: NormalizedAccountData['posts'] = [];
    let cursor = '0';
    let hasMore = true;
    const maxPages = Math.min(100, Math.ceil(totalPosts / 30));
    let page = 0;

    while (hasMore && page < maxPages && allPosts.length < totalPosts) {
      const idParam = secUid
        ? `sec_uid=${encodeURIComponent(secUid)}`
        : `unique_id=${encodeURIComponent(username)}`;
      const postsUrl = `https://${this.tiktokHost}/user/posts?${idParam}&count=30&cursor=${cursor}`;

      try {
        const postsRes = await this.rapidFetch(postsUrl, this.tiktokHost);
        if (!postsRes.ok) break;

        const postsData = (await postsRes.json()) as any;
        const items = postsData?.data?.videos || postsData?.videos || postsData?.itemList || postsData?.data?.itemList || [];

        if (!Array.isArray(items) || items.length === 0) break;

        for (const item of items) {
          const stats = item.stats || item.statistics || {};
          const createTime = typeof item.createTime === 'number'
            ? item.createTime * 1000
            : typeof item.create_time === 'number'
              ? item.create_time * 1000
              : Date.now();

          allPosts.push({
            likes: Number(stats.diggCount || stats.digg_count || stats.likeCount || stats.like_count || item.digg_count || 0),
            comments: Number(stats.commentCount || stats.comment_count || item.comment_count || 0),
            views: Number(stats.playCount || stats.play_count || item.play_count || 0),
            shares: Number(stats.shareCount || stats.share_count || item.share_count || 0),
            caption: typeof item.desc === 'string' ? item.desc : (item.title || undefined),
            postedAt: new Date(createTime),
          });
        }

        hasMore = Boolean(postsData.hasMore ?? postsData.has_more ?? (postsData.data?.hasMore));
        cursor = String(postsData.cursor || postsData.data?.cursor || Number(cursor) + 30);
        page++;
      } catch {
        break;
      }
    }

    return allPosts;
  }

  private async searchTikTokUsers(query: string): Promise<AccountCandidate[]> {
    const url = `https://${this.tiktokHost}/user/search?keywords=${encodeURIComponent(query)}&count=5`;
    const res = await this.rapidFetch(url, this.tiktokHost);
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    const users = data?.data?.user_list || data?.user_list || [];

    return users.slice(0, 5).map((u: any) => {
      const info = u.user_info || u;
      return {
        username: info.unique_id || info.uniqueId || '',
        displayName: info.nickname || info.nick_name || '',
        avatarUrl: info.avatar_medium || info.avatarMedium || undefined,
        followers: Number(info.follower_count || info.followerCount || 0),
        following: Number(info.following_count || info.followingCount || 0),
        verified: Boolean(info.verified),
        platform: 'TIKTOK' as const,
        profileUrl: `https://www.tiktok.com/@${info.unique_id || info.uniqueId}`,
        isExactMatch: (info.unique_id || info.uniqueId || '').toLowerCase() === query.toLowerCase(),
        source: 'LIVE_ONLINE' as const,
      };
    }).filter((c: AccountCandidate) => c.username);
  }

  // ─── Instagram ─────────────────────────────────────────────

  private async fetchInstagramAccount(username: string): Promise<NormalizedAccountData | null> {
    // Step 1: Get user info
    const infoUrl = `https://${this.instagramHost}/v1/info?username_or_id_or_url=${encodeURIComponent(username)}`;
    const infoRes = await this.rapidFetch(infoUrl, this.instagramHost);

    if (!infoRes.ok) {
      if (infoRes.status === 404) {
        const err = new Error(`ACCOUNT_NOT_FOUND: Akun Instagram @${username} tidak ditemukan.`);
        (err as any).isNotFound = true;
        throw err;
      }
      return null;
    }

    const infoData = (await infoRes.json()) as any;
    const user = infoData?.data || infoData;

    if (!user || infoData?.status === 'fail') {
      const err = new Error(`ACCOUNT_NOT_FOUND: Akun Instagram @${username} tidak ditemukan.`);
      (err as any).isNotFound = true;
      throw err;
    }

    const followers = Number(user.follower_count || user.followers || 0);
    const following = Number(user.following_count || user.following || 0);
    const postsCount = Number(user.media_count || user.posts_count || 0);
    const displayName = String(user.full_name || user.fullName || `@${username}`);
    const avatarUrl = typeof user.profile_pic_url === 'string'
      ? user.profile_pic_url
      : typeof user.profile_pic_url_hd === 'string'
        ? user.profile_pic_url_hd
        : undefined;
    const isPrivate = Boolean(user.is_private);
    const isVerified = Boolean(user.is_verified);

    let accountType = isVerified ? 'Verified Creator' : 'Creator (Public)';
    if (isPrivate) accountType = 'Private Account';

    // Step 2: Get user posts
    let posts: NormalizedAccountData['posts'] = [];

    if (!isPrivate) {
      posts = await this.fetchInstagramPosts(username, postsCount);
    }

    // Do not synthesize dummy posts if API returns no posts. Only return genuine posts.

    return {
      platform: 'INSTAGRAM',
      username,
      displayName,
      avatarUrl,
      profileUrl: `https://www.instagram.com/${username}/`,
      accountType,
      followers,
      following,
      postsCount,
      isPrivate,
      source: 'API',
      posts,
    };
  }

  private async fetchInstagramPosts(
    username: string,
    totalPosts: number
  ): Promise<NormalizedAccountData['posts']> {
    const allPosts: NormalizedAccountData['posts'] = [];
    let endCursor: string | null = null;
    const maxPages = Math.min(100, Math.ceil(totalPosts / 12));
    let page = 0;

    while (page < maxPages && allPosts.length < totalPosts) {
      let postsUrl = `https://${this.instagramHost}/v1.2/posts?username_or_id_or_url=${encodeURIComponent(username)}`;
      if (endCursor) {
        postsUrl += `&url_embed_safe=true&pagination_token=${encodeURIComponent(endCursor)}`;
      }

      try {
        const postsRes = await this.rapidFetch(postsUrl, this.instagramHost);
        if (!postsRes.ok) break;

        const postsData = (await postsRes.json()) as any;
        const items = postsData?.data?.items || postsData?.items || postsData?.data?.medias || [];

        if (!Array.isArray(items) || items.length === 0) break;

        for (const item of items) {
          const takenAt = typeof item.taken_at === 'number'
            ? item.taken_at * 1000
            : item.taken_at_timestamp
              ? Number(item.taken_at_timestamp) * 1000
              : Date.now();

          let contentType = 'FEED_POST';
          if (
            item.media_type === 8 ||
            (Array.isArray(item.carousel_media) && item.carousel_media.length > 0)
          ) {
            contentType = 'PHOTO_CAROUSEL';
          } else if (
            item.media_type === 2 ||
            item.product_type === 'clips' ||
            item.is_video ||
            (item.play_count && item.play_count > 0)
          ) {
            contentType = 'REELS';
          }

          const code = item.code || item.pk || '';
          const postUrl = code
            ? contentType === 'REELS'
              ? `https://www.instagram.com/reel/${code}/`
              : `https://www.instagram.com/p/${code}/`
            : undefined;

          allPosts.push({
            likes: Number(item.like_count || item.likes?.count || 0),
            comments: Number(item.comment_count || item.comments?.count || 0),
            views: Number(item.play_count || item.video_view_count || item.view_count || 0),
            shares: Number(item.share_count || 0),
            caption: item.caption?.text || (typeof item.caption === 'string' ? item.caption : undefined),
            postUrl,
            postedAt: new Date(takenAt),
            contentType,
          });
        }

        endCursor = postsData?.pagination_token || postsData?.data?.pagination_token || postsData?.next_max_id || null;
        if (!endCursor) break;
        page++;
      } catch {
        break;
      }
    }

    return allPosts;
  }

  private async searchInstagramUsers(query: string): Promise<AccountCandidate[]> {
    const url = `https://${this.instagramHost}/v1/search?search_query=${encodeURIComponent(query)}`;
    const res = await this.rapidFetch(url, this.instagramHost);
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    const users = data?.data?.items || data?.items || data?.users || [];

    return users.slice(0, 5).map((u: any) => {
      const info = u.user || u;
      return {
        username: info.username || '',
        displayName: info.full_name || info.fullName || '',
        avatarUrl: info.profile_pic_url || undefined,
        followers: Number(info.follower_count || 0),
        following: Number(info.following_count || 0),
        verified: Boolean(info.is_verified),
        platform: 'INSTAGRAM' as const,
        profileUrl: `https://www.instagram.com/${info.username}/`,
        isExactMatch: (info.username || '').toLowerCase() === query.toLowerCase(),
        source: 'LIVE_ONLINE' as const,
      };
    }).filter((c: AccountCandidate) => c.username);
  }

  // ─── Shared fetch helper ───────────────────────────────────

  private async rapidFetch(url: string, host: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      return await fetch(url, {
        headers: {
          'x-rapidapi-key': this.apiKey!,
          'x-rapidapi-host': host,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
