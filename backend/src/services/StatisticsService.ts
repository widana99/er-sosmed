/**
 * Statistics Service: Comprehensive Mathematical & Statistical Operations for Social Media Metrics
 */

export interface MinMaxResult {
  min: number;
  max: number;
  spread: number;
}

export interface QuartilesResult {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
}

export interface DistributionResult {
  viralCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  viralPct: number;
  highPct: number;
  moderatePct: number;
  lowPct: number;
}

export interface InteractionQualityResult {
  ratio: number; // in percentage e.g. 2.45%
  botRisk: 'LOW' | 'MODERATE' | 'HIGH';
  reason?: string;
}

export class StatisticsService {
  /**
   * Calculate Median of a numerical array
   */
  static calculateMedian(values: number[]): number {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 !== 0) {
      return Number(sorted[mid].toFixed(2));
    }
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  }

  /**
   * Calculate Min, Max, and Spread Range
   */
  static calculateMinMax(values: number[]): MinMaxResult {
    if (!values || values.length === 0) {
      return { min: 0, max: 0, spread: 0 };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Number((max - min).toFixed(2));
    return {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      spread,
    };
  }

  /**
   * Calculate Quartiles (Q1, Median/Q2, Q3, and IQR)
   */
  static calculateQuartiles(values: number[]): QuartilesResult {
    if (!values || values.length === 0) {
      return { q1: 0, median: 0, q3: 0, iqr: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const median = this.calculateMedian(sorted);

    let lowerHalf: number[];
    let upperHalf: number[];

    if (n % 2 === 0) {
      lowerHalf = sorted.slice(0, n / 2);
      upperHalf = sorted.slice(n / 2);
    } else {
      const mid = Math.floor(n / 2);
      lowerHalf = sorted.slice(0, mid);
      upperHalf = sorted.slice(mid + 1);
    }

    const q1 = lowerHalf.length > 0 ? this.calculateMedian(lowerHalf) : sorted[0];
    const q3 = upperHalf.length > 0 ? this.calculateMedian(upperHalf) : sorted[n - 1];
    const iqr = Number(Math.max(0, q3 - q1).toFixed(2));

    return {
      q1: Number(q1.toFixed(2)),
      median: Number(median.toFixed(2)),
      q3: Number(q3.toFixed(2)),
      iqr,
    };
  }

  /**
   * Calculate Consistency Score (0 - 100%) based on Coefficient of Variation (CV = stdDev / mean)
   * A low variance relative to mean yields a high consistency score (approaching 100%).
   * A high variance (e.g. 1 viral post and rest dead) yields a low score.
   */
  static calculateConsistency(values: number[]): number {
    if (!values || values.length <= 1) return 100;
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    if (mean === 0) return 0;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    // Mapping CV to score: CV = 0 -> 100%, CV = 0.5 -> ~75%, CV >= 2.0 -> ~0%
    const score = Math.max(0, Math.min(100, Math.round(100 / (1 + cv * 1.5))));
    return score;
  }

  /**
   * Categorize ER values into Performance Distribution Buckets:
   * - Viral: > 8%
   * - High: 5% - 8%
   * - Moderate: 2% - 5%
   * - Low: < 2%
   */
  static calculateDistribution(erValues: number[]): DistributionResult {
    if (!erValues || erValues.length === 0) {
      return {
        viralCount: 0,
        highCount: 0,
        moderateCount: 0,
        lowCount: 0,
        viralPct: 0,
        highPct: 0,
        moderatePct: 0,
        lowPct: 0,
      };
    }

    const total = erValues.length;
    let viral = 0;
    let high = 0;
    let moderate = 0;
    let low = 0;

    for (const er of erValues) {
      if (er > 8.0) {
        viral++;
      } else if (er >= 5.0) {
        high++;
      } else if (er >= 2.0) {
        moderate++;
      } else {
        low++;
      }
    }

    return {
      viralCount: viral,
      highCount: high,
      moderateCount: moderate,
      lowCount: low,
      viralPct: Number(((viral / total) * 100).toFixed(1)),
      highPct: Number(((high / total) * 100).toFixed(1)),
      moderatePct: Number(((moderate / total) * 100).toFixed(1)),
      lowPct: Number(((low / total) * 100).toFixed(1)),
    };
  }

  /**
   * Evaluate Comment-to-Like Ratio and Bot / Artificial Engagement Risk
   * Healthy accounts typically exhibit a 1.5% - 5.0% comment-to-like ratio.
   * If likes are astronomical (>10k) but comments are near zero (<0.2%), bot risk is HIGH.
   */
  static evaluateInteractionQuality(totalLikes: number, totalComments: number): InteractionQualityResult {
    if (totalLikes <= 0) {
      return { ratio: 0, botRisk: 'LOW', reason: 'Belum ada data suka yang cukup.' };
    }

    const ratio = Number(((totalComments / totalLikes) * 100).toFixed(2));

    if (totalLikes >= 5000 && ratio < 0.2) {
      return {
        ratio,
        botRisk: 'HIGH',
        reason: 'Rasio komentar sangat rendah dibandingkan jumlah suka (<0.2%). Terdapat indikasi engagement pasif atau bot likes.',
      };
    }

    if (totalLikes >= 1000 && ratio < 0.6) {
      return {
        ratio,
        botRisk: 'MODERATE',
        reason: 'Rasio komentar di bawah rata-rata industri (0.6%). Sebagian besar audiens bersifat pasif.',
      };
    }

    return {
      ratio,
      botRisk: 'LOW',
      reason: 'Rasio interaksi sehat & wajar. Interaksi komentar menunjukkan audiens yang aktif dan responsif.',
    };
  }
}
