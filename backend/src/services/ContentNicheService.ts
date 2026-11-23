export interface NicheBreakdownItem {
  niche: string;
  count: number;
  percentage: number;
  averageER?: number;
}

export const NICHE_DEFINITIONS: Record<string, string[]> = {
  'Parenting & Kids': [
    'anak', 'bayi', 'kids', 'mommy', 'bunda', 'si kecil', 'purela', 'odol',
    'pastagigianak', 'popok', 'parenting', 'balita', 'mpasi', 'gigisensitif',
    'ibu dan anak', 'kebutuhan si kecil', 'kebiasaan baik', 'gigiberlubang', 'gigibungsu'
  ],
  'Otomotif & Kendaraan': [
    'suzuki', 'dealer', 'mobil', 'motor', 'sales suzuki', 'promo mobil',
    'kredit mobil', 'honda', 'yamaha', 'toyota', 'daihatsu', 'mitsubishi',
    'brio', 'avanza', 'otomotif', 'test drive', 'showroom', 'angsuran', 'bengkel'
  ],
  'Beauty & Skincare': [
    'skincare', 'glowing', 'jerawat', 'serum', 'toner', 'cushion', 'sunscreen',
    'lipcream', 'lipstick', 'whitening', 'bodycare', 'facial', 'kecantikan',
    'makeup', 'perawatan kulit', 'parfum', 'lotion', 'beautytips'
  ],
  'Fashion & OOTD': [
    'ootd', 'fashion', 'hijab', 'gamis', 'dress', 'outfit', 'blus', 'tunik',
    'celana', 'kulot', 'tas', 'sepatu', 'styling', 'kemeja', 'kaos', 'baju'
  ],
  'Kuliner & Makanan': [
    'resep', 'kuliner', 'makanan', 'masak', 'cemilan', 'jajanan', 'cafe',
    'mukbang', 'restoran', 'pedas', 'enak', 'viral food', 'bikin nagih'
  ],
  'Affiliate & Keranjang Kuning': [
    'keranjang kuning', 'affiliate', 'spill', 'diskon', 'cek keranjang',
    'murah meriah', 'rekomendasi produk', 'unboxing', 'olshop', 'shopee haul',
    'tiktok shop', 'beli disini', 'klik keranjang', 'racun tiktok'
  ],
  'Edukasi & Bisnis': [
    'edukasi', 'belajar', 'tips', 'tutorial', 'cara', 'wawasan', 'informasi',
    'fakta', 'sejarah', 'penelitian', 'riset', 'ilmu', 'pengetahuan', 'kampus',
    'mahasiswa', 'sekolah', 'literasi', 'membaca', 'teknologi', 'data', 'analisis',
    'ekonomi', 'bisnis', 'investasi', 'keuangan', 'finansial', 'uang', 'rupiah',
    'pasar', 'harga', 'umkm', 'usaha', 'industri', 'saham', 'kripto', 'modal'
  ],
  'Politik & Kebijakan Publik': [
    'pemerintah', 'presiden', 'prabowo', 'menteri', 'dpr', 'kebijakan', 'anggaran',
    'rakyat', 'negara', 'kementerian', 'pilkada', 'pemilu', 'partai', 'politik',
    'pejabat', 'birokrasi', 'program', 'mbg', 'makan bergizi', 'ikn', 'nusantara',
    'hukum', 'korupsi', 'ruu', 'sidang', 'demokrasi', 'konstitusi', 'aparatur'
  ],
  'Hiburan, Komedi & Meme': [
    'lucu', 'ngakak', 'komedi', 'lawak', 'parodi', 'sketsa', 'humor',
    'meme', 'hiburan', 'drama', 'prank', 'seru', 'asik'
  ],
  'Daily Vlog & Lifestyle': [
    'daily vlog', 'a day in my life', 'keseharian', 'rutinitas', 'cerita',
    'aesthetic', 'lifestyle', 'curhat', 'quotes', 'santai', 'kopi', 'nongkrong'
  ],
};

