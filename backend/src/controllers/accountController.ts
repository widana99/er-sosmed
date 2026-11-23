import { Request, Response } from 'express';
import { prisma } from '../db.js';
import {
  CompositeSocialDataProvider,
  AccountCandidate,
} from '../services/SocialDataProvider.js';
import { RapidApiProvider } from '../services/RapidApiProvider.js';
import { BrowserScraperProvider } from '../services/BrowserScraperProvider.js';
import { PublicScraperProvider } from '../services/PublicScraperProvider.js';
import { PythonScraperProvider } from '../services/PythonScraperProvider.js';
import { YouTubeScraperProvider } from '../services/YouTubeScraperProvider.js';
import { AnalyticsEngine } from '../services/AnalyticsEngine.js';
import { LinkResolverService } from '../services/LinkResolverService.js';
import { ContentNicheService } from '../services/ContentNicheService.js';
import { ExcelExportService } from '../services/ExcelExportService.js';
import ExcelJS from 'exceljs';

const compositeProvider = new CompositeSocialDataProvider(
  new RapidApiProvider(),
  new BrowserScraperProvider(),
  new PublicScraperProvider(),
  new PythonScraperProvider(),
  new YouTubeScraperProvider()
);

async function findOrCreateAccount(
  cleanPlatform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK',
  cleanUsername: string,
  city?: string,
  roleOrTitle?: string,
  forceRefresh = false
) {
  let account: any = await prisma.socialAccount.findUnique({
    where: {
      platform_username: {
        platform: cleanPlatform,
        username: cleanUsername,
      },
    },
    include: {
      snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
      analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
      posts: { orderBy: { postedAt: 'desc' } },
    },
  });

  if (account && (city || roleOrTitle)) {
    account = await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        ...(city ? { city: String(city).trim() } : {}),
        ...(roleOrTitle ? { roleOrTitle: String(roleOrTitle).trim() } : {}),
      },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        posts: { orderBy: { postedAt: 'desc' } },
      },
    });
  }

  // Refresh if stored posts are stale, missing, fewer than what the platform reports, or forceRefresh requested
  const storedPostCount = account?.posts?.length || 0;
  const storedSnapshotPostCount = account?.snapshots?.[0]?.postsCount || 0;
  const targetPostCount = storedSnapshotPostCount;
  const isStale = (Date.now() - new Date(account?.updatedAt || 0).getTime()) > 5 * 60 * 1000;
  const needsRefresh = account && (
    forceRefresh ||
    (storedSnapshotPostCount > 0 && storedPostCount === 0) ||
    account.analyses.length === 0 ||
    (storedSnapshotPostCount > 0 && storedPostCount < targetPostCount)
  );

  if (needsRefresh) {
    try {
      const fetched = await compositeProvider.getAccount(cleanUsername, cleanPlatform);
      if (fetched && fetched.posts.length > 0) {
        console.log(`[Refresh] @${cleanUsername}: ${storedPostCount} stored → ${fetched.posts.length} fetched (platform reports ${fetched.postsCount})`);
        await prisma.socialPost.deleteMany({ where: { accountId: account.id } });
        await prisma.analysisRun.deleteMany({ where: { accountId: account.id } });

        // Update snapshot with latest stats
        await prisma.accountSnapshot.create({
          data: {
            accountId: account.id,
            followers: fetched.followers,
            following: fetched.following,
            postsCount: fetched.postsCount,
            source: fetched.source || 'API',
          },
        });

        await prisma.socialPost.createMany({
          data: fetched.posts.map((p) => ({
            accountId: account.id,
            caption: p.caption || '',
            postUrl: p.postUrl || null,
            postedAt: p.postedAt || new Date(),
            likes: p.likes || 0,
            comments: p.comments || 0,
            views: p.views !== undefined && p.views !== null ? p.views : null,
            shares: p.shares !== undefined && p.shares !== null ? p.shares : null,
            contentType: (p as any).contentType || (cleanPlatform === 'INSTAGRAM' ? ((p.views && p.views > 0) ? 'REELS' : 'FEED_POST') : (cleanPlatform === 'YOUTUBE' ? 'LONG_VIDEO' : 'VIDEO')),
            source: fetched.source || 'API',
          })),
        });

        const followers = fetched.followers || account.snapshots?.[0]?.followers || 1;
        const initialCalc = AnalyticsEngine.calculateAuto(cleanPlatform, followers, fetched.posts);

        await prisma.analysisRun.create({
          data: {
            accountId: account.id,
            formulaType: initialCalc.formulaType,
            sampleSize: initialCalc.sampleSize,
            averageLikes: initialCalc.averageLikes,
            averageComments: initialCalc.averageComments,
            averageViews: initialCalc.averageViews,
            averageShares: initialCalc.averageShares,
            engagementRate: initialCalc.engagementRate,
            source: fetched.source || 'API',
          },
        });

        const updateData: any = {};
        if (fetched?.city && (!account.city || account.city === 'Nasional')) {
          updateData.city = fetched.city;
          account.city = fetched.city;
        }
        if (fetched?.joinedText && !(account as any).joinedText) {
          updateData.joinedText = fetched.joinedText;
          (account as any).joinedText = fetched.joinedText;
        }
        if (Object.keys(updateData).length > 0) {
          await prisma.socialAccount.update({
            where: { id: account.id },
            data: updateData,
          });
        }

        account = await prisma.socialAccount.findUnique({
          where: { id: account.id },
          include: {
            snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
            analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
            posts: { orderBy: { postedAt: 'desc' } },
          },
        });
      }
    } catch {
      // Continue with existing record
    }
  }

  let isSimulated = false;

  if (!account) {
    let fetchedData = null;
    try {
      fetchedData = await compositeProvider.getAccount(cleanUsername, cleanPlatform);
    } catch (err: any) {
      if (err?.isNotFound) {
        return { account: null, isNotFound: true, isSimulated: false, source: 'NOT_FOUND' };
      }
      throw err;
    }

    if (!fetchedData) {
      return { account: null, isNotFound: true, isSimulated: false, source: 'NOT_FOUND' };
    }

    const dataSource = fetchedData.source || 'API';
    isSimulated = false;

    const postsToCreate = fetchedData.posts || [];

    account = await prisma.socialAccount.create({
      data: {
        platform: cleanPlatform,
        username: cleanUsername,
        displayName: fetchedData.displayName,
        avatarUrl: fetchedData.avatarUrl,
        profileUrl: fetchedData.profileUrl || ExcelExportService.buildProfileUrl(cleanPlatform, cleanUsername),
        accountType: fetchedData.accountType,
        city: city ? String(city).trim() : (fetchedData.city || 'Nasional'),
        roleOrTitle: roleOrTitle ? String(roleOrTitle).trim() : 'Jubir',
        joinedText: fetchedData.joinedText || null,
        snapshots: {
          create: {
            followers: fetchedData.followers,
            following: fetchedData.following,
            postsCount: fetchedData.postsCount,
            source: dataSource,
          },
        },
        posts: {
          create: postsToCreate.map((p) => ({
            caption: p.caption || '',
            postUrl: p.postUrl || null,
            postedAt: p.postedAt || new Date(),
            likes: p.likes || 0,
            comments: p.comments || 0,
            views: p.views !== undefined && p.views !== null ? p.views : null,
            shares: p.shares !== undefined && p.shares !== null ? p.shares : null,
            saves: p.saves !== undefined && p.saves !== null ? p.saves : null,
            reach: p.reach !== undefined && p.reach !== null ? p.reach : null,
            contentType: (p as any).contentType || (cleanPlatform === 'INSTAGRAM' ? ((p.views && p.views > 0) ? 'REELS' : 'FEED_POST') : (cleanPlatform === 'YOUTUBE' ? 'LONG_VIDEO' : 'VIDEO')),
            source: dataSource,
          })),
        },
      },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        posts: { orderBy: { postedAt: 'desc' } },
      },
    });

    if (postsToCreate.length > 0) {
      const followers = fetchedData.followers || 1;
      const initialCalc = AnalyticsEngine.calculateAuto(cleanPlatform, followers, postsToCreate);

      const initialAnalysis = await prisma.analysisRun.create({
        data: {
          accountId: account.id,
          formulaType: initialCalc.formulaType,
          sampleSize: initialCalc.sampleSize,
          averageLikes: initialCalc.averageLikes,
          averageComments: initialCalc.averageComments,
          averageViews: initialCalc.averageViews,
          averageShares: initialCalc.averageShares,
          engagementRate: initialCalc.engagementRate,
          source: dataSource,
        },
      });

      (account as any).analyses = [initialAnalysis];
    }
  }

  const isAccountPrivate =
    account?.accountType === 'Private Account' ||
    account?.accountType?.toLowerCase().includes('private') ||
    Boolean(account?.isPrivate);

  if (account && account.posts && account.posts.length > 0) {
    const followers = account.snapshots?.[0]?.followers || 1;
    try {
      const comprehensive = await AnalyticsEngine.calculateComprehensiveAnalyticsAsync({
        platform: account.platform,
        username: account.username,
        followers,
        posts: account.posts,
      });
      (account as any).deepAnalysis = comprehensive;
    } catch (calcErr) {
      console.warn('Could not calculate comprehensive deep analysis for account:', calcErr);
    }
  }

  if (account) {
    (account as any).isPrivate = isAccountPrivate;
  }

  const source = (account as any)?.snapshots?.[0]?.source || 'CACHED';
  return { account, isNotFound: false, isSimulated: false, source };
}

