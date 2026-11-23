export type InfluencerTier = 'NANO' | 'MICRO' | 'MID' | 'MACRO' | 'MEGA';

export interface RateCardDeliverable {
  key: 'STORY' | 'FEED_POST' | 'VIDEO';
  label: string;
  description: string;
  priceLow: number;
  priceMid: number;
  priceHigh: number;
  formattedRange: string;
  formattedMid: string;
}

export interface RateCardResult {
  tier: InfluencerTier;
  tierLabel: string;
  qualityMultiplier: number;
  erAssessment: 'LOW' | 'AVERAGE' | 'HIGH' | 'EXCELLENT';
  assessmentNote: string;
  deliverables: RateCardDeliverable[];
  currency: string;
}

export class RateCardCalculator {
  private static formatIDR(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Math.round(amount / 1000) * 1000); // Rounded to nearest thousand
  }

  static calculate(followers: number, engagementRate: number): RateCardResult {
    const validFollowers = Math.max(100, followers || 0);
    const validER = Math.max(0, engagementRate || 0);

    // 1. Determine Tier
    let tier: InfluencerTier = 'NANO';
    let tierLabel = 'Nano Influencer (1k - 10k)';
    let basePricePerFollower = 55; // IDR per follower

    if (validFollowers >= 1_000_000) {
      tier = 'MEGA';
      tierLabel = 'Mega Influencer (1M+)';
      basePricePerFollower = 28;
    } else if (validFollowers >= 250_000) {
      tier = 'MACRO';
      tierLabel = 'Macro Influencer (250k - 1M)';
      basePricePerFollower = 35;
    } else if (validFollowers >= 50_000) {
      tier = 'MID';
      tierLabel = 'Mid-Tier Influencer (50k - 250k)';
      basePricePerFollower = 42;
    } else if (validFollowers >= 10_000) {
      tier = 'MICRO';
      tierLabel = 'Micro Influencer (10k - 50k)';
      basePricePerFollower = 48;
    } else {
      tier = 'NANO';
      tierLabel = 'Nano Influencer (< 10k)';
      basePricePerFollower = 55;
    }

    // 2. ER Quality Multiplier
    let qualityMultiplier = 1.0;
    let erAssessment: RateCardResult['erAssessment'] = 'AVERAGE';
    let assessmentNote = 'Engagement rate dalam batas normal pasar.';

    if (validER >= 6.0) {
      qualityMultiplier = 1.5;
      erAssessment = 'EXCELLENT';
      assessmentNote = 'Engagement rate luar biasa tinggi (>6%). Nilai endorsement memiliki daya konversi premium.';
    } else if (validER >= 3.5) {
      qualityMultiplier = 1.25;
      erAssessment = 'HIGH';
      assessmentNote = 'Engagement rate di atas rata-rata industri (3.5% - 6%). Komunitas sangat aktif.';
    } else if (validER >= 1.5) {
      qualityMultiplier = 1.0;
      erAssessment = 'AVERAGE';
      assessmentNote = 'Engagement rate stabil dan wajar untuk audiens organik.';
    } else {
      qualityMultiplier = 0.8;
      erAssessment = 'LOW';
      assessmentNote = 'Engagement rate di bawah standar (<1.5%). Estimasi rate disesuaikan lebih konservatif.';
    }

    // 3. Calculate baseline feed post mid price
    // Minimum floor price: Rp 150.000 for nano
    const rawFeedMid = Math.max(150_000, validFollowers * basePricePerFollower * qualityMultiplier);

    // Deliverable format factors
    const deliverablesConfig = [
      {
        key: 'STORY' as const,
        label: 'Instagram / TikTok Story',
        description: 'Format vertikal 24 jam dengan link sticker atau mention langsung.',
        ratio: 0.35,
      },
      {
        key: 'FEED_POST' as const,
        label: 'Feed Post / Photo Carousel',
        description: 'Postingan permanen di feed dengan caption copywriting terstruktur.',
        ratio: 1.0,
      },
      {
        key: 'VIDEO' as const,
        label: 'Reels / TikTok Video (Shorts)',
        description: 'Video pendek vertikal dengan potensi distribusi organik FYP/Explore.',
        ratio: 1.45,
      },
    ];

    const deliverables: RateCardDeliverable[] = deliverablesConfig.map((item) => {
      const mid = rawFeedMid * item.ratio;
      const low = Math.round((mid * 0.8) / 10_000) * 10_000;
      const high = Math.round((mid * 1.35) / 10_000) * 10_000;
      const formattedMid = RateCardCalculator.formatIDR(mid);
      const formattedRange = `${RateCardCalculator.formatIDR(low)} - ${RateCardCalculator.formatIDR(high)}`;

      return {
        key: item.key,
        label: item.label,
        description: item.description,
        priceLow: low,
        priceMid: Math.round(mid / 10_000) * 10_000,
        priceHigh: high,
        formattedMid,
        formattedRange,
      };
    });

    return {
      tier,
      tierLabel,
      qualityMultiplier,
      erAssessment,
      assessmentNote,
      deliverables,
      currency: 'IDR',
    };
  }
}
