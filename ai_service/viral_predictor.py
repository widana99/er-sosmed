import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import numpy as np

class ViralPredictor:
    """
    Empirical Viral Prediction Engine for Social Media Posts.
    Calculates statistical breakout probability based on relative creator velocity,
    view-to-follower multiplier, algorithmic share dynamics, and temporal timing.
    """

    @classmethod
    def calculate_post_viral_score(
        cls,
        post: Dict[str, Any],
        creator_median_views: float,
        creator_median_er: float,
        followers: int,
        platform: str = 'TIKTOK',
        peak_hours: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        likes = max(0, int(post.get('likes') or 0))
        comments = max(0, int(post.get('comments') or 0))
        views = max(0, int(post.get('views') or 0))
        shares = max(0, int(post.get('shares') or 0))
        saves = max(0, int(post.get('saves') or 0))
        caption = str(post.get('caption') or '').strip()

        # Follower safe baseline
        safe_followers = max(followers, 1)

        # 1. Post ER calculation
        if platform.upper() == 'TIKTOK' and views > 0:
            post_er = ((likes + comments + shares) / views) * 100
        else:
            post_er = ((likes + comments + shares) / safe_followers) * 100

        # Safe creator medians
        median_views = max(creator_median_views, 50.0)
        median_er = max(creator_median_er, 1.0)

        # Signal 1: Relative View Velocity vs Creator Median (Weight: 35%)
        # How much does this post outperform the creator's standard views?
        view_ratio = views / median_views
        # Logistic curve scoring: 1.0x median -> 50 score, 2.5x median -> 85 score, 5x+ median -> 98 score
        score_views = float(np.clip(50.0 + 20.0 * (view_ratio - 1.0), 0.0, 100.0))
        if view_ratio > 4.0:
            score_views = 98.0
        elif view_ratio < 0.4:
            score_views = max(10.0, score_views * 0.5)

        # Signal 2: View-to-Follower Expansion Ratio (Weight: 25%)
        # Indicates algorithmic distribution beyond existing follower base
        vfr = views / safe_followers
        if platform.upper() == 'TIKTOK':
            # In TikTok, reaching >1.5x followers is good, >4x is high viral
            if vfr >= 4.0:
                score_vfr = 95.0
            elif vfr >= 1.5:
                score_vfr = 75.0 + (vfr - 1.5) * 8.0
            elif vfr >= 0.8:
                score_vfr = 55.0 + (vfr - 0.8) * 28.0
            else:
                score_vfr = max(15.0, vfr * 60.0)
        else:
            # Instagram Reels
            if vfr >= 2.0:
                score_vfr = 95.0
            elif vfr >= 0.8:
                score_vfr = 70.0 + (vfr - 0.8) * 20.0
            elif vfr >= 0.3:
                score_vfr = 50.0 + (vfr - 0.3) * 40.0
            else:
                score_vfr = max(15.0, vfr * 100.0)
        score_vfr = float(np.clip(score_vfr, 0.0, 100.0))

        # Signal 3: Algorithmic Share & Retention Dynamics (Weight: 20%)
        # Shares are the single strongest recommendation accelerator on social algorithms
        share_ratio = (shares / max(views, 1)) * 100 if views > 0 else 0.0
        comment_ratio = (comments / max(likes, 1)) * 100 if likes > 0 else 0.0

        if share_ratio >= 1.2:
            score_retention = 95.0
        elif share_ratio >= 0.6:
            score_retention = 75.0 + (share_ratio - 0.6) * 33.0
        elif share_ratio >= 0.2:
            score_retention = 50.0 + (share_ratio - 0.2) * 62.5
        else:
            score_retention = max(20.0, share_ratio * 150.0)
        score_retention = float(np.clip(score_retention, 0.0, 100.0))

        # Signal 4: Content Hook & Topical Strength (Weight: 10%)
        hook_score = 50.0
        c_lower = caption.lower()
        if '?' in caption or c_lower.startswith(('kenapa', 'bagaimana', 'apakah', 'gimana', 'kira-kira')):
            hook_score += 25.0
        if any(w in c_lower for w in ['fakta', 'rahasia', 'ternyata', 'terbongkar', 'penting', 'wajib']):
            hook_score += 15.0
        if len(caption) >= 60 and len(caption) <= 220:
            hook_score += 10.0
        hook_score = float(np.clip(hook_score, 0.0, 100.0))

        # Signal 5: Timing Alignment (Weight: 10%)
        timing_score = 55.0
        raw_date = post.get('postedAt')
        if raw_date:
            try:
                if isinstance(raw_date, str):
                    dt = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
                elif isinstance(raw_date, datetime):
                    dt = raw_date
                else:
                    dt = datetime.now()
                hour = dt.hour
                if peak_hours and hour in peak_hours:
                    timing_score = 90.0
                elif hour in [12, 13, 18, 19, 20, 21]:
                    timing_score = 80.0
                elif hour in [1, 2, 3, 4]:
                    timing_score = 30.0
            except Exception:
                pass

        # Composite Weighted Viral Score
        viral_score = round(
            0.35 * score_views +
            0.25 * score_vfr +
            0.20 * score_retention +
            0.10 * hook_score +
            0.10 * timing_score,
            1
        )

        # Classification Tiers
        if viral_score >= 82.0:
            tier = 'VIRAL_BREAKOUT'
            tier_label = 'Viral Breakout / Sangat Tinggi'
            tier_badge = 'Viral'
        elif viral_score >= 68.0:
            tier = 'HIGH_POTENTIAL'
            tier_label = 'Potensi Tinggi (Di Atas Rata-rata)'
            tier_badge = 'Tinggi'
        elif viral_score >= 50.0:
            tier = 'HEALTHY_CONSISTENT'
            tier_label = 'Performa Sehat & Konsisten'
            tier_badge = 'Konsisten'
        else:
            tier = 'BELOW_BASELINE'
            tier_label = 'Di Bawah Rata-rata Akun'
            tier_badge = 'Rendah'

        # Generate Evidence-based Drivers
        drivers = []
        if view_ratio >= 1.5:
            drivers.append(f"Tayangan melampaui median akun sebesar {(view_ratio - 1.0) * 100:.0f}%")
        elif view_ratio < 0.6:
            drivers.append(f"Tayangan di bawah rata-rata akun (-{(1.0 - view_ratio) * 100:.0f}%)")

        if vfr >= 1.5:
            drivers.append(f"Rasio jangkauan luas ({vfr:.1f}x dari total pengikut)")
        
        if share_ratio >= 0.7:
            drivers.append(f"Rasio pembagian/share sangat kuat ({share_ratio:.2f}%) mendorong algoritma FYP")
        elif share_ratio < 0.2:
            drivers.append(f"Rasio share minim ({share_ratio:.2f}%), mengurangi dorongan kurasi algoritma")

        if '?' in caption or hook_score >= 70:
            drivers.append("Hook kalimat pembuka memicu rasa penasaran dan interaksi komentar")

        # Actionable Recommendations
        recommendations = []
        if share_ratio < 0.5:
            recommendations.append("Tambahkan ajakan berbagi informasi (Call to Action: 'Simpan & share ke temanmu yang butuh info ini').")
        if comment_ratio < 1.0:
            recommendations.append("Tutup caption dengan pertanyaan terbuka untuk memicu diskusi pro-kontra di kolom komentar.")
        if timing_score < 70:
            recommendations.append("Jadwalkan postingan pada jam prime time (18:30 - 21:00 WIB) saat audiens aktif.")
        if len(recommendations) < 3:
            recommendations.append("Gunakan 3-5 hashtag tematik spesifik dan hindari penumpukan hashtag generik yang berlebihan.")

        return {
            'postId': post.get('id') or post.get('postUrl') or '',
            'caption': caption,
            'postedAt': str(post.get('postedAt') or ''),
            'views': views,
            'likes': likes,
            'comments': comments,
            'shares': shares,
            'postER': round(post_er, 2),
            'viralScore': viral_score,
            'viralTier': tier,
            'viralTierLabel': tier_label,
            'viralTierBadge': tier_badge,
            'scoreBreakdown': {
                'relativeVelocityScore': round(score_views, 1),
                'reachMultiplierScore': round(score_vfr, 1),
                'shareRetentionScore': round(score_retention, 1),
                'hookScore': round(hook_score, 1),
                'timingScore': round(timing_score, 1)
            },
            'drivers': drivers[:3],
            'recommendations': recommendations[:3]
        }

    @classmethod
    def batch_predict_posts(
        cls,
        posts: List[Dict[str, Any]],
        followers: int,
        platform: str = 'TIKTOK',
        peak_hours: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        if not posts:
            return {
                'averageViralScore': 0.0,
                'breakoutCount': 0,
                'highCount': 0,
                'consistentCount': 0,
                'belowCount': 0,
                'posts': []
            }

        all_views = [max(0, int(p.get('views') or 0)) for p in posts]
        all_ers = []
        for p in posts:
            v = max(0, int(p.get('views') or 0))
            l = max(0, int(p.get('likes') or 0))
            c = max(0, int(p.get('comments') or 0))
            s = max(0, int(p.get('shares') or 0))
            if platform.upper() == 'TIKTOK' and v > 0:
                all_ers.append(((l + c + s) / v) * 100)
            else:
                all_ers.append(((l + c + s) / max(followers, 1)) * 100)

        median_views = float(np.median(all_views)) if all_views else 100.0
        median_er = float(np.median(all_ers)) if all_ers else 5.0

        predicted_posts = []
        for p in posts:
            res = cls.calculate_post_viral_score(
                post=p,
                creator_median_views=median_views,
                creator_median_er=median_er,
                followers=followers,
                platform=platform,
                peak_hours=peak_hours
            )
            predicted_posts.append(res)

        predicted_posts.sort(key=lambda x: x['viralScore'], reverse=True)

        avg_score = round(float(np.mean([p['viralScore'] for p in predicted_posts])), 1)
        breakout_cnt = sum(1 for p in predicted_posts if p['viralTier'] == 'VIRAL_BREAKOUT')
        high_cnt = sum(1 for p in predicted_posts if p['viralTier'] == 'HIGH_POTENTIAL')
        consistent_cnt = sum(1 for p in predicted_posts if p['viralTier'] == 'HEALTHY_CONSISTENT')
        below_cnt = sum(1 for p in predicted_posts if p['viralTier'] == 'BELOW_BASELINE')

        return {
            'averageViralScore': avg_score,
            'summary': {
                'breakoutCount': breakout_cnt,
                'highPotentialCount': high_cnt,
                'consistentCount': consistent_cnt,
                'belowBaselineCount': below_cnt,
            },
            'creatorBenchmark': {
                'medianViews': round(median_views, 1),
                'medianER': round(median_er, 2),
                'followers': followers
            },
            'rankedPosts': predicted_posts
        }

    @classmethod
    def simulate_draft_post(
        cls,
        caption: str,
        target_hour: int,
        target_day: str,
        creator_median_views: float,
        creator_median_er: float,
        followers: int,
        platform: str = 'TIKTOK',
        peak_hours: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Predicts viral potential for an unposted draft caption and publishing time.
        """
        # Estimated realistic baseline based on creator median
        est_views = int(creator_median_views)
        est_likes = int(est_views * (creator_median_er / 100.0) * 0.85)
        est_comments = max(1, int(est_likes * 0.015))
        est_shares = max(1, int(est_likes * 0.01))

        simulated_post = {
            'caption': caption,
            'postedAt': f"2026-10-04T{target_hour:02d}:00:00Z",
            'views': est_views,
            'likes': est_likes,
            'comments': est_comments,
            'shares': est_shares
        }

        result = cls.calculate_post_viral_score(
            post=simulated_post,
            creator_median_views=creator_median_views,
            creator_median_er=creator_median_er,
            followers=followers,
            platform=platform,
            peak_hours=peak_hours
        )

        return {
            'draftCaption': caption,
            'targetSchedule': f"{target_day} pukul {target_hour:02d}:00 WIB",
            'predictedViralScore': result['viralScore'],
            'predictedTier': result['viralTier'],
            'predictedTierLabel': result['viralTierLabel'],
            'predictedTierBadge': result['viralTierBadge'],
            'scoreBreakdown': result['scoreBreakdown'],
            'drivers': result['drivers'],
            'recommendations': result['recommendations']
        }