export async function searchAccount(req: Request, res: Response) {
  try {
    const { platform, username, city, roleOrTitle } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username atau link akun wajib diisi.' });
    }

    let cleanUsername = String(username).replace(/^@/, '').toLowerCase().trim();
    let cleanPlatform = platform ? String(platform).toUpperCase() : 'TIKTOK';
    let wasLink = false;
    let resolvedUrl: string | undefined;

    // Detect if input is a shared URL
    if (LinkResolverService.isShareLink(username)) {
      try {
        const resolved = await LinkResolverService.resolveLink(username);
        cleanUsername = resolved.username;
        cleanPlatform = resolved.platform;
        wasLink = true;
        resolvedUrl = resolved.resolvedUrl;
      } catch (linkErr: any) {
        return res.status(400).json({ error: linkErr.message || 'Gagal memproses tautan yang dibagikan.' });
      }
    }

    if (cleanPlatform !== 'INSTAGRAM' && cleanPlatform !== 'TIKTOK' && cleanPlatform !== 'YOUTUBE' && cleanPlatform !== 'FACEBOOK') {
      return res.status(400).json({ error: 'Platform harus berupa INSTAGRAM, TIKTOK, YOUTUBE, atau FACEBOOK.' });
    }

    const forceRefresh =
      req.query.refresh === 'true' || req.body?.refresh === true || req.body?.forceRefresh === true;

    // Parallel fetch for: 1. Main account, 2. Live candidates, 3. DB matching candidates
    const [accountResult, liveCandidates, dbCandidates] = await Promise.all([
      findOrCreateAccount(
        cleanPlatform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK',
        cleanUsername,
        city,
        roleOrTitle,
        forceRefresh
      ),
      compositeProvider
        .getCandidates(cleanUsername, cleanPlatform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE')
        .catch(() => [] as AccountCandidate[]),
      prisma.socialAccount
        .findMany({
          where: {
            platform: cleanPlatform,
            OR: [
              { username: { contains: cleanUsername } },
              { displayName: { contains: cleanUsername } },
            ],
          },
          take: 6,
          include: {
            snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
          },
        })
        .catch(() => [] as any[]),
    ]);

    // Build unique candidates map
    const candidateMap = new Map<string, AccountCandidate>();

    // 1. Add DB candidates
    for (const dbAcc of (dbCandidates as any[])) {
      const u = dbAcc.username.toLowerCase();
      let defaultProfileUrl = `https://www.instagram.com/${dbAcc.username}`;
      if (dbAcc.platform === 'YOUTUBE') defaultProfileUrl = `https://www.youtube.com/@${dbAcc.username}`;
      else if (dbAcc.platform === 'TIKTOK') defaultProfileUrl = `https://www.tiktok.com/@${dbAcc.username}`;
      else if (dbAcc.platform === 'FACEBOOK') defaultProfileUrl = `https://www.facebook.com/${dbAcc.username}`;

      candidateMap.set(u, {
        username: dbAcc.username,
        displayName: dbAcc.displayName || `@${dbAcc.username}`,
        avatarUrl: dbAcc.avatarUrl || undefined,
        followers: dbAcc.snapshots?.[0]?.followers || 0,
        following: dbAcc.snapshots?.[0]?.following || 0,
        platform: dbAcc.platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK',
        profileUrl: dbAcc.profileUrl || defaultProfileUrl,
        isExactMatch: u === cleanUsername,
        source: 'DATABASE',
      });
    }

    // 2. Add Live Candidates from preview
    for (const live of liveCandidates) {
      const u = live.username.toLowerCase();
      candidateMap.set(u, {
        ...live,
        isExactMatch: u === cleanUsername,
      });
    }

    const candidates = Array.from(candidateMap.values());
    const { account, isNotFound, isSimulated, source } = accountResult;

    // Log to search history
    await prisma.searchHistory.create({
      data: {
        platform: cleanPlatform,
        username: cleanUsername,
        resultStatus: account ? 'FOUND' : 'NOT_FOUND',
      },
    });

    if (!account) {
      let fallbackProfileUrl = `https://www.instagram.com/${cleanUsername}`;
      if (cleanPlatform === 'YOUTUBE') fallbackProfileUrl = `https://www.youtube.com/@${cleanUsername}`;
      else if (cleanPlatform === 'TIKTOK') fallbackProfileUrl = `https://www.tiktok.com/@${cleanUsername}`;
      else if (cleanPlatform === 'FACEBOOK') fallbackProfileUrl = `https://www.facebook.com/${cleanUsername}`;

      return res.status(200).json({
        account: null,
        candidates,
        isNotFound: true,
        message: `Akun ${cleanPlatform} @${cleanUsername} tidak ditemukan secara langsung. Silakan pilih dari akun serupa di bawah atau tempel tautan profil (share link).`,
        profileUrl: fallbackProfileUrl,
        canPasteLink: true,
      });
    }

    const isPrivate =
      account.accountType === 'Private Account' ||
      account.accountType?.toLowerCase().includes('private');
    (account as any).isPrivate = isPrivate;

    // Decorate posts with individual content niche and calculate account-level niche breakdown
    const followers = account.snapshots?.[0]?.followers || 1;
    const decoratedPosts = ContentNicheService.decoratePosts(account.posts || [], account.platform, followers);
    const nicheAnalysis = ContentNicheService.classifyAccount(
      account.username,
      account.displayName || '',
      (account as any).biography || '',
      decoratedPosts
    );

    account.posts = decoratedPosts;
    (account as any).primaryNiche = nicheAnalysis.primaryNiche;
    (account as any).nicheBreakdown = nicheAnalysis.nicheBreakdown;

    // Also update roleOrTitle if it's default 'Jubir'
    if (!account.roleOrTitle || account.roleOrTitle === 'Jubir') {
      account.roleOrTitle = nicheAnalysis.primaryNiche;
    }

    return res.json({
      account,
      candidates,
      source,
      isSimulated,
      resolvedLink: wasLink ? { originalUrl: username, resolvedUrl } : null,
    });
  } catch (error: any) {
    console.error('searchAccount error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function resolveAccountLink(req: Request, res: Response) {
  try {
    const { link } = req.body;
    if (!link || typeof link !== 'string') {
      return res.status(400).json({ error: 'Tautan profil atau share link wajib diisi.' });
    }

    const resolved = await LinkResolverService.resolveLink(link);
    const { platform, username } = resolved;

    const forceRefresh =
      req.query.refresh === 'true' || req.body?.refresh === true || req.body?.forceRefresh === true;

    const { account, isNotFound, isSimulated, source } = await findOrCreateAccount(
      platform,
      username,
      undefined,
      undefined,
      forceRefresh
    );

    if (!account || isNotFound) {
      return res.status(404).json({
        error: `Akun @${username} dari link tersebut tidak ditemukan atau belum memiliki profil publik.`,
        resolved,
      });
    }

    return res.json({
      account,
      source,
      isSimulated,
      resolved,
    });
  } catch (err: any) {
    console.error('resolveAccountLink error:', err);
    return res.status(400).json({ error: err.message || 'Gagal mengurai tautan.' });
  }
}

export async function listAccounts(req: Request, res: Response) {
  try {
    const { platform } = req.query;
    const where: any = {};
    if (platform && typeof platform === 'string') {
      where.platform = platform.toUpperCase();
    }

    const accounts = await prisma.socialAccount.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        _count: { select: { posts: true } },
      },
    });

    return res.json(accounts);
  } catch (error: any) {
    console.error('listAccounts error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list accounts' });
  }
}

