import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Indonesian Stopwords
INDONESIAN_STOPWORDS = {
    'yang', 'di', 'dan', 'ini', 'itu', 'dari', 'untuk', 'dengan', 'ke', 'pada',
    'adalah', 'sebagai', 'dalam', 'bisa', 'ada', 'tidak', 'akan', 'atau', 'juga',
    'karena', 'oleh', 'saat', 'sudah', 'telah', 'hanya', 'lebih', 'harus', 'kami',
    'kita', 'mereka', 'anda', 'kamu', 'saya', 'dia', 'ia', 'apa', 'siapa', 'kapan',
    'dimana', 'kenapa', 'mengapa', 'bagaimana', 'ya', 'lah', 'kan', 'dong', 'nih',
    'tuh', 'sih', 'kok', 'deh', 'lagi', 'mau', 'jadi', 'buat', 'kalau', 'bila',
    'jika', 'agar', 'supaya', 'namun', 'tetapi', 'melainkan', 'padahal', 'tentang',
    'seperti', 'antara', 'hingga', 'sampai', 'sejak', 'tanpa', 'secara', 'pun',
    'para', 'suatu', 'setiap', 'masing', 'seluruh', 'semua', 'banyak', 'beberapa',
    'sedikit', 'tersebut', 'begini', 'begitu', 'sini', 'situ', 'sana', 'amat',
    'sangat', 'sekali', 'cukup', 'kurang', 'paling', 'agak', 'terus', 'kembali'
}

