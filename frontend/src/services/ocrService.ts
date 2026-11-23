import { createWorker } from 'tesseract.js';

export interface ParsedProfileOcr {
  username?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  rawText: string;
}

export interface ParsedPostOcr {
  likes?: number;
  comments?: number;
  views?: number;
  shares?: number;
  caption?: string;
  rawText: string;
}

/**
 * Clean OCR number strings, including Indonesian and English multiplier suffixes:
 * e.g. "14,2 rb" -> 14200, "1.5M" -> 1500000, "25.4K" -> 25400, "1,250" -> 1250
 */
export function cleanOcrNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, '');

  // Detect multiplier suffixes
  // Millions
  if (cleaned.includes('m') || cleaned.includes('jt')) {
    const numPart = cleaned.replace(/[^0-9.,]/g, '').replace(',', '.');
    const val = parseFloat(numPart);
    return isNaN(val) ? 0 : Math.round(val * 1_000_000);
  }

  // Thousands
  if (cleaned.includes('k') || cleaned.includes('rb')) {
    const numPart = cleaned.replace(/[^0-9.,]/g, '').replace(',', '.');
    const val = parseFloat(numPart);
    return isNaN(val) ? 0 : Math.round(val * 1_000);
  }

  // Standard digits with possible thousands separators
  // "1.250" or "1,250"
  if (/^\d{1,3}[.,]\d{3}$/.test(cleaned)) {
    return parseInt(cleaned.replace(/[.,]/g, ''), 10);
  }

  const numOnly = cleaned.replace(/[^0-9]/g, '');
  const parsed = parseInt(numOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Extract Profile metadata from OCR raw text (Instagram or TikTok Profile Screenshot)
 */
export function extractProfileFromText(text: string): ParsedProfileOcr {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let username: string | undefined;
  let followers: number | undefined;
  let following: number | undefined;
  let postsCount: number | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect @username
    if (!username && line.includes('@')) {
      const match = line.match(/@([a-zA-Z0-9._]+)/);
      if (match) username = match[1];
    }

    // Detect Followers (Pengikut)
    // Matches patterns like "12.4K Followers", "12,4 rb Pengikut", or label below number
    if (line.toLowerCase().includes('follower') || line.toLowerCase().includes('pengikut')) {
      // Check current line for number
      const numMatch = line.match(/([0-9.,]+(?:\s*(?:k|m|rb|jt))?)/i);
      if (numMatch) {
        followers = cleanOcrNumber(numMatch[1]);
      } else if (i > 0) {
        // Number might be on previous line
        followers = cleanOcrNumber(lines[i - 1]);
      }
    }

    // Detect Following (Mengikuti)
    if (line.toLowerCase().includes('following') || line.toLowerCase().includes('mengikuti')) {
      const numMatch = line.match(/([0-9.,]+(?:\s*(?:k|m|rb|jt))?)/i);
      if (numMatch) {
        following = cleanOcrNumber(numMatch[1]);
      } else if (i > 0) {
        following = cleanOcrNumber(lines[i - 1]);
      }
    }

    // Detect Posts (Postingan / Kiriman)
    if (line.toLowerCase().includes('post') || line.toLowerCase().includes('kiriman') || line.toLowerCase().includes('postingan')) {
      const numMatch = line.match(/([0-9.,]+(?:\s*(?:k|m|rb|jt))?)/i);
      if (numMatch) {
        postsCount = cleanOcrNumber(numMatch[1]);
      } else if (i > 0) {
        postsCount = cleanOcrNumber(lines[i - 1]);
      }
    }
  }

  // Fallback: If username wasn't matched with @, look for clean handle on top lines
  if (!username && lines.length > 0) {
    const firstLine = lines[0].replace(/[^a-zA-Z0-9._]/g, '');
    if (firstLine.length >= 3 && firstLine.length <= 25) {
      username = firstLine;
    }
  }

  return {
    username,
    followers,
    following,
    postsCount,
    rawText: text,
  };
}

/**
 * Extract Post engagement metrics from OCR raw text (Likes, Comments, Views, Shares)
 */
