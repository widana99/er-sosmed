import React, { useState, useMemo } from 'react';
import {
  Tag,
  Filter,
  ExternalLink,
  Search,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { SocialPost } from '../services/api.js';

interface PostContentNicheSectionProps {
  posts: SocialPost[];
  platform: string;
  followers?: number;
  primaryNiche?: string;
  nicheBreakdown?: Array<{
    niche: string;
    count: number;
    percentage: number;
    averageER?: number;
  }>;
}

export function getNicheBadgeStyle(niche?: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const n = (niche || '').toLowerCase();

  if (n.includes('parenting') || n.includes('anak') || n.includes('bayi') || n.includes('kids')) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
    };
  }
  if (n.includes('otomotif') || n.includes('mobil') || n.includes('motor')) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
    };
  }
  if (n.includes('beauty') || n.includes('skincare') || n.includes('makeup')) {
    return {
      bg: 'bg-pink-500/10 dark:bg-pink-500/20',
      text: 'text-pink-700 dark:text-pink-400',
      border: 'border-pink-500/30',
      dot: 'bg-pink-500',
    };
  }
  if (n.includes('fashion') || n.includes('ootd') || n.includes('hijab')) {
    return {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500/30',
      dot: 'bg-purple-500',
    };
  }
  if (n.includes('kuliner') || n.includes('makanan') || n.includes('food')) {
    return {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/30',
      dot: 'bg-orange-500',
    };
  }
  if (n.includes('affiliate') || n.includes('keranjang') || n.includes('promo')) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500',
    };
  }
  if (n.includes('edukasi') || n.includes('bisnis') || n.includes('finansial')) {
    return {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-500',
    };
  }
  if (n.includes('politik') || n.includes('kebijakan')) {
    return {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-500/30',
      dot: 'bg-slate-500',
    };
  }
  if (n.includes('hiburan') || n.includes('komedi') || n.includes('meme')) {
    return {
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
      text: 'text-yellow-800 dark:text-yellow-400',
      border: 'border-yellow-500/30',
      dot: 'bg-yellow-500',
    };
  }
  if (n.includes('vlog') || n.includes('lifestyle')) {
    return {
      bg: 'bg-teal-500/10 dark:bg-teal-500/20',
      text: 'text-teal-700 dark:text-teal-400',
      border: 'border-teal-500/30',
      dot: 'bg-teal-500',
    };
  }

  return {
    bg: 'bg-gray-500/10 dark:bg-gray-500/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-500/30',
    dot: 'bg-gray-400',
  };
}

