export interface CsvPostRow {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook';
  username: string;
  followers: number;
  postDate: string;
  likes: number;
  comments: number;
  views?: number;
  shares?: number;
}

export interface CsvValidationResult {
  valid: boolean;
  errors: string[];
  totalRows: number;
  validRows: number;
  records: CsvPostRow[];
}

export class CsvService {
  /**
   * Parse and sanitize raw CSV text.
   * Defends against CSV Injection (DDE injection: =, +, -, @)
   */
  static parseAndValidate(csvContent: string): CsvValidationResult {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const errors: string[] = [];
    const records: CsvPostRow[] = [];

    if (lines.length < 2) {
      return {
        valid: false,
        errors: ['CSV file must contain a header row and at least one data row.'],
        totalRows: 0,
        validRows: 0,
        records: [],
      };
    }

    const header = lines[0]
      .split(',')
      .map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    const expectedHeaders = ['platform', 'username', 'followers', 'post_date', 'likes', 'comments'];
    for (const expected of expectedHeaders) {
      if (!header.includes(expected)) {
        errors.push(`Missing required column header: '${expected}'`);
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        totalRows: lines.length - 1,
        validRows: 0,
        records: [],
      };
    }

    const platformIdx = header.indexOf('platform');
    const usernameIdx = header.indexOf('username');
    const followersIdx = header.indexOf('followers');
    const dateIdx = header.indexOf('post_date');
    const likesIdx = header.indexOf('likes');
    const commentsIdx = header.indexOf('comments');
    const viewsIdx = header.indexOf('views');
    const sharesIdx = header.indexOf('shares');

    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawCols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

      if (rawCols.length < expectedHeaders.length) {
        errors.push(`Row ${lineNum}: Column count mismatch (expected at least ${expectedHeaders.length}, got ${rawCols.length})`);
        continue;
      }

      const platformVal = rawCols[platformIdx]?.toLowerCase();
      const validPlatforms = ['instagram', 'tiktok', 'youtube', 'facebook'];
      if (!validPlatforms.includes(platformVal)) {
        errors.push(`Row ${lineNum}: Platform must be 'instagram', 'tiktok', 'youtube', or 'facebook' (got '${platformVal}')`);
        continue;
      }

      let usernameVal = rawCols[usernameIdx];
      // Sanitize against spreadsheet formula injection
      if (/^[=+\-@]/.test(usernameVal)) {
        usernameVal = usernameVal.replace(/^[=+\-@]+/, '');
      }
      usernameVal = usernameVal.replace(/^@/, '').trim();

      if (!usernameVal || usernameVal.length < 2) {
        errors.push(`Row ${lineNum}: Invalid username`);
        continue;
      }

      const followers = parseInt(rawCols[followersIdx], 10);
      const likes = parseInt(rawCols[likesIdx], 10);
      const comments = parseInt(rawCols[commentsIdx], 10);
      const views = viewsIdx !== -1 && rawCols[viewsIdx] ? parseInt(rawCols[viewsIdx], 10) : undefined;
      const shares = sharesIdx !== -1 && rawCols[sharesIdx] ? parseInt(rawCols[sharesIdx], 10) : undefined;

      if (isNaN(followers) || followers < 0) {
        errors.push(`Row ${lineNum}: 'followers' must be a non-negative number`);
        continue;
      }
      if (isNaN(likes) || likes < 0) {
        errors.push(`Row ${lineNum}: 'likes' must be a non-negative number`);
        continue;
      }
      if (isNaN(comments) || comments < 0) {
        errors.push(`Row ${lineNum}: 'comments' must be a non-negative number`);
        continue;
      }

      records.push({
        platform: platformVal as 'instagram' | 'tiktok',
        username: usernameVal,
        followers,
        postDate: rawCols[dateIdx] || new Date().toISOString().split('T')[0],
        likes,
        comments,
        views: views !== undefined && !isNaN(views) ? views : undefined,
        shares: shares !== undefined && !isNaN(shares) ? shares : undefined,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      totalRows: lines.length - 1,
      validRows: records.length,
      records,
    };
  }
}