export async function getAccountDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { year, month, startDate, endDate, contentType } = req.query as {
      year?: string;
      month?: string;
      startDate?: string;
      endDate?: string;
      contentType?: string;
    };

    const account = await prisma.socialAccount.findUnique({
      where: { id },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' } },
        analyses: { orderBy: { analyzedAt: 'desc' } },
        posts: { orderBy: { postedAt: 'desc' } },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const isPrivate =
      account.accountType === 'Private Account' ||
      account.accountType?.toLowerCase().includes('private');

    (account as any).isPrivate = isPrivate;

    if (!isPrivate && account.posts && account.posts.length > 0) {
      const followers = account.snapshots?.[0]?.followers || 1;
      const decoratedPosts = ContentNicheService.decoratePosts(account.posts || [], account.platform, followers);
      const nicheAnalysis = ContentNicheService.classifyAccount(
        account.username,
        account.displayName || '',
        (account as any).biography || '',
        decoratedPosts
      );

      account.posts = decoratedPosts;
      (account as any).primaryNiche = nicheAnalysis.primaryNiche;
      (account as any).nicheBreakdown = nicheAnalysis.nicheBreakdown;

      if (!account.roleOrTitle || account.roleOrTitle === 'Jubir') {
        account.roleOrTitle = nicheAnalysis.primaryNiche;
      }

      try {
        const comprehensive = await AnalyticsEngine.calculateComprehensiveAnalyticsAsync({
          platform: account.platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK',
          username: account.username,
          followers,
          posts: decoratedPosts,
          filterYear: year,
          filterMonth: month,
          startDate,
          endDate,
          contentType,
        });
        (account as any).deepAnalysis = comprehensive;
      } catch (calcErr) {
        console.warn('Could not calculate comprehensive deep analysis for account detail:', calcErr);
      }
    }

    return res.json(account);
  } catch (error: any) {
    console.error('getAccountDetail error:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve account detail' });
  }
}

