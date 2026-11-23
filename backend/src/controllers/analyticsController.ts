import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { AnalyticsEngine } from '../services/AnalyticsEngine.js';
import { RateCardCalculator } from '../services/RateCardCalculator.js';

export async function calculateAndSave(req: Request, res: Response) {
  try {
    const {
      accountId,
      formulaType,
      postLimit,
      manualFollowers,
      manualLikes,
      manualComments,
      manualViews,
      manualShares,
    } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required.' });
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        posts: {
          orderBy: { postedAt: 'desc' },
          ...(postLimit && postLimit !== 'all' ? { take: Number(postLimit) } : {}),
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const followers = manualFollowers ? Number(manualFollowers) : (account.snapshots[0]?.followers || 1);
    const chosenFormula = formulaType || (account.platform === 'INSTAGRAM' ? 'FOLLOWER_BASED' : 'VIEW_BASED');

    let calcResult;
    if (account.posts.length === 0 && (manualLikes !== undefined || manualViews !== undefined)) {
      const likes = Number(manualLikes) || 0;
      const comments = Number(manualComments) || 0;
      const views = Number(manualViews) || 0;
      const shares = Number(manualShares) || 0;

      let er = 0;
      if (chosenFormula === 'VIEW_BASED') {
        er = views > 0 ? Number((((likes + comments + shares) / views) * 100).toFixed(2)) : 0;
      } else {
        er = followers > 0 ? Number((((likes + comments + shares) / followers) * 100).toFixed(2)) : 0;
      }

      calcResult = {
        formulaType: chosenFormula,
        sampleSize: 1,
        averageLikes: likes,
        averageComments: comments,
        averageViews: views,
        averageShares: shares,
        engagementRate: er,
        isAnomalous: er > 100,
        anomalies: [],
      };
    } else if (account.posts.length === 0) {
      return res.status(400).json({ error: 'Akun belum memiliki data postingan publik. Silakan masukkan data rata-rata views/likes/komen untuk menghitung.' });
    } else if (chosenFormula === 'FOLLOWER_BASED') {
      calcResult = AnalyticsEngine.calculateFollowerBased(followers, account.posts);
    } else {
      calcResult = AnalyticsEngine.calculateViewBased(account.posts);
    }

    // If manualFollowers or manual post metrics are provided, persist them
    if (manualFollowers) {
      await prisma.accountSnapshot.create({
        data: {
          accountId: account.id,
          followers: Number(manualFollowers),
          following: account.snapshots[0]?.following || 0,
          postsCount: account.snapshots[0]?.postsCount || (account.posts.length > 0 ? account.posts.length : 1),
          source: 'MANUAL',
        },
      });
    }

    if (account.posts.length === 0 && (manualLikes !== undefined || manualViews !== undefined)) {
      await prisma.socialPost.create({
        data: {
          accountId: account.id,
          likes: Number(manualLikes) || 0,
          comments: Number(manualComments) || 0,
          views: Number(manualViews) || 0,
          shares: Number(manualShares) || 0,
          caption: 'Kalkulasi manual data performa Reels/VT',
          source: 'MANUAL',
          postedAt: new Date(),
        },
      });
    }

    const savedRun = await prisma.analysisRun.create({
      data: {
        accountId: account.id,
        formulaType: calcResult.formulaType,
        sampleSize: calcResult.sampleSize,
        averageLikes: calcResult.averageLikes,
        averageComments: calcResult.averageComments,
        averageViews: calcResult.averageViews,
        averageShares: calcResult.averageShares,
        engagementRate: calcResult.engagementRate,
        source: account.snapshots[0]?.source || 'MANUAL',
      },
    });

    const rateCard = RateCardCalculator.calculate(followers, calcResult.engagementRate);

    return res.json({
      run: savedRun,
      details: calcResult,
      rateCard,
      account: {
        id: account.id,
        username: account.username,
        platform: account.platform,
        displayName: account.displayName,
        followers,
      },
    });
  } catch (error: any) {
    console.error('calculateAndSave error:', error);
    return res.status(500).json({ error: error.message || 'Calculation failed' });
  }
}

export async function getDashboardKPI(req: Request, res: Response) {
  try {
    const [totalAccounts, instagramCount, tiktokCount, youtubeCount, facebookCount, totalAnalyses] = await Promise.all([
      prisma.socialAccount.count(),
      prisma.socialAccount.count({ where: { platform: 'INSTAGRAM' } }),
      prisma.socialAccount.count({ where: { platform: 'TIKTOK' } }),
      prisma.socialAccount.count({ where: { platform: 'YOUTUBE' } }),
      prisma.socialAccount.count({ where: { platform: 'FACEBOOK' } }),
      prisma.analysisRun.count(),
    ]);

    const allAnalyses = await prisma.analysisRun.findMany({
      select: { engagementRate: true },
    });

    const averageER = allAnalyses.length > 0
      ? Number((allAnalyses.reduce((acc, curr) => acc + curr.engagementRate, 0) / allAnalyses.length).toFixed(2))
      : 0;

    const recentAnalyses = await prisma.analysisRun.findMany({
      orderBy: { analyzedAt: 'desc' },
      take: 6,
      include: {
        account: {
          select: {
            username: true,
            platform: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json({
      totalAccounts,
      instagramCount,
      tiktokCount,
      youtubeCount,
      facebookCount,
      totalAnalyses,
      averageER,
      recentAnalyses,
    });
  } catch (error: any) {
    console.error('getDashboardKPI error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch KPI' });
  }
}

export async function getAllAnalyses(req: Request, res: Response) {
  try {
    const analyses = await prisma.analysisRun.findMany({
      orderBy: { analyzedAt: 'desc' },
      include: {
        account: {
          select: {
            id: true,
            username: true,
            platform: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json(analyses);
  } catch (error: any) {
    console.error('getAllAnalyses error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list analyses' });
  }
}

export async function calculateDeepAnalysis(req: Request, res: Response) {
  try {
    const { platform, username, followers, posts, accountId } = req.body;

    const allowed = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK'];
    if (!platform || !allowed.includes(String(platform).toUpperCase())) {
      return res.status(400).json({ error: 'Platform harus berupa INSTAGRAM, TIKTOK, YOUTUBE, atau FACEBOOK.' });
    }

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'Minimal 1 postingan dibutuhkan untuk kalkulasi analisis ER mendalam.' });
    }

    const followersCount = Number(followers) || 1;

    const result = await AnalyticsEngine.calculateComprehensiveAnalyticsAsync({
      platform,
      username,
      followers: followersCount,
      posts,
    });

    // Optionally persist analysis if accountId is passed
    if (accountId) {
      try {
        await prisma.analysisRun.create({
          data: {
            accountId,
            formulaType: result.formulaType,
            sampleSize: result.sampleSize,
            averageLikes: result.averageLikes,
            averageComments: result.averageComments,
            averageViews: result.averageViews,
            averageShares: result.totalShares / result.sampleSize,
            engagementRate: result.medianER,
            source: 'MANUAL_DEEP',
          },
        });
      } catch (err) {
        console.warn('Could not persist manual deep analysis run:', err);
      }
    }

    return res.json(result);
  } catch (error: any) {
    console.error('calculateDeepAnalysis error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghitung analisis statistik mendalam.' });
  }
}

/**
 * Delete a single analysis run by ID
 */
export async function deleteAnalysisRun(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'ID riwayat analisis diperlukan.' });
    }

    const run = await prisma.analysisRun.findUnique({
      where: { id },
    });

    if (!run) {
      return res.status(404).json({ error: 'Riwayat analisis tidak ditemukan.' });
    }

    await prisma.analysisRun.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Riwayat analisis berhasil dihapus.',
      deletedId: id,
    });
  } catch (error: any) {
    console.error('deleteAnalysisRun error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghapus riwayat analisis.' });
  }
}

/**
 * Clear all analysis runs with safety check
 */
export async function clearAnalysisHistory(req: Request, res: Response) {
  try {
    const { platform } = req.query;

    const where: any = {};
    if (platform && String(platform).toUpperCase() !== 'ALL') {
      where.account = { platform: String(platform).toUpperCase() };
    }

    const deleteResult = await prisma.analysisRun.deleteMany({
      where,
    });

    return res.json({
      success: true,
      message: `Berhasil membersihkan ${deleteResult.count} riwayat kalkulasi analisis.`,
      count: deleteResult.count,
    });
  } catch (error: any) {
    console.error('clearAnalysisHistory error:', error);
    return res.status(500).json({ error: error.message || 'Gagal membersihkan riwayat analisis.' });
  }
}