export class ContentNicheService {
  /**
   * Classify an individual caption string into a single primary content niche.
   */
  static classifyCaption(caption?: string): string {
    if (!caption || typeof caption !== 'string') return 'Umum / Personal';
    const text = caption.toLowerCase();

    const scores: Record<string, number> = {};
    for (const [niche, keywords] of Object.entries(NICHE_DEFINITIONS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          score += kw.length > 5 ? 2 : 1;
        }
      }
      if (score > 0) scores[niche] = score;
    }

    const entries = Object.entries(scores);
    if (entries.length === 0) return 'Umum / Personal';

    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  /**
   * Analyze an account's collective content and generate niche distribution percentages.
   */
  static classifyAccount(
    username: string,
    displayName: string,
    biography: string = '',
    posts: any[] = []
  ): {
    primaryNiche: string;
    nicheBreakdown: NicheBreakdownItem[];
  } {
    const counts: Record<string, { count: number; totalER: number }> = {};

    posts.forEach((p) => {
      const niche = p.contentNiche || this.classifyCaption(p.caption);
      if (!counts[niche]) counts[niche] = { count: 0, totalER: 0 };
      counts[niche].count++;
      if (p.postEr) counts[niche].totalER += Number(p.postEr);
    });

    const totalPosts = posts.length;
    let nicheBreakdown: NicheBreakdownItem[] = [];

    if (totalPosts > 0) {
      nicheBreakdown = Object.entries(counts)
        .map(([niche, data]) => ({
          niche,
          count: data.count,
          percentage: Number(((data.count / totalPosts) * 100).toFixed(1)),
          averageER: data.count > 0 ? Number((data.totalER / data.count).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    }

    let primaryNiche = nicheBreakdown.length > 0 ? nicheBreakdown[0].niche : 'Umum / Personal';

    // If all posts are categorized as general but bio or display name strongly suggests a niche
    if (primaryNiche === 'Umum / Personal') {
      const bioNiche = this.classifyCaption(`${username} ${displayName} ${biography}`);
      if (bioNiche !== 'Umum / Personal') {
        primaryNiche = bioNiche;
      }
    }

    return {
      primaryNiche,
      nicheBreakdown,
    };
  }

  /**
   * Enriches all posts with their individual contentNiche and calculated postEr.
   */
  static decoratePosts(posts: any[], platform: string = 'TIKTOK', followers: number = 1): any[] {
    if (!Array.isArray(posts)) return [];

    const platStr = typeof platform === 'string' ? platform.toUpperCase() : 'TIKTOK';
    const folNum = typeof followers === 'number' && followers > 0 ? followers : 1;

    return posts.map((p) => {
      const cap = p.caption || '';
      const contentNiche = p.contentNiche || this.classifyCaption(cap);

      let postEr = 0;
      const likes = Number(p.likes || 0);
      const comments = Number(p.comments || 0);
      const shares = Number(p.shares || 0);
      const views = Number(p.views || 0);

      if ((platStr === 'TIKTOK' || platStr === 'YOUTUBE') && views > 0) {
        postEr = Number((((likes + comments + shares) / views) * 100).toFixed(2));
      } else if (platStr === 'FACEBOOK') {
        if (views > 0 && ['VIDEO', 'REEL'].includes(String(p.contentType || '').toUpperCase())) {
          postEr = Number((((likes + comments + shares) / views) * 100).toFixed(2));
        } else if (folNum > 0) {
          postEr = Number((((likes + comments + shares) / folNum) * 100).toFixed(2));
        }
      } else if (folNum > 0) {
        postEr = Number((((likes + comments + shares) / folNum) * 100).toFixed(2));
      }

      return {
        ...p,
        contentNiche,
        postEr: p.postEr !== undefined ? p.postEr : postEr,
      };
    });
  }
}
