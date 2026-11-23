import puppeteer, { Browser } from 'puppeteer-core';
import fs from 'fs';
import { prisma } from '../db.js';
import { RateCardCalculator } from './RateCardCalculator.js';

export class PdfReportService {
  private static readonly CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
  ];

  private static executablePath: string | null = null;

  private static getExecutablePath(): string | null {
    if (!PdfReportService.executablePath) {
      PdfReportService.executablePath =
        PdfReportService.CHROME_PATHS.find((p) => p && fs.existsSync(p)) || null;
    }
    return PdfReportService.executablePath;
  }

  /**
   * Generate an aesthetic, executive-grade PDF audit report for an account
   */
  static async generateAccountPdf(accountId: string): Promise<Buffer> {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
      include: {
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 1 },
        analyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
        posts: { orderBy: { postedAt: 'desc' }, take: 30 },
      },
    });

    if (!account) {
      throw new Error('ACCOUNT_NOT_FOUND: Akun tidak ditemukan.');
    }

    const execPath = this.getExecutablePath();
    if (!execPath) {
      throw new Error('Chrome or Edge browser executable not found for PDF rendering.');
    }

    const snapshot = account.snapshots[0];
    const analysis = account.analyses[0];
    const posts = account.posts;

    const followers = snapshot?.followers || 0;
    const following = snapshot?.following || 0;
    const totalPosts = snapshot?.postsCount || posts.length;
    const sampleSize = analysis?.sampleSize || posts.length;
    const er = analysis?.engagementRate || 0;
    const formulaType = analysis?.formulaType || (account.platform === 'TIKTOK' ? 'VIEW_BASED' : 'FOLLOWER_BASED');

    // Tier calculation
    let tier = 'Average';
    let tierColor = '#d97706';
    let tierBg = '#fef3c7';
    if (er >= 5) {
      tier = 'High Interactivity';
      tierColor = '#059669';
      tierBg = '#d1fae5';
    } else if (er >= 2.5) {
      tier = 'Good Engagement';
      tierColor = '#2563eb';
      tierBg = '#dbeafe';
    } else if (er >= 1) {
      tier = 'Average';
      tierColor = '#d97706';
      tierBg = '#fef3c7';
    } else {
      tier = 'Low Engagement';
      tierColor = '#64748b';
      tierBg = '#f1f5f9';
    }

    // Rate card valuation
    let rateCard = null;
    try {
      rateCard = RateCardCalculator.calculate(followers, er);
    } catch {}

    const formattedDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Audit ER — @${account.username}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f172a;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
      margin-top: 2px;
    }
    .report-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #0f172a;
      color: #ffffff;
    }
    .report-date {
      font-size: 9px;
      color: #64748b;
      margin-top: 4px;
      text-align: right;
    }

    /* Creator Profile Card */
    .profile-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .profile-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #cbd5e1;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .profile-names h2 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .profile-names p {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .platform-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      margin-top: 4px;
      color: #ffffff;
      background: ${account.platform === 'TIKTOK' ? '#000000' : '#d946ef'};
    }
    .profile-meta {
      text-align: right;
      font-size: 10px;
    }
    .meta-item {
      margin-bottom: 2px;
    }
    .meta-label {
      color: #64748b;
    }
    .meta-value {
      font-weight: 600;
      color: #0f172a;
    }

    /* Hero Scorecard */
    .hero-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .er-box {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    .er-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
    }
    .er-value {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: -0.04em;
      color: #38bdf8;
      margin: 4px 0;
      font-variant-numeric: tabular-nums;
    }
    .tier-badge {
      display: inline-block;
      align-self: center;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      background: ${tierBg};
      color: ${tierColor};
    }
    .formula-tag {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 6px;
      font-family: monospace;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }

    /* Breakdown Box */
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title::before {
      content: "";
      width: 4px;
      height: 12px;
      background: #0f172a;
      border-radius: 2px;
    }
    .formula-box {
      background: #f1f5f9;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 10px;
      color: #334155;
    }
    .formula-formula {
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    /* Posts Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 16px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 7px 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .num-col {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-family: monospace;
    }
    .caption-col {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .post-link {
      color: #2563eb;
      text-decoration: none;
    }

    /* Rate Card Summary */
    .rate-card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .rate-card-item {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .rate-deliverable {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .rate-price {
      font-size: 12px;
      font-weight: 700;
      color: #059669;
      margin-top: 2px;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-title">Social Media Engagement Rate Audit</div>
      <div class="brand-sub">Platform Analisis Kinerja & Kualitas Audiens Digital (PRD Multi-Formula Engine)</div>
    </div>
    <div>
      <span class="report-badge">Official Audit Report</span>
      <div class="report-date">Diterbitkan: ${formattedDate}</div>
    </div>
  </div>

  <!-- Profile Card -->
  <div class="profile-card">
    <div class="profile-info">
      ${account.avatarUrl ? `<img src="${account.avatarUrl}" class="avatar" alt="avatar" />` : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-weight:bold;color:#475569;">@</div>`}
      <div class="profile-names">
        <h2>${account.displayName || `@${account.username}`}</h2>
        <p>@${account.username} • <span class="platform-badge">${account.platform}</span></p>
      </div>
    </div>
    <div class="profile-meta">
      <div class="meta-item"><span class="meta-label">Kota / Daerah: </span><span class="meta-value">${account.city || 'Nasional'}</span></div>
      <div class="meta-item"><span class="meta-label">Kategori / Role: </span><span class="meta-value">${account.roleOrTitle || 'Jubir'}</span></div>
      <div class="meta-item"><span class="meta-label">Tipe Akun: </span><span class="meta-value">${account.accountType || 'Public Creator'}</span></div>
    </div>
  </div>

  <!-- Hero Scorecard & KPIs -->
  <div class="hero-grid">
    <div class="er-box">
      <div class="er-title">Engagement Rate (ER)</div>
      <div class="er-value">${er.toFixed(2)}%</div>
      <div class="tier-badge">${tier}</div>
      <div class="formula-tag">Metode: ${formulaType}</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Followers</div>
        <div class="kpi-value">${followers.toLocaleString('id-ID')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Following</div>
        <div class="kpi-value">${following.toLocaleString('id-ID')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Post</div>
        <div class="kpi-value">${totalPosts.toLocaleString('id-ID')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Sample Dianalisis</div>
        <div class="kpi-value">${sampleSize.toLocaleString('id-ID')} Post</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Rata-rata Likes</div>
        <div class="kpi-value">${(analysis?.averageLikes || 0).toLocaleString('id-ID')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Rata-rata Komen</div>
        <div class="kpi-value">${(analysis?.averageComments || 0).toLocaleString('id-ID')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Rata-rata Views</div>
        <div class="kpi-value">${(analysis?.averageViews || 0).toLocaleString('id-ID')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Rata-rata Shares</div>
        <div class="kpi-value">${(analysis?.averageShares || 0).toLocaleString('id-ID')}</div>
      </div>
    </div>
  </div>

  <!-- Formula & Mathematical Breakdown -->
  <div class="section-title">Metodologi & Verifikasi Perhitungan</div>
  <div class="formula-box">
    <div class="formula-formula">
      ${
        formulaType === 'VIEW_BASED'
          ? `ER (%) = ((Total Likes [${((analysis?.averageLikes || 0) * sampleSize).toFixed(0)}] + Komen [${((analysis?.averageComments || 0) * sampleSize).toFixed(0)}] + Shares [${((analysis?.averageShares || 0) * sampleSize).toFixed(0)}]) / Total Views [${((analysis?.averageViews || 0) * sampleSize).toFixed(0)}]) × 100 = ${er.toFixed(2)}%`
          : `ER (%) = ((Rata-rata Likes [${analysis?.averageLikes || 0}] + Rata-rata Komen [${analysis?.averageComments || 0}]) / Followers [${followers.toLocaleString('id-ID')}]) × 100 = ${er.toFixed(2)}%`
      }
    </div>
    <div style="color: #475569; font-size: 9.5px; line-height: 1.4;">
      Formula <strong>${formulaType}</strong> diterapkan sesuai standar audit PRD. Ambang batas industri untuk kategori ini adalah: <em>Low (&lt;1%)</em>, <em>Average (1-2.5%)</em>, <em>Good (2.5-5%)</em>, dan <em>High Interactivity (&gt;5%)</em>.
    </div>
  </div>

  ${
    rateCard?.deliverables && rateCard.deliverables.length > 0
      ? `
  <!-- Rate Card Estimate -->
  <div class="section-title">Estimasi Valuasi & Rate Card Influencer (${rateCard.tierLabel || rateCard.tier})</div>
  <div class="rate-card-grid">
    ${rateCard.deliverables
      .map(
        (d: any) => `
      <div class="rate-card-item">
        <div class="rate-deliverable">${d.label || d.key}</div>
        <div class="rate-price">${d.formattedRange || `Rp ${(d.priceLow || 0).toLocaleString('id-ID')} - ${(d.priceHigh || 0).toLocaleString('id-ID')}`}</div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Posts Table -->
  <div class="section-title">Rincian Kinerja ${posts.length} Postingan yang Dianalisis</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px;">#</th>
        <th style="width: 70px;">Tanggal</th>
        <th>Deskripsi / Caption</th>
        <th class="num-col" style="width: 50px;">Likes</th>
        <th class="num-col" style="width: 50px;">Komen</th>
        <th class="num-col" style="width: 60px;">Views</th>
        <th class="num-col" style="width: 50px;">Shares</th>
        <th class="num-col" style="width: 50px;">ER Post</th>
      </tr>
    </thead>
    <tbody>
      ${posts
        .map((p, i) => {
          const pLikes = p.likes || 0;
          const pComms = p.comments || 0;
          const pViews = p.views || 0;
          const pShares = p.shares || 0;
          let pEr = 0;
          if (formulaType === 'VIEW_BASED' && pViews > 0) {
            pEr = ((pLikes + pComms + pShares) / pViews) * 100;
          } else if (followers > 0) {
            pEr = ((pLikes + pComms) / followers) * 100;
          }

          const postDate = new Date(p.postedAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });

          return `
          <tr>
            <td>${i + 1}</td>
            <td>${postDate}</td>
            <td class="caption-col">
              ${p.postUrl ? `<a href="${p.postUrl}" class="post-link" target="_blank">${p.caption || 'Lihat Postingan'}</a>` : (p.caption || 'Post Video/Foto')}
            </td>
            <td class="num-col">${pLikes.toLocaleString('id-ID')}</td>
            <td class="num-col">${pComms.toLocaleString('id-ID')}</td>
            <td class="num-col">${pViews > 0 ? pViews.toLocaleString('id-ID') : '-'}</td>
            <td class="num-col">${pShares > 0 ? pShares.toLocaleString('id-ID') : '-'}</td>
            <td class="num-col" style="font-weight: 700; color: #0f172a;">${pEr.toFixed(2)}%</td>
          </tr>
        `;
        })
        .join('')}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div>Dokumen Resmi Sistem Analisis Engagement Rate • Data Realtime Platform</div>
    <div>Halaman 1 dari 1 • Audit ID: ${account.id.slice(0, 8)}</div>
  </div>

</body>
</html>
    `;

    const browser: Browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close().catch(() => {});
    }
  }

  /**
   * Generate an executive-grade PDF audit report for an entire Batch Group
   */
  static async generateGroupPdf(groupId: string): Promise<Buffer> {
    const group = await prisma.batchGroup.findUnique({
      where: { id: groupId },
      include: {
        items: {
          orderBy: { engagementRate: 'desc' },
        },
      },
    });

    if (!group) {
      throw new Error('Grup batch scraper tidak ditemukan.');
    }

    const execPath = this.getExecutablePath();
    if (!execPath) {
      throw new Error('Chrome or Edge browser executable not found for PDF rendering.');
    }

    const formattedDate = new Date(group.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const highCount = group.items.filter((it: any) => it.engagementRate >= 5).length;
    const goodCount = group.items.filter((it: any) => it.engagementRate >= 2.5 && it.engagementRate < 5).length;
    const avgCount = group.items.filter((it: any) => it.engagementRate >= 1 && it.engagementRate < 2.5).length;
    const lowCount = group.items.filter((it: any) => it.engagementRate < 1).length;

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Audit Grup — ${group.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      font-size: 11px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-category { background: #f1f5f9; color: #334155; }
    .badge-platform { background: #e0f2fe; color: #0369a1; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .kpi-highlight { color: #0284c7; }
    .kpi-sub {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 16px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) { background: #f8fafc; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .tier-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
    }
    .tier-high { background: #dcfce7; color: #15803d; }
    .tier-good { background: #dbeafe; color: #1d4ed8; }
    .tier-avg { background: #fef3c7; color: #b45309; }
    .tier-low { background: #f1f5f9; color: #64748b; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-title">LAPORAN AUDIT BATCH GRUP</div>
      <div class="brand-subtitle">${group.name}</div>
    </div>
    <div style="text-align: right;">
      <div style="margin-bottom: 4px;">
        <span class="badge badge-category">${group.category}</span>
        <span class="badge badge-platform">${group.platform}</span>
      </div>
      <div style="font-size: 9px; color: #64748b;">${formattedDate}</div>
    </div>
  </div>

  <!-- KPI Grid -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Rata-rata ER Grup</div>
      <div class="kpi-value kpi-highlight">${group.averageER}%</div>
      <div class="kpi-sub">Kalkulasi realtime median</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Akun Terdaftar</div>
      <div class="kpi-value">${group.totalAccounts}</div>
      <div class="kpi-sub">Sukses: ${group.successfulAccounts} | Gagal: ${group.failedAccounts}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Followers Grup</div>
      <div class="kpi-value">${group.totalFollowers.toLocaleString('id-ID')}</div>
      <div class="kpi-sub">Total audiens gabungan</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Distribusi Tier Interaktivitas</div>
      <div class="kpi-value" style="font-size: 13px; line-height: 1.6; margin-top: 2px;">
        <span style="color: #15803d; font-weight: bold;">${highCount} High</span> • 
        <span style="color: #1d4ed8; font-weight: bold;">${goodCount} Good</span> • 
        <span style="color: #b45309; font-weight: bold;">${avgCount} Avg</span>
      </div>
      <div class="kpi-sub">${lowCount} akun low engagement</div>
    </div>
  </div>

  <!-- Accounts Table -->
  <div class="section-title">
    <span>Leaderboard & Rincian Akun (${group.items.length} Akun)</span>
    <span style="font-size: 9px; color: #64748b; font-weight: normal;">Diurutkan berdasarkan Engagement Rate (ER) tertinggi</span>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center" style="width: 32px;">No</th>
        <th>Akun & Platform</th>
        <th>Wilayah</th>
        <th class="text-right">Followers</th>
        <th class="text-right">Avg Views</th>
        <th class="text-right">Avg Likes</th>
        <th class="text-right">Avg Komen</th>
        <th class="text-right">ER</th>
        <th class="text-center">Tier</th>
      </tr>
    </thead>
    <tbody>
      ${group.items
        .map((it: any, idx: number) => {
          let tierClass = 'tier-avg';
          let tierText = 'Average';
          if (it.engagementRate >= 5) {
            tierClass = 'tier-high';
            tierText = 'High';
          } else if (it.engagementRate >= 2.5) {
            tierClass = 'tier-good';
            tierText = 'Good';
          } else if (it.engagementRate >= 1) {
            tierClass = 'tier-avg';
            tierText = 'Average';
          } else {
            tierClass = 'tier-low';
            tierText = 'Low';
          }

          return `
            <tr>
              <td class="text-center" style="font-weight: 700; color: #64748b;">${idx + 1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">@${it.username}</div>
                <div style="font-size: 8px; color: #64748b;">${it.platform} • ${it.displayName || '-'}</div>
              </td>
              <td>${it.city || 'Nasional'}</td>
              <td class="text-right" style="font-weight: 600;">${it.followers.toLocaleString('id-ID')}</td>
              <td class="text-right">${it.averageViews.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
              <td class="text-right">${it.averageLikes.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
              <td class="text-right">${it.averageComments.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
              <td class="text-right" style="font-weight: 800; color: #0284c7; font-size: 11px;">${it.engagementRate.toFixed(2)}%</td>
              <td class="text-center">
                <span class="tier-badge ${tierClass}">${tierText}</span>
              </td>
            </tr>
          `;
        })
        .join('')}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div>Dokumen Resmi Sistem Analisis Engagement Rate • Data Realtime Platform</div>
    <div>Batch Group ID: ${group.id.slice(0, 8)} • Total Akun: ${group.totalAccounts}</div>
  </div>
</body>
</html>
    `;

    const browser: Browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close().catch(() => {});
    }
  }
}
