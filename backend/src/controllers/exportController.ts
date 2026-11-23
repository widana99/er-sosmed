import { Request, Response } from 'express';
import { PdfReportService } from '../services/PdfReportService.js';
import { ExcelExportService } from '../services/ExcelExportService.js';
import { prisma } from '../db.js';

/**
 * Controller to handle PDF and Excel exports with executive styling and date/month/year period filtering
 */
export async function exportAccountPdf(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id },
      select: { username: true, platform: true },
    });

    if (!account) {
      return res.status(404).json({ error: 'Akun tidak ditemukan di database.' });
    }

    const pdfBuffer = await PdfReportService.generateAccountPdf(id);

    const safeUsername = account.username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Audit_ER_${account.platform}_${safeUsername}_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    return res.status(500).json({
      error: 'Gagal membuat laporan PDF: ' + (error.message || 'Terjadi kesalahan sistem'),
    });
  }
}

export async function exportAccountsExcel(req: Request, res: Response) {
  try {
    const {
      platform,
      city,
      sortBy,
      accountId,
      accountIds,
      groupId,
      periodMode,
      year,
      month,
      startDate,
      endDate,
    } = req.query;

    const parsedAccountIds = accountIds
      ? typeof accountIds === 'string'
        ? accountIds.split(',').map((id) => id.trim()).filter(Boolean)
        : (accountIds as string[])
      : undefined;

    const excelBuffer = await ExcelExportService.exportAccountsExcel({
      platform: platform as string,
      city: city as string,
      sortBy: sortBy as string,
      accountId: accountId as string,
      accountIds: parsedAccountIds,
      groupId: groupId as string,
      periodMode: periodMode as string,
      year: year ? Number(year) : undefined,
      month: month !== undefined && month !== '' ? Number(month) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    let filename = `Laporan_Analisis_ER_Sosial_Media_${timestamp}.xlsx`;

    if (accountId) {
      const acc = await prisma.socialAccount.findUnique({
        where: { id: accountId as string },
        select: { username: true, platform: true },
      });
      if (acc) {
        const safeName = acc.username.replace(/[^a-zA-Z0-9_-]/g, '_');
        filename = `Laporan_ER_${acc.platform}_${safeName}_${timestamp}.xlsx`;
      }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Length', excelBuffer.length);

    return res.end(excelBuffer);
  } catch (error: any) {
    console.error('Error exporting Excel spreadsheet:', error);
    return res.status(500).json({
      error: 'Gagal mengekspor file Excel: ' + (error.message || 'Terjadi kesalahan sistem'),
    });
  }
}

/**
 * POST endpoint to export Batch Scraper results (supports 50 to 1,000+ accounts without URL overflow)
 */
export async function exportBatchExcel(req: Request, res: Response) {
  try {
    const {
      accountIds,
      groupId,
      platform,
      city,
      sortBy,
      periodConfig,
      groupName,
    } = req.body;

    const excelBuffer = await ExcelExportService.exportAccountsExcel({
      accountIds: Array.isArray(accountIds) ? accountIds : undefined,
      groupId: groupId as string,
      platform: platform as string,
      city: city as string,
      sortBy: sortBy as string,
      periodMode: periodConfig?.mode,
      year: periodConfig?.year,
      month: periodConfig?.month,
      startDate: periodConfig?.customStartDate,
      endDate: periodConfig?.customEndDate,
      groupName: groupName as string,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const safeName = (groupName || 'Batch').replace(/[^a-zA-Z0-9_-]/g, '_');

    let periodTag = 'Semua_Waktu';
    if (periodConfig?.mode === 'MONTH' && periodConfig.year && periodConfig.month !== undefined) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      periodTag = `${monthNames[periodConfig.month]}_${periodConfig.year}`;
    } else if (periodConfig?.mode === 'YEAR' && periodConfig.year) {
      periodTag = `Tahun_${periodConfig.year}`;
    } else if (periodConfig?.mode === 'LAST_30_DAYS') {
      periodTag = '30_Hari_Terakhir';
    } else if (periodConfig?.mode === 'LAST_90_DAYS') {
      periodTag = '90_Hari_Terakhir';
    } else if (periodConfig?.mode === 'CUSTOM' && periodConfig.customStartDate && periodConfig.customEndDate) {
      periodTag = `${periodConfig.customStartDate}_sd_${periodConfig.customEndDate}`;
    }

    const filename = `Laporan_ER_${safeName}_${periodTag}_${timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Length', excelBuffer.length);

    return res.end(excelBuffer);
  } catch (error: any) {
    console.error('Error exporting batch Excel spreadsheet:', error);
    return res.status(500).json({
      error: 'Gagal mengekspor file Excel batch: ' + (error.message || 'Terjadi kesalahan sistem'),
    });
  }
}

/**
 * Export specific Batch Group to executive Excel workbook with optional period filtering
 */
export async function exportGroupExcel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { periodMode, year, month, startDate, endDate } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const group = await prisma.batchGroup.findUnique({
      where: { id },
      select: { name: true, category: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grup batch scraper tidak ditemukan.' });
    }

    const excelBuffer = await ExcelExportService.exportGroupExcel(id, {
      periodMode: periodMode as string,
      year: year ? Number(year) : undefined,
      month: month !== undefined && month !== '' ? Number(month) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    const safeGroupName = group.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Grup_ER_${safeGroupName}_${timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Length', excelBuffer.length);

    return res.end(excelBuffer);
  } catch (error: any) {
    console.error('Error exporting group Excel spreadsheet:', error);
    return res.status(500).json({
      error: 'Gagal mengekspor file Excel grup: ' + (error.message || 'Terjadi kesalahan sistem'),
    });
  }
}

/**
 * Export specific Batch Group to executive PDF document
 */
export async function exportGroupPdf(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const group = await prisma.batchGroup.findUnique({
      where: { id },
      select: { name: true, category: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grup batch scraper tidak ditemukan.' });
    }

    const pdfBuffer = await PdfReportService.generateGroupPdf(id);

    const safeGroupName = group.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Audit_Grup_ER_${safeGroupName}_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error: any) {
    console.error('Error exporting group PDF report:', error);
    return res.status(500).json({
      error: 'Gagal membuat laporan PDF grup: ' + (error.message || 'Terjadi kesalahan sistem'),
    });
  }
}
