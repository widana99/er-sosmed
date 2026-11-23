import { Request, Response } from 'express';
import { prisma } from '../db.js';

const DEFAULT_CATEGORIES = [
  'Politik & Pemerintahan',
  'KOL & Kreator',
  'Bisnis & Brand',
  'Edukasi & Riset',
  'Kuliner & Lifestyle',
  'Hiburan & Media',
  'Umum',
];

/**
 * Create a new Batch Group with all scraped accounts
 */
export async function createBatchGroup(req: Request, res: Response) {
  try {
    const {
      name,
      category = 'Umum',
      platform = 'ALL',
      items = [],
      metadata,
    } = req.body;

    const groupName = (name && String(name).trim()) || `Batch Scraper - ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    const groupCategory = (category && String(category).trim()) || 'Umum';

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data akun (items) minimal berisi 1 akun untuk disimpan sebagai grup.' });
    }

    let successCount = 0;
    let failCount = 0;
    let totalFollowers = 0;
    let sumER = 0;

    const processedItems = items.map((it: any) => {
      const isSuccess = it.status === 'SUCCESS' || it.status === 'RESTRICTED';
      if (isSuccess) {
        successCount++;
        const followers = Number(it.followers || it.account?.snapshots?.[0]?.followers || 0);
        totalFollowers += followers;

        const er = Number(
          it.engagementRate ??
          it.deepAnalysis?.medianER ??
          it.account?.analyses?.[0]?.engagementRate ??
          0
        );
        sumER += er;
      } else {
        failCount++;
      }

      return {
        accountId: it.account?.id || it.accountId || null,
        username: String(it.username || it.input || '').replace(/^@/, '').trim(),
        displayName: it.displayName || it.account?.displayName || null,
        avatarUrl: it.avatarUrl || it.account?.avatarUrl || null,
        platform: String(it.platform || 'TIKTOK').toUpperCase(),
        status: it.status || 'SUCCESS',
        followers: Number(it.followers || it.account?.snapshots?.[0]?.followers || 0),
        following: Number(it.following || it.account?.snapshots?.[0]?.following || 0),
        postsCount: Number(it.postsCount || it.account?.snapshots?.[0]?.postsCount || 0),
        analyzedPosts: Number(
          it.verification?.analyzedPosts ||
          it.deepAnalysis?.sampleSize ||
          it.account?.analyses?.[0]?.sampleSize ||
          0
        ),
        averageLikes: Number(it.averageLikes || it.deepAnalysis?.averageLikes || it.account?.analyses?.[0]?.averageLikes || 0),
        averageComments: Number(it.averageComments || it.deepAnalysis?.averageComments || it.account?.analyses?.[0]?.averageComments || 0),
        averageViews: Number(it.averageViews || it.deepAnalysis?.averageViews || it.account?.analyses?.[0]?.averageViews || 0),
        averageShares: Number(it.averageShares || (it.deepAnalysis ? it.deepAnalysis.totalShares / (it.deepAnalysis.sampleSize || 1) : 0) || it.account?.analyses?.[0]?.averageShares || 0),
        engagementRate: Number(
          it.engagementRate ??
          it.deepAnalysis?.medianER ??
          it.account?.analyses?.[0]?.engagementRate ??
          0
        ),
        city: it.city || it.account?.city || 'Nasional',
        roleOrTitle: it.roleOrTitle || it.account?.roleOrTitle || 'Jubir',
        errorMessage: it.error || it.errorMessage || null,
      };
    });

    // Calculate robust group ER (median of individual ERs to prevent single micro-account outlier skew)
    const validERs = processedItems
      .filter((i) => i.status === 'SUCCESS' && i.engagementRate > 0)
      .map((i) => i.engagementRate)
      .sort((a, b) => a - b);
    let averageER = 0;
    if (validERs.length > 0) {
      const mid = Math.floor(validERs.length / 2);
      averageER =
        validERs.length % 2 !== 0
          ? validERs[mid]
          : Number(((validERs[mid - 1] + validERs[mid]) / 2).toFixed(2));
    }

    const group = await prisma.batchGroup.create({
      data: {
        name: groupName,
        category: groupCategory,
        platform: platform.toUpperCase(),
        totalAccounts: items.length,
        successfulAccounts: successCount,
        failedAccounts: failCount,
        averageER,
        totalFollowers,
        status: failCount === items.length ? 'FAILED' : failCount > 0 ? 'PARTIAL' : 'COMPLETED',
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata || null,
        items: {
          create: processedItems,
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json(group);
  } catch (error: any) {
    console.error('createBatchGroup error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menyimpan grup riwayat batch scraper.' });
  }
}

/**
 * List all batch groups with search & category filters
 */
export async function getBatchGroups(req: Request, res: Response) {
  try {
    const { category, search, platform } = req.query;

    const where: any = {};

    if (category && String(category).toUpperCase() !== 'ALL' && String(category) !== 'Semua Kategori') {
      where.category = String(category);
    }

    if (platform && String(platform).toUpperCase() !== 'ALL') {
      where.platform = String(platform).toUpperCase();
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q } },
        { category: { contains: q } },
        {
          items: {
            some: {
              username: { contains: q },
            },
          },
        },
      ];
    }

    const groups = await prisma.batchGroup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
        items: {
          select: {
            id: true,
            username: true,
            displayName: true,
            platform: true,
            followers: true,
            engagementRate: true,
            status: true,
          },
          take: 6, // Preview thumbnails of the first few accounts
        },
      },
    });

    return res.json(groups);
  } catch (error: any) {
    console.error('getBatchGroups error:', error);
    return res.status(500).json({ error: error.message || 'Gagal mengambil riwayat grup batch.' });
  }
}

/**
 * Get single batch group detail with all accounts
 */
export async function getBatchGroupDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const group = await prisma.batchGroup.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { engagementRate: 'desc' },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grup batch scraper tidak ditemukan.' });
    }

    return res.json(group);
  } catch (error: any) {
    console.error('getBatchGroupDetail error:', error);
    return res.status(500).json({ error: error.message || 'Gagal mengambil detail grup batch.' });
  }
}

/**
 * Delete a batch group and cascade its items
 */
export async function deleteBatchGroup(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const group = await prisma.batchGroup.findUnique({
      where: { id },
      select: { id: true, name: true, totalAccounts: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grup tidak ditemukan.' });
    }

    await prisma.batchGroup.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: `Grup "${group.name}" beserta ${group.totalAccounts} item riwayatnya berhasil dihapus.`,
      deletedGroup: group,
    });
  } catch (error: any) {
    console.error('deleteBatchGroup error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghapus grup batch.' });
  }
}

/**
 * Get distinct categories present in batch groups + default categories
 */
export async function getGroupCategories(req: Request, res: Response) {
  try {
    const existing = await prisma.batchGroup.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categorySet = new Set(DEFAULT_CATEGORIES);
    existing.forEach((g: { category: string }) => {
      if (g.category && g.category.trim()) {
        categorySet.add(g.category.trim());
      }
    });

    return res.json(Array.from(categorySet));
  } catch (error: any) {
    console.error('getGroupCategories error:', error);
    return res.json(DEFAULT_CATEGORIES);
  }
}
