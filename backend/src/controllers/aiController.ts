import { Request, Response } from 'express';
import { AiIntelligenceService } from '../services/AiIntelligenceService.js';

export async function getAccountAiIntelligence(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Account ID is required.' });
    }

    const data = await AiIntelligenceService.getAccountIntelligence(id);
    return res.json(data);
  } catch (error: any) {
    console.error('getAccountAiIntelligence error:', error);
    return res.status(500).json({ error: error.message || 'Gagal memproses AI Intelligence akun.' });
  }
}

export async function simulateDraftPost(req: Request, res: Response) {
  try {
    const { caption, targetHour, targetDay, followers, platform, creatorMedianViews, creatorMedianER } = req.body;

    if (!caption || typeof caption !== 'string') {
      return res.status(400).json({ error: 'Teks draf caption wajib diisi.' });
    }

    const result = await AiIntelligenceService.simulateDraft({
      caption: caption.trim(),
      targetHour: Number(targetHour ?? 19),
      targetDay: String(targetDay || 'Jumat'),
      followers: Number(followers || 1000),
      platform: String(platform || 'TIKTOK').toUpperCase(),
      creatorMedianViews: Number(creatorMedianViews || 5000),
      creatorMedianER: Number(creatorMedianER || 5.0),
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('simulateDraftPost error:', error);
    return res.status(500).json({ error: error.message || 'Gagal melakukan simulasi prediksi viralitas.' });
  }
}

export async function getAccountTrends(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Account ID is required.' });
    }

    const data = await AiIntelligenceService.getAccountTrends(id);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('getAccountTrends error:', error);
    return res.status(500).json({ error: error.message || 'Gagal memproses analisis tren multi-tahun akun.' });
  }
}