export async function addPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { likes, comments, views, shares, saves, reach, caption, postUrl, postedAt } = req.body;

    if (likes === undefined || comments === undefined) {
      return res.status(400).json({ error: 'Likes and comments are required.' });
    }

    const post = await prisma.socialPost.create({
      data: {
        accountId: id,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        views: views !== undefined && views !== null ? Number(views) : null,
        shares: shares !== undefined && shares !== null ? Number(shares) : null,
        saves: saves !== undefined && saves !== null ? Number(saves) : null,
        reach: reach !== undefined && reach !== null ? Number(reach) : null,
        caption: caption || '',
        postUrl: postUrl || '',
        postedAt: postedAt ? new Date(postedAt) : new Date(),
        source: 'MANUAL',
      },
    });

    return res.status(201).json(post);
  } catch (error: any) {
    console.error('addPost error:', error);
    return res.status(500).json({ error: error.message || 'Failed to add post' });
  }
}

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const { city, platform, sortBy = 'ER' } = req.query;

    const where: any = {};
    if (city && city !== 'ALL') {
      where.city = String(city);
    }
    if (platform && platform !== 'ALL') {
      where.platform = String(platform).toUpperCase();
    }

    const accounts = await prisma.socialAccount.findMany({
      where,
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        posts: { orderBy: { postedAt: 'desc' }, take: 10 },
      },
    });

    const allDbAccounts = await prisma.socialAccount.findMany({
      select: { city: true },
    });
    const defaultCities = ['Nasional', 'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Denpasar', 'Yogyakarta'];
    const dbCities = allDbAccounts.map((a) => a.city).filter(Boolean) as string[];
    const availableCities = Array.from(new Set([...defaultCities, ...dbCities]));

    const mapped = accounts.map((acc) => {
      const latestSnapshot = acc.snapshots[0];
      const latestAnalysis = acc.analyses[0];
      const posts = acc.posts;

      const followers = latestSnapshot?.followers || 0;
      const following = latestSnapshot?.following || 0;
      const postsCount = latestSnapshot?.postsCount || posts.length;

      let avgLikes = latestAnalysis?.averageLikes || 0;
      let avgComments = latestAnalysis?.averageComments || 0;
      let avgViews = latestAnalysis?.averageViews || 0;
      let avgShares = latestAnalysis?.averageShares || 0;

      if (!latestAnalysis && posts.length > 0) {
        avgLikes = Math.round(posts.reduce((s, p) => s + (p.likes || 0), 0) / posts.length);
        avgComments = Math.round(posts.reduce((s, p) => s + (p.comments || 0), 0) / posts.length);
        avgViews = Math.round(posts.reduce((s, p) => s + (p.views || 0), 0) / posts.length);
        avgShares = Math.round(posts.reduce((s, p) => s + (p.shares || 0), 0) / posts.length);
      }

      let er = latestAnalysis?.engagementRate || 0;
      if (!latestAnalysis && followers > 0 && posts.length > 0) {
        if ((acc.platform === 'TIKTOK' || acc.platform === 'YOUTUBE') && avgViews > 0) {
          er = Number((((avgLikes + avgComments + avgShares) / avgViews) * 100).toFixed(2));
        } else {
          er = Number((((avgLikes + avgComments + avgShares) / followers) * 100).toFixed(2));
        }
      }

      let tier = 'Average';
      if (er >= 5) tier = 'High Interactivity';
      else if (er >= 2.5) tier = 'Good';
      else if (er >= 1) tier = 'Average';
      else tier = 'Low';

      return {
        id: acc.id,
        username: acc.username,
        displayName: acc.displayName || `@${acc.username}`,
        avatarUrl: acc.avatarUrl,
        profileUrl: acc.profileUrl,
        platform: acc.platform,
        accountType: acc.accountType,
        city: acc.city || 'Nasional',
        roleOrTitle: acc.roleOrTitle || 'Jubir',
        followers,
        following,
        postsCount,
        engagementRate: er,
        formulaType: latestAnalysis?.formulaType || ((acc.platform === 'TIKTOK' || acc.platform === 'YOUTUBE') ? 'VIEW_BASED' : 'FOLLOWER_BASED'),
        averageLikes: avgLikes,
        averageComments: avgComments,
        averageViews: avgViews,
        averageShares: avgShares,
        sampleSize: latestAnalysis?.sampleSize || posts.length,
        tier,
        analyzedAt: latestAnalysis?.analyzedAt || acc.updatedAt,
      };
    });

    mapped.sort((a, b) => {
      if (sortBy === 'VIEWS') return b.averageViews - a.averageViews;
      if (sortBy === 'FOLLOWERS') return b.followers - a.followers;
      if (sortBy === 'LIKES') return b.averageLikes - a.averageLikes;
      return b.engagementRate - a.engagementRate;
    });

    const ranked = mapped.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    const totalJubir = ranked.length;
    const totalReach = ranked.reduce((acc, j) => acc + j.followers, 0);
    const totalViews = ranked.reduce((acc, j) => acc + j.averageViews, 0);
    const averageEr = totalJubir > 0 ? Number((ranked.reduce((acc, j) => acc + j.engagementRate, 0) / totalJubir).toFixed(2)) : 0;

    return res.json({
      leaderboard: ranked,
      stats: {
        totalJubir,
        totalReach,
        totalViews,
        averageEr,
        filterCity: city || 'ALL',
        filterPlatform: platform || 'ALL',
      },
      availableCities,
    });
  } catch (error: any) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' });
  }
}