export const PostContentNicheSection: React.FC<PostContentNicheSectionProps> = ({
  posts,
  platform,
  followers = 1,
  primaryNiche,
  nicheBreakdown,
}) => {
  const [selectedNiche, setSelectedNiche] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'ER' | 'VIEWS' | 'LIKES'>('NEWEST');

  // Compute breakdown if not provided by backend
  const calculatedBreakdown = useMemo(() => {
    if (nicheBreakdown && nicheBreakdown.length > 0) return nicheBreakdown;

    const map = new Map<string, number>();
    posts.forEach((p) => {
      const niche = p.contentNiche || 'Umum / Personal';
      map.set(niche, (map.get(niche) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([niche, count]) => ({
        niche,
        count,
        percentage: posts.length > 0 ? Number(((count / posts.length) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [posts, nicheBreakdown]);

  const dominantNiche = primaryNiche || (calculatedBreakdown[0]?.niche ?? 'Umum / Personal');

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (selectedNiche !== 'ALL') {
      result = result.filter((p) => (p.contentNiche || 'Umum / Personal') === selectedNiche);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.caption && p.caption.toLowerCase().includes(q)) ||
          (p.contentNiche && p.contentNiche.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'ER') {
        const erA = a.postEr ?? 0;
        const erB = b.postEr ?? 0;
        return erB - erA;
      }
      if (sortBy === 'VIEWS') {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === 'LIKES') {
        return (b.likes || 0) - (a.likes || 0);
      }
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });

    return result;
  }, [posts, selectedNiche, searchQuery, sortBy]);

  if (!posts || posts.length === 0) {
    return null;
  }

  const dominantStyle = getNicheBadgeStyle(dominantNiche);

  return (
    <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header with Dominant Niche Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-ink-primary-light dark:text-ink-primary-dark tracking-tight">
              Klasifikasi Jenis Konten Postingan
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-brand/10 text-brand border border-brand/20">
              {posts.length} Post
            </span>
          </div>
          <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
            Deteksi pilar konten otomatis berbasis pemindaian semantik dan keyword hashtag seluruh postingan.
          </p>
        </div>

        {/* Dominant Niche Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark uppercase tracking-wider">
            Niche Utama:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${dominantStyle.bg} ${dominantStyle.text} ${dominantStyle.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dominantStyle.dot}`} />
            {dominantNiche}
          </span>
        </div>
      </div>

      {/* Niche Breakdown Pills (Quick Filter) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono">
          <span>Filter Kategori Konten:</span>
          <span>Menampilkan {filteredPosts.length} dari {posts.length} postingan</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedNiche('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border ${
              selectedNiche === 'ALL'
                ? 'bg-brand text-white border-brand shadow-xs'
                : 'bg-surface-subtle-light dark:bg-surface-subtle-dark text-ink-secondary-light dark:text-ink-secondary-dark border-black/10 dark:border-white/10 hover:border-brand/40'
            }`}
          >
            Semua ({posts.length})
          </button>

          {calculatedBreakdown.map((item) => {
            const isSelected = selectedNiche === item.niche;
            const style = getNicheBadgeStyle(item.niche);
            return (
              <button
                key={item.niche}
                type="button"
                onClick={() => setSelectedNiche(item.niche)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border ${
                  isSelected
                    ? `${style.bg} ${style.text} ${style.border} ring-2 ring-brand/30`
                    : 'bg-surface-subtle-light dark:bg-surface-subtle-dark text-ink-secondary-light dark:text-ink-secondary-dark border-black/10 dark:border-white/10 hover:border-black/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                <span>{item.niche}</span>
                <span className="opacity-70 text-[10px]">({item.count} • {item.percentage}%)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary-light dark:text-ink-tertiary-dark" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari caption, hashtag, atau keyword..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 rounded-lg text-ink-primary-light dark:text-ink-primary-dark placeholder:text-ink-tertiary-light focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-ink-tertiary-light dark:text-ink-tertiary-dark" />
          <span className="text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-mono bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-ink-primary-light dark:text-ink-primary-dark focus:outline-none focus:border-brand"
          >
            <option value="NEWEST">Terbaru</option>
            <option value="ER">ER Tertinggi</option>
            <option value="VIEWS">Views Terbanyak</option>
            <option value="LIKES">Likes Terbanyak</option>
          </select>
        </div>
      </div>

      {/* Posts Table with Niche Badges */}
      <div className="overflow-x-auto border border-black/10 dark:border-white/10 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-subtle-light dark:bg-surface-subtle-dark border-b border-black/10 dark:border-white/10 text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">No</th>
              <th className="py-2.5 px-3 min-w-[150px]">Jenis Konten (Niche)</th>
              <th className="py-2.5 px-3 min-w-[100px]">Tanggal</th>
              <th className="py-2.5 px-3 min-w-[240px]">Caption & Link</th>
              <th className="py-2.5 px-3 text-right">Views</th>
              <th className="py-2.5 px-3 text-right">Likes</th>
              <th className="py-2.5 px-3 text-right">Komen</th>
              <th className="py-2.5 px-3 text-right">Shares</th>
              <th className="py-2.5 px-3 text-right">Post ER</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
            {filteredPosts.map((post, idx) => {
              const niche = post.contentNiche || 'Umum / Personal';
              const style = getNicheBadgeStyle(niche);

              let erVal = post.postEr;
              if (erVal === undefined || erVal === null) {
                const l = post.likes || 0;
                const c = post.comments || 0;
                const s = post.shares || 0;
                const v = post.views || 0;
                if (platform.toUpperCase() === 'TIKTOK' && v > 0) {
                  erVal = Number((((l + c + s) / v) * 100).toFixed(2));
                } else if (followers > 0) {
                  erVal = Number((((l + c + s) / followers) * 100).toFixed(2));
                } else {
                  erVal = 0;
                }
              }

              return (
                <tr
                  key={post.id || `post-${idx}`}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="py-3 px-3 text-center font-semibold text-brand">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {niche}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-ink-tertiary-light dark:text-ink-tertiary-dark whitespace-nowrap text-[11px]">
                    {post.postedAt
                      ? new Date(post.postedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="py-3 px-3 font-sans text-ink-primary-light dark:text-ink-primary-dark max-w-xs">
                    {post.postUrl ? (
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-brand hover:underline transition-colors line-clamp-1"
                        title={post.caption || 'Lihat postingan asli'}
                      >
                        <span className="truncate">{post.caption || 'Tanpa deskripsi'}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0 text-brand" />
                      </a>
                    ) : (
                      <span className="line-clamp-1">{post.caption || '—'}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-ink-secondary-light dark:text-ink-secondary-dark">
                    {post.views !== null && post.views !== undefined ? post.views.toLocaleString('id-ID') : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                    {post.likes.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-right text-ink-secondary-light dark:text-ink-secondary-dark">
                    {post.comments.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-right text-ink-secondary-light dark:text-ink-secondary-dark">
                    {post.shares !== null && post.shares !== undefined ? post.shares.toLocaleString('id-ID') : '0'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-ink-primary-light dark:text-ink-primary-dark">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        erVal >= 5
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : erVal >= 2.5
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : erVal >= 1
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'text-ink-tertiary-light dark:text-ink-tertiary-dark'
                      }`}
                    >
                      {erVal.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

