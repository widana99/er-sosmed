import ExcelJS from 'exceljs';
import { prisma } from '../db.js';

export interface ExcelExportOptions {
  platform?: string;
  city?: string;
  sortBy?: string;
  accountId?: string;
  accountIds?: string[];
  groupId?: string;
  groupName?: string;
  periodMode?: string; // 'ALL' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'YEAR' | 'MONTH' | 'CUSTOM'
  year?: number;
  month?: number; // 0-indexed (0=Jan, 11=Dec) or 1-12
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

interface PeriodResolution {
  hasDateFilter: boolean;
  startBound: number;
  endBound: number;
  label: string;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export class ExcelExportService {
  /**
   * Builds an accurate, canonical profile access URL for any platform
   */
  public static buildProfileUrl(platform: string, username: string, storedUrl?: string | null): string {
    if (storedUrl && storedUrl.trim().startsWith('http')) {
      return storedUrl.trim();
    }
    const clean = (username || '').replace(/^@+/, '').trim();
    if (!clean) return '';
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }

    const p = (platform || '').toUpperCase();
    if (p === 'TIKTOK') {
      return `https://www.tiktok.com/@${clean}`;
    }
    if (p === 'INSTAGRAM') {
      return `https://www.instagram.com/${clean}`;
    }
    if (p === 'YOUTUBE') {
      return clean.startsWith('@') ? `https://www.youtube.com/${clean}` : `https://www.youtube.com/@${clean}`;
    }
    if (p === 'FACEBOOK') {
      return `https://www.facebook.com/${clean}`;
    }
    return `https://${p.toLowerCase()}.com/${clean}`;
  }

  /**
   * Resolves the exact date boundaries and human-readable label from the given options.
   */
  private static resolvePeriodBounds(options?: ExcelExportOptions): PeriodResolution {
    const mode =
      options?.periodMode ||
      (options?.startDate || options?.endDate
        ? 'CUSTOM'
        : options?.month !== undefined
        ? 'MONTH'
        : options?.year
        ? 'YEAR'
        : 'ALL');

    if (mode === 'ALL') {
      return {
        hasDateFilter: false,
        startBound: 0,
        endBound: Infinity,
        label: 'Semua Waktu (All-Time)',
      };
    }

    const now = Date.now();
    let startBound = 0;
    let endBound = Infinity;
    let label = '';

    if (mode === 'LAST_30_DAYS') {
      startBound = now - 30 * 24 * 60 * 60 * 1000;
      endBound = now;
      const s = new Date(startBound).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const e = new Date(endBound).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      label = `30 Hari Terakhir (${s} – ${e})`;
    } else if (mode === 'LAST_90_DAYS') {
      startBound = now - 90 * 24 * 60 * 60 * 1000;
      endBound = now;
      const s = new Date(startBound).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const e = new Date(endBound).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      label = `90 Hari Terakhir (${s} – ${e})`;
    } else if (mode === 'YEAR') {
      const y = Number(options?.year || new Date().getFullYear());
      startBound = new Date(y, 0, 1, 0, 0, 0, 0).getTime();
      endBound = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
      label = `Tahun ${y} (01/01/${y} – 31/12/${y})`;
    } else if (mode === 'MONTH') {
      const y = Number(options?.year || new Date().getFullYear());
      let m = Number(options?.month ?? new Date().getMonth());
      if (m > 11) m = m - 1; // 1-indexed fallback if needed
      startBound = new Date(y, m, 1, 0, 0, 0, 0).getTime();
      endBound = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
      label = `Bulan ${MONTH_NAMES_ID[m]} ${y}`;
    } else if (mode === 'CUSTOM') {
      if (options?.startDate) {
        startBound = new Date(`${options.startDate}T00:00:00.000`).getTime();
      }
      if (options?.endDate) {
        endBound = new Date(`${options.endDate}T23:59:59.999`).getTime();
      }
      const sStr = options?.startDate || 'Awal';
      const eStr = options?.endDate || 'Sekarang';
      label = `Rentang Tanggal: ${sStr} s/d ${eStr}`;
    }

    return {
      hasDateFilter: true,
      startBound,
      endBound,
      label,
    };
  }

