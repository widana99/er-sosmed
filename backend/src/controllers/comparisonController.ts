import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { AnalyticsEngine } from '../services/AnalyticsEngine.js';

export async function compareAccounts(req: Request, res: Response) {
  try {
    const { accountIds } = req.body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 accountIds are required for comparison.' });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds } },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        posts: { orderBy: { postedAt: 'desc' }, take: 10 },
      },
    });

    const comparisonData = accounts.map((acc) => {
      const followers = acc.snapshots[0]?.followers || 0;
      let calc;
      if (acc.posts.length > 0) {
        calc = AnalyticsEngine.calculateAuto(acc.platform as any, followers || 1, acc.posts);
      }

      return {
        id: acc.id,
        username: acc.username,
        platform: acc.platform,
        displayName: acc.displayName,
        avatarUrl: acc.avatarUrl,
        followers,
        sampleSize: acc.posts.length,
        averageLikes: calc?.averageLikes ?? (acc.analyses[0]?.averageLikes || 0),
        averageComments: calc?.averageComments ?? (acc.analyses[0]?.averageComments || 0),
        averageViews: calc?.averageViews ?? (acc.analyses[0]?.averageViews || 0),
        engagementRate: calc?.engagementRate ?? (acc.analyses[0]?.engagementRate || 0),
        formulaType: calc?.formulaType ?? (acc.analyses[0]?.formulaType || 'FOLLOWER_BASED'),
        source: acc.snapshots[0]?.source || 'MANUAL',
      };
    });

    return res.json({ comparison: comparisonData });
  } catch (error: any) {
    console.error('compareAccounts error:', error);
    return res.status(500).json({ error: error.message || 'Comparison failed' });
  }
}