# Thematic Topic Definitions with Indonesian keywords
TOPIC_DEFINITIONS = {
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
    'Beauty, Skincare & Personal Care': [
        'skincare', 'glowing', 'jerawat', 'serum', 'toner', 'cushion', 'sunscreen',
        'lipcream', 'lipstick', 'whitening', 'bodycare', 'facial', 'kecantikan',
        'makeup', 'perawatan kulit', 'parfum', 'lotion', 'beautytips'
    ],
    'Fashion & OOTD': [
        'ootd', 'fashion', 'hijab', 'gamis', 'dress', 'outfit', 'blus', 'tunik',
        'celana', 'kulot', 'tas', 'sepatu', 'styling', 'kemeja', 'kaos', 'baju'
    ],
    'Kuliner & Food Review': [
        'resep', 'kuliner', 'makanan', 'masak', 'cemilan', 'jajanan', 'cafe',
        'mukbang', 'restoran', 'pedas', 'enak', 'viral food', 'bikin nagih'
    ],
    'Affiliate, Promo & Keranjang Kuning': [
        'keranjang kuning', 'affiliate', 'spill', 'diskon', 'cek keranjang',
        'murah meriah', 'rekomendasi produk', 'unboxing', 'olshop', 'shopee haul',
        'tiktok shop', 'beli disini', 'klik keranjang', 'racun tiktok'
    ],
    'Edukasi, Bisnis & Finansial': [
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
}

DAY_NAMES_ID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

class ContentAnalyzer:
    """
    AI Content Intelligence Engine for Indonesian Social Media Creators.
    Performs empirical topic classification, keyword effectiveness analysis,
    temporal posting patterns, and caption structure metrics.
    """

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    @staticmethod
    def extract_hashtags(text: str) -> List[str]:
        if not text:
            return []
        tags = re.findall(r'#([a-zA-Z0-9_\u00C0-\u024F]+)', text)
        return [f"#{t.lower()}" for t in tags]

    @classmethod
    def classify_topic(cls, text: str) -> str:
        cleaned = text.lower()
        topic_scores = {topic: 0 for topic in TOPIC_DEFINITIONS}

        for topic, keywords in TOPIC_DEFINITIONS.items():
            for kw in keywords:
                if kw in cleaned:
                    topic_scores[topic] += 1

        best_topic = max(topic_scores, key=topic_scores.get)
        if topic_scores[best_topic] > 0:
            return best_topic
        return 'Umum & Komunikasi'

    @classmethod
    def analyze_posts(
        cls,
        posts: List[Dict[str, Any]],
        followers: int = 1,
        platform: str = 'TIKTOK'
    ) -> Dict[str, Any]:
        if not posts:
            return {
                'totalPosts': 0,
                'topics': [],
                'topKeywords': [],
                'topHashtags': [],
                'bestTimes': [],
                'bestDays': [],
                'captionLengthInsights': {},
                'hookEffectiveness': {}
            }

        total_posts = len(posts)
        topic_counts: Dict[str, Dict[str, Any]] = {}
        all_hashtags: Dict[str, Dict[str, Any]] = {}
        hour_stats: Dict[int, Dict[str, Any]] = {h: {'count': 0, 'er_sum': 0.0, 'views_sum': 0} for h in range(24)}
        day_stats: Dict[int, Dict[str, Any]] = {d: {'count': 0, 'er_sum': 0.0, 'views_sum': 0} for d in range(7)}
        caption_length_buckets = {
            'Singkat (< 80 karakter)': {'count': 0, 'er_sum': 0.0, 'views_sum': 0},
            'Sedang (80 - 200 karakter)': {'count': 0, 'er_sum': 0.0, 'views_sum': 0},
            'Panjang (> 200 karakter)': {'count': 0, 'er_sum': 0.0, 'views_sum': 0}
        }
        hook_types = {
            'Pertanyaan (Tanya Opini)': {'count': 0, 'er_sum': 0.0},
            'Pernyataan Tegas / Fakta': {'count': 0, 'er_sum': 0.0},
            'Seruan / Ajakan Langsung': {'count': 0, 'er_sum': 0.0},
            'Deskriptif Biasa': {'count': 0, 'er_sum': 0.0}
        }

        corpus = []
        analyzed_posts = []

        for p in posts:
            caption = str(p.get('caption') or '').strip()
            likes = int(p.get('likes') or 0)
            comments = int(p.get('comments') or 0)
            views = int(p.get('views') or 0)
            shares = int(p.get('shares') or 0)
            saves = int(p.get('saves') or 0)

            # Calculate individual Post ER
            if platform.upper() == 'TIKTOK' and views > 0:
                post_er = round(((likes + comments + shares) / views) * 100, 2)
            else:
                post_er = round(((likes + comments + shares) / max(followers, 1)) * 100, 2)

            # 1. Topic categorization
            topic = cls.classify_topic(caption)
            if topic not in topic_counts:
                topic_counts[topic] = {'name': topic, 'count': 0, 'er_sum': 0.0, 'views_sum': 0, 'likes_sum': 0}
            topic_counts[topic]['count'] += 1
            topic_counts[topic]['er_sum'] += post_er
            topic_counts[topic]['views_sum'] += views
            topic_counts[topic]['likes_sum'] += likes

            # Build enriched post item
            enriched_post = dict(p)
            enriched_post['contentNiche'] = topic
            enriched_post['postEr'] = post_er
            analyzed_posts.append(enriched_post)

            # 2. Hashtags
            tags = cls.extract_hashtags(caption)
            for t in tags:
                if t not in all_hashtags:
                    all_hashtags[t] = {'tag': t, 'count': 0, 'er_sum': 0.0, 'views_sum': 0}
                all_hashtags[t]['count'] += 1
                all_hashtags[t]['er_sum'] += post_er
                all_hashtags[t]['views_sum'] += views

            # 3. Temporal (Hour & Day)
            raw_date = p.get('postedAt')
            if raw_date:
                try:
                    if isinstance(raw_date, str):
                        dt = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
                    elif isinstance(raw_date, datetime):
                        dt = raw_date
                    else:
                        dt = datetime.now()
                    h = dt.hour
                    d = dt.weekday() # 0 = Monday, 6 = Sunday
                    hour_stats[h]['count'] += 1
                    hour_stats[h]['er_sum'] += post_er
                    hour_stats[h]['views_sum'] += views

                    day_stats[d]['count'] += 1
                    day_stats[d]['er_sum'] += post_er
                    day_stats[d]['views_sum'] += views
                except Exception:
                    pass

            # 4. Caption Length Analysis
            c_len = len(caption)
            if c_len < 80:
                b_name = 'Singkat (< 80 karakter)'
            elif c_len <= 200:
                b_name = 'Sedang (80 - 200 karakter)'
            else:
                b_name = 'Panjang (> 200 karakter)'
            caption_length_buckets[b_name]['count'] += 1
            caption_length_buckets[b_name]['er_sum'] += post_er
            caption_length_buckets[b_name]['views_sum'] += views

            # 5. Hook Analysis
            c_clean = caption.lower()
            if '?' in caption or c_clean.startswith(('kenapa', 'bagaimana', 'apakah', 'siapa', 'kira-kira', 'gimana', 'bisa gak')):
                h_name = 'Pertanyaan (Tanya Opini)'
            elif any(c_clean.startswith(w) for w in ['simak', 'tonton', 'yuk', 'mari', 'jangan lupa', 'wajib', 'catat']):
                h_name = 'Seruan / Ajakan Langsung'
            elif any(c_clean.startswith(w) for w in ['fakta', 'update', 'ternyata', 'resmi', 'terbongkar', 'penting']):
                h_name = 'Pernyataan Tegas / Fakta'
            else:
                h_name = 'Deskriptif Biasa'
            hook_types[h_name]['count'] += 1
            hook_types[h_name]['er_sum'] += post_er

            # Collect cleaned caption for TF-IDF keyword extraction
            cleaned_words = re.findall(r'[a-zA-Z]{3,}', caption.lower())
            filtered = [w for w in cleaned_words if w not in INDONESIAN_STOPWORDS and not w.startswith('http')]
            if filtered:
                corpus.append(" ".join(filtered))

        # Format Topic Results
        formatted_topics = []
        for t_name, t_data in topic_counts.items():
            cnt = t_data['count']
            formatted_topics.append({
                'topic': t_name,
                'count': cnt,
                'percentage': round((cnt / total_posts) * 100, 1),
                'averageER': round(t_data['er_sum'] / cnt, 2) if cnt > 0 else 0.0,
                'averageViews': round(t_data['views_sum'] / cnt, 1) if cnt > 0 else 0.0,
                'averageLikes': round(t_data['likes_sum'] / cnt, 1) if cnt > 0 else 0.0
            })
        formatted_topics.sort(key=lambda x: x['count'], reverse=True)

        # Format Hashtag Results
        formatted_hashtags = []
        for h_tag, h_data in all_hashtags.items():
            cnt = h_data['count']
            formatted_hashtags.append({
                'hashtag': h_tag,
                'count': cnt,
                'averageER': round(h_data['er_sum'] / cnt, 2) if cnt > 0 else 0.0,
                'averageViews': round(h_data['views_sum'] / cnt, 1) if cnt > 0 else 0.0
            })
        formatted_hashtags.sort(key=lambda x: (x['count'] >= 2, x['averageER']), reverse=True)
        top_hashtags = formatted_hashtags[:12]

        # Extract Key Keywords via TF-IDF
        top_keywords = []
        if len(corpus) >= 2:
            try:
                tfidf = TfidfVectorizer(max_features=25, stop_words=list(INDONESIAN_STOPWORDS), ngram_range=(1, 2))
                tfidf_matrix = tfidf.fit_transform(corpus)
                feature_names = tfidf.get_feature_names_out()
                scores = np.asarray(tfidf_matrix.mean(axis=0)).ravel()
                
                kw_scores = [(feature_names[i], float(scores[i])) for i in range(len(feature_names))]
                kw_scores.sort(key=lambda x: x[1], reverse=True)
                top_keywords = [{'keyword': kw, 'impactScore': round(sc * 100, 1)} for kw, sc in kw_scores[:12]]
            except Exception:
                top_keywords = []

        # Format Best Times & Best Days
        best_hours = []
        for h, d in hour_stats.items():
            if d['count'] > 0:
                best_hours.append({
                    'hour': f"{h:02d}:00",
                    'count': d['count'],
                    'averageER': round(d['er_sum'] / d['count'], 2),
                    'averageViews': round(d['views_sum'] / d['count'], 1)
                })
        best_hours.sort(key=lambda x: x['averageER'], reverse=True)

        best_days = []
        for day_idx, d in day_stats.items():
            if d['count'] > 0:
                best_days.append({
                    'day': DAY_NAMES_ID[day_idx],
                    'count': d['count'],
                    'averageER': round(d['er_sum'] / d['count'], 2),
                    'averageViews': round(d['views_sum'] / d['count'], 1)
                })
        best_days.sort(key=lambda x: x['averageER'], reverse=True)

        # Format Caption Length Insights
        length_insights = []
        for b_name, b_data in caption_length_buckets.items():
            cnt = b_data['count']
            if cnt > 0:
                length_insights.append({
                    'category': b_name,
                    'count': cnt,
                    'averageER': round(b_data['er_sum'] / cnt, 2),
                    'averageViews': round(b_data['views_sum'] / cnt, 1)
                })

        # Format Hook Effectiveness
        hooks_insights = []
        for h_name, h_data in hook_types.items():
            cnt = h_data['count']
            if cnt > 0:
                hooks_insights.append({
                    'hookType': h_name,
                    'count': cnt,
                    'averageER': round(h_data['er_sum'] / cnt, 2)
                })
        hooks_insights.sort(key=lambda x: x['averageER'], reverse=True)

        primary_niche = formatted_topics[0]['topic'] if formatted_topics else 'Umum & Komunikasi'

        return {
            'totalPostsAnalyzed': total_posts,
            'primaryNiche': primary_niche,
            'topics': formatted_topics,
            'topKeywords': top_keywords,
            'topHashtags': top_hashtags,
            'bestPostingHours': best_hours[:5],
            'bestPostingDays': best_days,
            'captionLengthInsights': length_insights,
            'hookEffectiveness': hooks_insights,
            'analyzedPosts': analyzed_posts
        }