  /**
   * Generates a multi-sheet, beautifully styled Excel spreadsheet of all analyzed accounts
   * strictly filtered by the specified date, month, and year.
   */
  static async exportAccountsExcel(options?: ExcelExportOptions): Promise<Buffer> {
    const period = this.resolvePeriodBounds(options);

    const where: any = {};
    if (options?.accountId) {
      where.id = options.accountId;
    } else if (options?.accountIds && options.accountIds.length > 0) {
      where.id = { in: options.accountIds };
    } else if (options?.groupId) {
      const group = await prisma.batchGroup.findUnique({
        where: { id: options.groupId },
        include: { items: true },
      });
      if (group) {
        const linkedIds = group.items.map((i) => i.accountId).filter(Boolean) as string[];
        if (linkedIds.length > 0) {
          where.id = { in: linkedIds };
        } else {
          where.username = { in: group.items.map((i) => i.username) };
        }
      }
    }

    if (options?.platform && options.platform !== 'ALL') {
      where.platform = options.platform.toUpperCase();
    }
    if (options?.city && options.city !== 'ALL') {
      where.city = options.city;
    }

    const accounts = await prisma.socialAccount.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        posts: {
          where: period.hasDateFilter
            ? {
                postedAt: {
                  gte: new Date(period.startBound),
                  lte: new Date(period.endBound),
                },
              }
            : undefined,
          orderBy: { postedAt: 'desc' },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ER Social Media Analytics Platform';
    workbook.created = new Date();

    // Map and accurately recalculate metrics per account for the selected period
    const mapped = accounts.map((acc) => {
      const snap = acc.snapshots[0];
      const initialAnalysis = acc.analyses[0];
      const followers = snap?.followers || 1;
      const following = snap?.following || 0;
      const totalAllTimePosts = acc._count?.posts || snap?.postsCount || 0;

      // Filtered posts strictly within period
      const periodPosts = acc.posts;
      const sampleSize = periodPosts.length;

      let avgLikes = 0;
      let avgComments = 0;
      let avgViews = 0;
      let avgShares = 0;
      let er = 0;
      let formula = initialAnalysis?.formulaType || (acc.platform === 'TIKTOK' ? 'VIEW_BASED' : 'FOLLOWER_BASED');
      let statusPeriode = '';

      if (sampleSize > 0) {
        const totalLikes = periodPosts.reduce((s, p) => s + (p.likes || 0), 0);
        const totalComments = periodPosts.reduce((s, p) => s + (p.comments || 0), 0);
        const totalViews = periodPosts.reduce((s, p) => s + (p.views || 0), 0);
        const totalShares = periodPosts.reduce((s, p) => s + (p.shares || 0), 0);

        avgLikes = Number((totalLikes / sampleSize).toFixed(1));
        avgComments = Number((totalComments / sampleSize).toFixed(1));
        avgViews = Number((totalViews / sampleSize).toFixed(1));
        avgShares = Number((totalShares / sampleSize).toFixed(1));

        if (acc.platform === 'TIKTOK' || acc.platform === 'YOUTUBE') {
          if (totalViews > 0) {
            const shareComponent = acc.platform === 'TIKTOK' ? totalShares : 0;
            er = Number((((totalLikes + totalComments + shareComponent) / totalViews) * 100).toFixed(2));
            formula = acc.platform === 'TIKTOK'
              ? 'VIEW_BASED ((Likes+Komen+Shares)/Views)'
              : 'VIEW_BASED ((Likes+Komen)/Views)';
          } else {
            er = Number((((avgLikes + avgComments) / followers) * 100).toFixed(2));
            formula = 'FOLLOWER_BASED ((Likes+Komen)/Followers)';
          }
        } else if (acc.platform === 'FACEBOOK') {
          er = Number((((avgLikes + avgComments + avgShares) / followers) * 100).toFixed(2));
          formula = 'FOLLOWER_BASED ((Likes+Komen+Shares)/Followers)';
        } else {
          er = Number((((avgLikes + avgComments) / followers) * 100).toFixed(2));
          formula = 'FOLLOWER_BASED ((Likes+Komen)/Followers)';
        }

        statusPeriode = `Aktif (${sampleSize} postingan pada periode)`;
      } else {
        // Fallback for period with 0 posts
        avgLikes = 0;
        avgComments = 0;
        avgViews = 0;
        avgShares = 0;
        er = 0;
        statusPeriode = period.hasDateFilter
          ? 'Tidak ada postingan pada periode ini'
          : 'Belum ada data postingan';
      }

      let tier = 'Average';
      let tierArgb = 'FFFEF3C7';
      let tierFontArgb = 'FFB45309';

      if (sampleSize === 0) {
        tier = 'N/A (Nol Konten)';
        tierArgb = 'FFF1F5F9';
        tierFontArgb = 'FF64748B';
      } else if (er >= 5) {
        tier = 'High Interactivity (≥5%)';
        tierArgb = 'FFD1FAE5';
        tierFontArgb = 'FF047857';
      } else if (er >= 2.5) {
        tier = 'Good Engagement (2.5–5%)';
        tierArgb = 'FFDBEAFE';
        tierFontArgb = 'FF1D4ED8';
      } else if (er >= 1) {
        tier = 'Average (1–2.5%)';
        tierArgb = 'FFFEF3C7';
        tierFontArgb = 'FFB45309';
      } else {
        tier = 'Low (<1%)';
        tierArgb = 'FFF1F5F9';
        tierFontArgb = 'FF475569';
      }

      const cleanUser = acc.username.replace(/^@+/, '').trim();
      const profileUrl = this.buildProfileUrl(acc.platform, cleanUser, acc.profileUrl);

      return {
        id: acc.id,
        platform: acc.platform,
        username: `@${cleanUser}`,
        rawUsername: cleanUser,
        profileUrl,
        displayName: acc.displayName || `@${cleanUser}`,
        city: acc.city || 'Nasional',
        role: acc.roleOrTitle || 'Jubir',
        followers,
        following,
        totalAllTimePosts,
        sampleSize,
        avgLikes,
        avgComments,
        avgViews,
        avgShares,
        er: er / 100, // For Excel percentage format
        rawEr: er,
        formula,
        tier,
        tierArgb,
        tierFontArgb,
        statusPeriode,
        accountType: acc.accountType || 'Public Creator',
        auditDate: new Date(acc.updatedAt).toLocaleDateString('id-ID'),
        posts: periodPosts,
      };
    });

    // Sort by period ER descending
    mapped.sort((a, b) => b.rawEr - a.rawEr);

    // ─────────────────────────────────────────────────────────────
    // SHEET 1: Leaderboard & Analisis Sesuai Periode
    // ─────────────────────────────────────────────────────────────
    const sheet1 = workbook.addWorksheet('Leaderboard & Analisis', {
      views: [{ showGridLines: true }],
    });

    // Title banner
    sheet1.mergeCells('A1:U1');
    const titleCell = sheet1.getCell('A1');
    const groupPrefix = options?.groupName ? ` [${options.groupName.toUpperCase()}]` : '';
    titleCell.value = `LAPORAN AUDIT & PERINGKAT ENGAGEMENT RATE (ER) SOSIAL MEDIA${groupPrefix}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet1.getRow(1).height = 38;

    // Subtitle info with exact filter details
    sheet1.mergeCells('A2:U2');
    const subCell = sheet1.getCell('A2');
    const subtitleText = `Filter Periode: ${period.label.toUpperCase()} | Platform: ${options?.platform || 'SEMUA'} | Wilayah: ${options?.city || 'SEMUA'} | Total Akun: ${mapped.length} | Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`;
    subCell.value = subtitleText;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF334155' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet1.getRow(2).height = 24;

    // Blank spacer
    sheet1.getRow(3).height = 8;

    // Columns Definition
    const headerCols = [
      { key: 'rank', label: 'Peringkat', width: 10, align: 'center' },
      { key: 'platform', label: 'Platform', width: 13, align: 'center' },
      { key: 'username', label: 'Username', width: 22, align: 'left' },
      { key: 'displayName', label: 'Nama Akun', width: 26, align: 'left' },
      { key: 'profileUrl', label: 'Link Akun (URL)', width: 38, align: 'left' },
      { key: 'city', label: 'Daerah / Kota', width: 18, align: 'left' },
      { key: 'role', label: 'Role / Kategori', width: 18, align: 'left' },
      { key: 'followers', label: 'Followers', width: 15, align: 'right', format: '#,##0' },
      { key: 'following', label: 'Following', width: 14, align: 'right', format: '#,##0' },
      { key: 'totalAllTimePosts', label: 'Total Post Akun', width: 16, align: 'right', format: '#,##0' },
      { key: 'sampleSize', label: 'Post di Periode Ini', width: 18, align: 'right', format: '#,##0' },
      { key: 'avgLikes', label: 'Rata-rata Likes', width: 16, align: 'right', format: '#,##0.0' },
      { key: 'avgComments', label: 'Rata-rata Komen', width: 16, align: 'right', format: '#,##0.0' },
      { key: 'avgViews', label: 'Rata-rata Views', width: 16, align: 'right', format: '#,##0.0' },
      { key: 'avgShares', label: 'Rata-rata Shares', width: 16, align: 'right', format: '#,##0.0' },
      { key: 'er', label: 'Engagement Rate (Periode)', width: 24, align: 'right', format: '0.00%' },
      { key: 'formula', label: 'Rumus ER Digunakan', width: 26, align: 'center' },
      { key: 'tier', label: 'Tier Interaktivitas', width: 24, align: 'center' },
      { key: 'statusPeriode', label: 'Status Keaktifan Periode', width: 30, align: 'left' },
      { key: 'accountType', label: 'Tipe Akun', width: 18, align: 'left' },
      { key: 'auditDate', label: 'Terakhir Update', width: 16, align: 'center' },
    ];

    const headerRow = sheet1.getRow(4);
    headerRow.height = 30;

    headerCols.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.label;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: col.align as any, wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
      sheet1.getColumn(idx + 1).width = col.width;
    });

    // Populate rows
    mapped.forEach((item, rIdx) => {
      const rowNum = 5 + rIdx;
      const row = sheet1.getRow(rowNum);
      row.height = 22;

      const isEven = rIdx % 2 === 0;
      const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      const rowValues = [
        item.sampleSize > 0 ? rIdx + 1 : '-',
        item.platform,
        item.username,
        item.displayName,
        item.profileUrl,
        item.city,
        item.role,
        item.followers,
        item.following,
        item.totalAllTimePosts,
        item.sampleSize,
        item.avgLikes,
        item.avgComments,
        item.avgViews,
        item.avgShares,
        item.er,
        item.formula,
        item.tier,
        item.statusPeriode,
        item.accountType,
        item.auditDate,
      ];

      rowValues.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        const colDef = headerCols[cIdx];
        cell.alignment = { vertical: 'middle', horizontal: colDef.align as any };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colDef.key === 'profileUrl' && item.profileUrl) {
          cell.value = {
            text: item.profileUrl,
            hyperlink: item.profileUrl,
            tooltip: `Kunjungi profil ${item.username} (${item.platform})`,
          };
          cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0284C7' }, underline: true };
        } else if (colDef.key === 'username' && item.profileUrl) {
          cell.value = {
            text: item.username,
            hyperlink: item.profileUrl,
            tooltip: `Buka profil @${item.rawUsername}`,
          };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0369A1' }, underline: true };
        } else {
          cell.value = val;
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        }

        if (colDef.format) {
          cell.numFmt = colDef.format;
        }

        // Highlight Tier Cell
        if (colDef.key === 'tier') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.tierArgb } };
          cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: item.tierFontArgb } };
        }

        // Bold for ER
        if (colDef.key === 'er') {
          cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
        }
      });
    });

    // Auto-filter for Sheet 1
    if (mapped.length > 0) {
      sheet1.autoFilter = {
        from: 'A4',
        to: `U${4 + mapped.length}`,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // SHEET 2: Detail Seluruh Postingan Pada Periode Terpilih
    // ─────────────────────────────────────────────────────────────
    const sheet2 = workbook.addWorksheet('Detail Seluruh Postingan', {
      views: [{ showGridLines: true }],
    });

    // Title banner
    sheet2.mergeCells('A1:L1');
    const postTitleCell = sheet2.getCell('A1');
    postTitleCell.value = `RINCIAN SELURUH POSTINGAN PADA PERIODE: ${period.label.toUpperCase()}`;
    postTitleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    postTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    postTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet2.getRow(1).height = 34;

    sheet2.mergeCells('A2:L2');
    const postSubCell = sheet2.getCell('A2');
    postSubCell.value = `Postingan yang tertera di bawah ini adalah konten bertanggal riil yang diterbitkan pada rentang filter yang dipilih.`;
    postSubCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
    postSubCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    postSubCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet2.getRow(2).height = 22;

    const postHeaders = [
      { key: 'no', label: 'No', width: 8, align: 'center' },
      { key: 'username', label: 'Akun / Username', width: 22, align: 'left' },
      { key: 'profileUrl', label: 'Link Akun (URL)', width: 36, align: 'left' },
      { key: 'platform', label: 'Platform', width: 14, align: 'center' },
      { key: 'postedAt', label: 'Tanggal Terbit', width: 18, align: 'center' },
      { key: 'contentType', label: 'Tipe Konten', width: 16, align: 'center' },
      { key: 'postUrl', label: 'URL Postingan', width: 38, align: 'left' },
      { key: 'caption', label: 'Caption / Deskripsi', width: 50, align: 'left' },
      { key: 'likes', label: 'Likes', width: 14, align: 'right', format: '#,##0' },
      { key: 'comments', label: 'Comments', width: 14, align: 'right', format: '#,##0' },
      { key: 'views', label: 'Views', width: 14, align: 'right', format: '#,##0' },
      { key: 'shares', label: 'Shares', width: 14, align: 'right', format: '#,##0' },
    ];

    const postHeaderRow = sheet2.getRow(4);
    postHeaderRow.height = 28;
    postHeaders.forEach((col, idx) => {
      const cell = postHeaderRow.getCell(idx + 1);
      cell.value = col.label;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { vertical: 'middle', horizontal: col.align as any };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF475569' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF475569' } },
        right: { style: 'thin', color: { argb: 'FF475569' } },
      };
      sheet2.getColumn(idx + 1).width = col.width;
    });

    let postRowIdx = 5;
    let globalPostCounter = 1;

    for (const acc of mapped) {
      for (const p of acc.posts) {
        const row = sheet2.getRow(postRowIdx);
        row.height = 20;

        const isEven = globalPostCounter % 2 === 0;
        const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

        const postVals = [
          globalPostCounter,
          acc.username,
          acc.profileUrl,
          acc.platform,
          new Date(p.postedAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          p.contentType || (acc.platform === 'TIKTOK' ? 'VIDEO' : 'FEED_POST'),
          p.postUrl || '-',
          p.caption || 'Tidak ada deskripsi',
          p.likes || 0,
          p.comments || 0,
          p.views || 0,
          p.shares || 0,
        ];

        postVals.forEach((val, cIdx) => {
          const cell = row.getCell(cIdx + 1);
          const colDef = postHeaders[cIdx];
          cell.alignment = { vertical: 'middle', horizontal: colDef.align as any };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };

          if (colDef.key === 'profileUrl' && acc.profileUrl) {
            cell.value = {
              text: acc.profileUrl,
              hyperlink: acc.profileUrl,
              tooltip: `Buka profil ${acc.username} (${acc.platform})`,
            };
            cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF0284C7' }, underline: true };
          } else if (colDef.key === 'postUrl' && typeof val === 'string' && val.startsWith('http')) {
            cell.value = {
              text: val,
              hyperlink: val,
              tooltip: 'Buka postingan',
            };
            cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF0284C7' }, underline: true };
          } else {
            cell.value = val;
            cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
          }

          if (colDef.format) {
            cell.numFmt = colDef.format;
          }
        });

        postRowIdx++;
        globalPostCounter++;
      }
    }

    if (globalPostCounter > 1) {
      sheet2.autoFilter = {
        from: 'A4',
        to: `L${postRowIdx - 1}`,
      };
    }

    // ─────────────────────────────────────────────────────────────
    // SHEET 3: Metodologi & Ringkasan Eksekutif Periode
    // ─────────────────────────────────────────────────────────────
    const sheet3 = workbook.addWorksheet('Kamus Metrik & Ringkasan', {
      views: [{ showGridLines: true }],
    });

    sheet3.mergeCells('A1:D1');
    const mTitle = sheet3.getCell('A1');
    mTitle.value = `RINGKASAN EKSEKUTIF & PANDUAN FORMULA PERIODE: ${period.label.toUpperCase()}`;
    mTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    mTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    mTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet3.getRow(1).height = 32;

    const activeAccounts = mapped.filter((m) => m.sampleSize > 0);
    const totalPeriodPosts = mapped.reduce((sum, m) => sum + m.sampleSize, 0);
    const avgErPeriod =
      activeAccounts.length > 0
        ? Number(
            (activeAccounts.reduce((sum, m) => sum + m.rawEr, 0) / activeAccounts.length).toFixed(2)
          )
        : 0;
    const topAccount = activeAccounts.length > 0 ? activeAccounts[0] : null;

    const summaryCards = [
      ['Periode Audit / Filter Waktu', period.label],
      ['Total Akun yang Dicari / Diaudit', `${mapped.length} Akun`],
      ['Akun Aktif Menerbitkan Konten pada Periode', `${activeAccounts.length} Akun`],
      ['Total Konten Diterbitkan pada Periode', `${totalPeriodPosts.toLocaleString('id-ID')} Postingan`],
      ['Rerata Engagement Rate Periode', `${avgErPeriod}%`],
      ['Akun ER Tertinggi Periode Ini', topAccount ? `${topAccount.displayName} (${topAccount.username}) — ER: ${(topAccount.er * 100).toFixed(2)}%` : '-'],
      ['Waktu Pembuatan Laporan', new Date().toLocaleString('id-ID')],
    ];

    sheet3.getColumn(1).width = 35;
    sheet3.getColumn(2).width = 50;

    summaryCards.forEach((c, idx) => {
      const r = sheet3.getRow(3 + idx);
      r.height = 24;
      const c1 = r.getCell(1);
      c1.value = c[0];
      c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
      c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      c1.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      const c2 = r.getCell(2);
      c2.value = c[1];
      c2.font = { name: 'Calibri', size: 10, bold: idx === 4 || idx === 5, color: { argb: idx === 4 ? 'FF0284C7' : 'FF0F172A' } };
      c2.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    // Methodology definitions
    const methodStartRow = 12;
    sheet3.mergeCells(`A${methodStartRow}:D${methodStartRow}`);
    const mHead = sheet3.getCell(`A${methodStartRow}`);
    mHead.value = 'METODOLOGI & RUMUS ENGAGEMENT RATE SESUAI STANDAR INDUSTRI';
    mHead.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    mHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    mHead.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet3.getRow(methodStartRow).height = 26;

    const methodologyData = [
      {
        kategori: 'Formula TikTok (View-Based)',
        rumus: '((Total Likes + Komen + Shares) / Total Views) × 100%',
        deskripsi: 'Standar industri video pendek (VT/Reels) di mana rasio interaksi terhadap jumlah penayangan mencerminkan kualitas retensi dan daya tarik konten.',
        benchmark: 'Bagus: 3.5% - 7.0% | Sangat Bagus: > 7.0%',
      },
      {
        kategori: 'Formula Instagram (Follower-Based)',
        rumus: '((Rata-rata Likes + Rata-rata Komen) / Followers) × 100%',
        deskripsi: 'Standar umum feed post Instagram untuk mengukur persentase audiens aktif yang terikat terhadap basis pengikut yang dimiliki.',
        benchmark: 'Rata-rata: 1.5% - 3.5% | Tinggi: > 3.5%',
      },
      {
        kategori: 'Klasifikasi Tier Engagement',
        rumus: 'High Interactivity (≥5%) • Good (2.5 - 5%) • Average (1 - 2.5%) • Low (<1%)',
        deskripsi: 'Kategorisasi objektif performa jubir/creator untuk menentukan kelayakan penugasan kampanye dan efektivitas komunikasi publik.',
        benchmark: 'Digunakan untuk penetapan estimasi rate card dan valuasi pengaruh.',
      },
      {
        kategori: 'Integritas Data Realtime',
        rumus: 'Non-Simulated Engine (Live Scraping + Authenticated Cookies)',
        deskripsi: 'Data diambil secara live langsung dari platform resmi tanpa sintesis tiruan. Postingan dan statistik mewakili keadaan nyata di akun.',
        benchmark: 'Tervalidasi 100% realtime.',
      },
    ];

    sheet3.getColumn(1).width = 30;
    sheet3.getColumn(2).width = 45;
    sheet3.getColumn(3).width = 50;
    sheet3.getColumn(4).width = 35;

    const mHeaderRow = sheet3.getRow(methodStartRow + 1);
    mHeaderRow.height = 24;
    ['Kategori Metrik', 'Formula Perhitungan', 'Penjelasan Teknis', 'Ambang Batas (Benchmark)'].forEach((h, i) => {
      const c = mHeaderRow.getCell(i + 1);
      c.value = h;
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      c.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    methodologyData.forEach((m, idx) => {
      const row = sheet3.getRow(methodStartRow + 2 + idx);
      row.height = 36;
      const vals = [m.kategori, m.rumus, m.deskripsi, m.benchmark];
      vals.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generates a beautifully styled Excel workbook for a specific Batch Group with period filtering support.
   */
  static async exportGroupExcel(groupId: string, options?: Omit<ExcelExportOptions, 'groupId'>): Promise<Buffer> {
    const group = await prisma.batchGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Grup batch scraper tidak ditemukan.');
    }

    return this.exportAccountsExcel({
      ...options,
      groupId,
      groupName: group.name,
      platform: group.platform === 'ALL' ? undefined : group.platform,
    });
  }
}