export async function updateJubirProfile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { city, roleOrTitle } = req.body;

    const updated = await prisma.socialAccount.update({
      where: { id },
      data: {
        ...(city ? { city: String(city).trim() } : {}),
        ...(roleOrTitle ? { roleOrTitle: String(roleOrTitle).trim() } : {}),
      },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('updateJubirProfile error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update jubir profile' });
  }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Account ID is required.' });
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id },
      select: { id: true, username: true, platform: true, displayName: true },
    });

    if (!account) {
      return res.status(404).json({ error: 'Akun / Jubir tidak ditemukan.' });
    }

    // Cascade delete account, snapshots, posts, analyses
    await prisma.socialAccount.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: `Akun @${account.username} (${account.platform}) berhasil dihapus permanen.`,
      deletedAccount: account,
    });
  } catch (error: any) {
    console.error('deleteAccount error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghapus akun.' });
  }
}

export async function batchAnalyzeAccounts(req: Request, res: Response) {
  try {
    const { platform = 'AUTO', targets = [], forceRefresh = false } = req.body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: 'Daftar akun (targets) minimal berisi 1 akun.' });
    }

    // Support larger batches (up to 1,000 accounts per batch call)
    const limitedTargets = targets.slice(0, 1000);
    const results: any[] = [];

    for (let i = 0; i < limitedTargets.length; i++) {
      const rawTarget = limitedTargets[i];
      let targetInput = typeof rawTarget === 'string' ? rawTarget.trim() : rawTarget?.username?.trim();
      let targetPlatform = typeof rawTarget === 'object' && rawTarget?.platform
        ? rawTarget.platform.toUpperCase()
        : platform.toUpperCase();
      let targetCity = typeof rawTarget === 'object' ? rawTarget.city : undefined;
      let targetRole = typeof rawTarget === 'object' ? rawTarget.roleOrTitle : undefined;

      if (!targetInput) continue;

      let cleanUsername = targetInput.replace(/^@/, '').toLowerCase().trim();

      // Detect if input is a shared URL
      if (LinkResolverService.isShareLink(targetInput)) {
        try {
          const resolved = await LinkResolverService.resolveLink(targetInput);
          cleanUsername = resolved.username;
          targetPlatform = resolved.platform;
        } catch {
          results.push({
            input: targetInput,
            status: 'ERROR',
            error: 'Gagal mengurai tautan akun yang dibagikan.',
          });
          continue;
        }
      }

      // Default platform if AUTO or invalid
      if (targetPlatform !== 'INSTAGRAM' && targetPlatform !== 'TIKTOK' && targetPlatform !== 'YOUTUBE' && targetPlatform !== 'FACEBOOK') {
        targetPlatform = 'TIKTOK';
      }

      let itemSource = 'LIVE';
      try {
        const { account, isNotFound, source } = await findOrCreateAccount(
          targetPlatform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK',
          cleanUsername,
          targetCity,
          targetRole,
          forceRefresh
        );
        itemSource = source || 'LIVE';

        if (!account || isNotFound) {
          results.push({
            input: targetInput,
            username: cleanUsername,
            platform: targetPlatform,
            status: 'NOT_FOUND',
            error: `Akun @${cleanUsername} di ${targetPlatform} tidak ditemukan atau disetel privat.`,
          });
          continue;
        }

        const totalPosts = account.snapshots?.[0]?.postsCount || 0;
        const analyzedPosts = account.posts?.length || account.analyses?.[0]?.sampleSize || 0;
        const isComplete = analyzedPosts >= totalPosts && totalPosts > 0;
        const isRestricted = totalPosts > 0 && analyzedPosts === 0;

        const followers = account.snapshots?.[0]?.followers || 1;
        const decoratedPosts = ContentNicheService.decoratePosts(account.posts || [], account.platform, followers);
        const nicheAnalysis = ContentNicheService.classifyAccount(
          account.username,
          account.displayName || '',
          (account as any).biography || '',
          decoratedPosts
        );
        account.posts = decoratedPosts;
        (account as any).primaryNiche = nicheAnalysis.primaryNiche;
        (account as any).nicheBreakdown = nicheAnalysis.nicheBreakdown;

        if (!account.roleOrTitle || account.roleOrTitle === 'Jubir') {
          account.roleOrTitle = nicheAnalysis.primaryNiche;
        }

        const canonicalProfileUrl =
          account.profileUrl || ExcelExportService.buildProfileUrl(account.platform, account.username);
        if (!account.profileUrl) {
          account.profileUrl = canonicalProfileUrl;
        }

        results.push({
          input: targetInput,
          username: account.username,
          displayName: account.displayName,
          avatarUrl: account.avatarUrl,
          platform: account.platform,
          profileUrl: canonicalProfileUrl,
          city: account.city,
          roleOrTitle: account.roleOrTitle,
          contentNiche: nicheAnalysis.primaryNiche,
          nicheBreakdown: nicheAnalysis.nicheBreakdown,
          status: isRestricted ? 'RESTRICTED' : 'SUCCESS',
          source,
          account,
          deepAnalysis: (account as any).deepAnalysis,
          verification: {
            isComplete,
            isRestricted,
            totalPosts,
            analyzedPosts,
            coveragePercent: totalPosts > 0 ? Number(((analyzedPosts / totalPosts) * 100).toFixed(1)) : 100,
          },
        });
      } catch (itemErr: any) {
        results.push({
          input: targetInput,
          username: cleanUsername,
          platform: targetPlatform,
          status: 'ERROR',
          error: itemErr.message || 'Gagal memproses akun.',
        });
      }

      // Controlled polite pause between iterations (only when real web requests are made)
      if (i < limitedTargets.length - 1 && itemSource !== 'CACHED' && itemSource !== 'DATABASE') {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    return res.json({
      total: limitedTargets.length,
      successCount: results.filter((r) => r.status === 'SUCCESS' || r.status === 'RESTRICTED').length,
      failedCount: results.filter((r) => r.status === 'NOT_FOUND' || r.status === 'ERROR').length,
      results,
    });
  } catch (error: any) {
    console.error('batchAnalyzeAccounts error:', error);
    return res.status(500).json({ error: error.message || 'Batch scraping failed.' });
  }
}