export function extractPostFromText(text: string): ParsedPostOcr {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let likes: number | undefined;
  let comments: number | undefined;
  let views: number | undefined;
  let shares: number | undefined;
  const captionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Likes (Suka)
    if (lower.includes('like') || lower.includes('suka') || lower.includes('disukai')) {
      const numMatch = line.match(/([0-9.,]+(?:\s*(?:k|m|rb|jt))?)/i);
      if (numMatch) {
        likes = cleanOcrNumber(numMatch[1]);
      } else if (i > 0) {
        likes = cleanOcrNumber(lines[i - 1]);
      }
    }

    // Comments (Komentar / Komen)
    if (lower.includes('comment') || lower.includes('komentar') || lower.includes('komen')) {
      const numMatch = line.match(/([0-9.,]+(?:\s*(?:k|m|rb|jt))?)/i);
      if (numMatch) {
        comments = cleanOcrNumber(numMatch[1]);
      } else if (i > 0) {
        comments = cleanOcrNumber(lines[i - 1]);
      }
    }

    // Views (Tayangan / Tontonan / Views)
    if (lower.includes('view') || lower.includes('tayang') || lower.includes('tonton') || lower.includes('diputar')) {
      const numMatch = line.match(/([0-9.,]+(?:\s*(?:k|m|rb|jt))?)/i);
      if (numMatch) {
        views = cleanOcrNumber(numMatch[1]);
      } else if (i > 0) {
        views = cleanOcrNumber(lines[i - 1]);
      }
    }

    // Shares (Dibagikan / Bagikan / Share)
    if (lower.includes('share') || lower.includes('bagikan') || lower.includes('dibagikan')) {
      const numMatch = line.match(/([0-9.,]+(?:\s*(?:k|m|rb|jt))?)/i);
      if (numMatch) {
        shares = cleanOcrNumber(numMatch[1]);
      } else if (i > 0) {
        shares = cleanOcrNumber(lines[i - 1]);
      }
    }

    // Capture non-metric lines as caption candidate
    if (
      !lower.includes('like') &&
      !lower.includes('suka') &&
      !lower.includes('comment') &&
      !lower.includes('komentar') &&
      !lower.includes('view') &&
      !lower.includes('tayang') &&
      !lower.includes('share') &&
      line.length > 15
    ) {
      captionLines.push(line);
    }
  }

  // Fallback: If metrics weren't labeled with words, search for isolated metric counts
  // e.g. TikTok video sidebar layout: [12.4K, 850, 420]
  if (likes === undefined) {
    const standaloneNumbers = lines
      .map((l) => l.match(/^([0-9.,]+[kmrbjt]?)$/i))
      .filter(Boolean)
      .map((m) => cleanOcrNumber(m![1]))
      .filter((n) => n > 0);

    if (standaloneNumbers.length >= 1) likes = standaloneNumbers[0];
    if (standaloneNumbers.length >= 2) comments = standaloneNumbers[1];
    if (standaloneNumbers.length >= 3) shares = standaloneNumbers[2];
  }

  return {
    likes,
    comments,
    views,
    shares,
    caption: captionLines.slice(0, 2).join(' '),
    rawText: text,
  };
}

/**
 * Client-Side OCR Service using Tesseract.js Worker
 */
export class OcrService {
  private static workerPromise: Promise<any> | null = null;

  private static async getWorker(onProgress?: (progress: number) => void) {
    if (!this.workerPromise) {
      this.workerPromise = (async () => {
        const worker = await createWorker('eng');
        return worker;
      })();
    }
    const worker = await this.workerPromise;
    return worker;
  }

  /**
   * Run OCR on a Profile Screenshot
   */
  static async parseProfileScreenshot(
    fileOrBlob: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<ParsedProfileOcr> {
    const worker = await this.getWorker(onProgress);
    const { data } = await worker.recognize(fileOrBlob);
    return extractProfileFromText(data.text);
  }

  /**
   * Run OCR on a Post Screenshot (Reels, TikTok, Feed)
   */
  static async parsePostScreenshot(
    fileOrBlob: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<ParsedPostOcr> {
    const worker = await this.getWorker(onProgress);
    const { data } = await worker.recognize(fileOrBlob);
    return extractPostFromText(data.text);
  }
}
