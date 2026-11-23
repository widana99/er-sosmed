import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { CsvService } from '../services/CsvService.js';
import { AnalyticsEngine } from '../services/AnalyticsEngine.js';

export async function previewCsv(req: Request, res: Response) {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'csvData text is required.' });
    }

    const preview = CsvService.parseAndValidate(csvData);
    return res.json(preview);
  } catch (error: any) {
    console.error('previewCsv error:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse CSV preview' });
  }
}

export async function importCsv(req: Request, res: Response) {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'csvData text is required.' });
    }

    const validation = CsvService.parseAndValidate(csvData);
    if (!validation.valid && validation.records.length === 0) {
      return res.status(400).json({
        error: 'CSV validation failed with no importable rows.',
        errors: validation.errors,
      });
    }

    // Group records by platform + username
    const groups: Record<string, typeof validation.records> = {};
    for (const record of validation.records) {
      const key = `${record.platform.toUpperCase()}:${record.username.toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    }

    const importedAccounts = [];

    for (const [key, records] of Object.entries(groups)) {
      const [platform, username] = key.split(':');
      const latestFollowers = records[0].followers;

      // Upsert account
      let account = await prisma.socialAccount.findUnique({
        where: {
          platform_username: {
            platform,
            username,
          },
        },
      });

      if (!account) {
        account = await prisma.socialAccount.create({
          data: {
            platform,
            username,
            displayName: `@${username}`,
            accountType: 'Imported',
          },
        });
      }

      // Record snapshot
      await prisma.accountSnapshot.create({
        data: {
          accountId: account.id,
          followers: latestFollowers,
          postsCount: records.length,
          source: 'CSV_IMPORT',
        },
      });

      // Insert posts
      const postMetrics = [];
      for (const rec of records) {
        const post = await prisma.socialPost.create({
          data: {
            accountId: account.id,
            postedAt: new Date(rec.postDate),
            likes: rec.likes,
            comments: rec.comments,
            views: rec.views,
            shares: rec.shares,
            source: 'CSV_IMPORT',
          },
        });
        postMetrics.push(post);
      }

      // Compute & save analysis run
      const calc = AnalyticsEngine.calculateAuto(platform as any, latestFollowers, postMetrics);

      const run = await prisma.analysisRun.create({
        data: {
          accountId: account.id,
          formulaType: calc.formulaType,
          sampleSize: calc.sampleSize,
          averageLikes: calc.averageLikes,
          averageComments: calc.averageComments,
          averageViews: calc.averageViews,
          averageShares: calc.averageShares,
          engagementRate: calc.engagementRate,
          source: 'CSV_IMPORT',
        },
      });

      importedAccounts.push({
        account,
        postsImported: records.length,
        analysis: run,
      });
    }

    return res.status(201).json({
      message: `Successfully imported ${validation.records.length} records across ${importedAccounts.length} account(s).`,
      importedAccounts,
      warnings: validation.errors,
    });
  } catch (error: any) {
    console.error('importCsv error:', error);
    return res.status(500).json({ error: error.message || 'Import failed' });
  }
}