/**
 * Extracts social profile links or handles from an uploaded Excel (.xlsx/.xls) file.
 * Scans all worksheets, rows, cells, and hyperlinks.
 */
export async function extractLinksFromFile(req: Request, res: Response) {
  try {
    const { fileBase64, fileName = 'upload.xlsx' } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'Data fileBase64 wajib disertakan.' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const extractedUrlsOrHandles: string[] = [];
    const columnSpecificUsernames: string[] = [];
    const seen = new Set<string>();

    const accountHeaderRegex = /(akun|username|handle|link|url|profil|profile|tiktok|ig|instagram|youtube|yt|facebook|fb)/i;
    const nonAccountHeaderRegex = /^(no|nomor|name|nama|role|jabatan|city|kota|no\.|kategori|category|er|followers|likes|views|komentar|comments)$/i;

    workbook.eachSheet((worksheet) => {
      // Step 1: Detect which column indices correspond to account/username/link
      const accountColIndices = new Set<number>();
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const val = String(cell.text || '').trim();
        if (accountHeaderRegex.test(val) && !nonAccountHeaderRegex.test(val)) {
          accountColIndices.add(colNumber);
        }
      });

      // Step 2: Iterate over rows
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        // Skip header row if it contains headers
        if (rowNumber === 1 && accountColIndices.size > 0) return;

        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          // Check hyperlink objects
          let hyperlinkUrl: string | undefined = undefined;
          if (cell.value && typeof cell.value === 'object') {
            if ('hyperlink' in cell.value && typeof (cell.value as any).hyperlink === 'string') {
              hyperlinkUrl = (cell.value as any).hyperlink.trim();
            }
          }

          if (hyperlinkUrl && (hyperlinkUrl.startsWith('http://') || hyperlinkUrl.startsWith('https://'))) {
            if (!seen.has(hyperlinkUrl)) {
              seen.add(hyperlinkUrl);
              extractedUrlsOrHandles.push(hyperlinkUrl);
            }
          }

          // Check cell text for URLs or @handles
          const rawText = String(cell.text || '').trim();
          if (!rawText) return;

          const urlMatch = rawText.match(/(https?:\/\/[^\s<>"']+)/i);
          if (urlMatch) {
            const url = urlMatch[1];
            if (!seen.has(url)) {
              seen.add(url);
              extractedUrlsOrHandles.push(url);
            }
            return;
          }

          if (rawText.startsWith('@')) {
            if (!seen.has(rawText)) {
              seen.add(rawText);
              extractedUrlsOrHandles.push(rawText);
            }
            return;
          }

          // If this column was identified as an account/username column:
          if (accountColIndices.has(colNumber)) {
            const clean = rawText.replace(/^@/, '').trim();
            if (/^[a-zA-Z0-9._]{3,35}$/.test(clean) && !nonAccountHeaderRegex.test(clean)) {
              if (!seen.has(clean)) {
                seen.add(clean);
                columnSpecificUsernames.push(clean);
              }
            }
          }
        });
      });
    });

    // If URLs or @handles were found, use them as primary; otherwise fallback to column-specific usernames
    const extractedLinks = extractedUrlsOrHandles.length > 0
      ? extractedUrlsOrHandles
      : columnSpecificUsernames;

    const detectedPlatforms = {
      tiktok: extractedLinks.filter((l) => l.includes('tiktok.com')).length,
      instagram: extractedLinks.filter((l) => l.includes('instagram.com')).length,
      youtube: extractedLinks.filter((l) => l.includes('youtube.com') || l.includes('youtu.be')).length,
      facebook: extractedLinks.filter((l) => l.includes('facebook.com') || l.includes('fb.com') || l.includes('fb.watch')).length,
    };

    return res.json({
      success: true,
      fileName,
      count: extractedLinks.length,
      links: extractedLinks,
      detectedPlatforms,
    });
  } catch (error: any) {
    console.error('extractLinksFromFile error:', error);
    return res.status(500).json({ error: error.message || 'Gagal memproses file Excel.' });
  }
}
