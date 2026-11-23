"""
data_engine.py
Authoritative statistical analytics & ER calculation engine powered by Python, Pandas, and NumPy.
Replaces client/ad-hoc math with vectorized high-precision operations.
"""

from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd


class DataEngine:
    @staticmethod
    def calculate_comprehensive(
        platform: str,
        followers: int,
        posts: List[Dict[str, Any]],
        username: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        filter_year: Optional[str] = None,
        filter_month: Optional[str] = None,
        content_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculates full statistical metrics across all posts using Pandas & NumPy,
        with optional Date, Month, Year, and Content Type (Long Video, Shorts, Live) filtering.
        """
        if not posts:
            raise ValueError("Minimal 1 postingan dibutuhkan untuk kalkulasi analisis ER.")

        safe_followers = max(1, int(followers or 1))
        plat_upper = str(platform).upper()
        is_tiktok = plat_upper == "TIKTOK"
        is_youtube = plat_upper == "YOUTUBE"
        is_facebook = plat_upper == "FACEBOOK"

        # Create DataFrame
        df = pd.DataFrame(posts)
        total_original_posts = len(df)

        # Calculate Content Breakdown across original dataset
        content_breakdown = {
            "totalVideos": 0,
            "totalShorts": 0,
            "totalLive": 0,
            "totalReels": 0,
            "totalFeed": 0,
            "totalCarousel": 0,
            "totalHighlights": 0,
        }
        if "contentType" in df.columns:
            ct_series = df["contentType"].fillna("LONG_VIDEO" if is_youtube else "FEED_POST").str.upper()
            content_breakdown["totalVideos"] = int(ct_series.isin(["LONG_VIDEO", "VIDEO"]).sum())
            content_breakdown["totalShorts"] = int((ct_series == "SHORTS").sum())
            content_breakdown["totalLive"] = int((ct_series == "LIVE").sum())
            content_breakdown["totalReels"] = int(ct_series.isin(["REELS", "REEL"]).sum())
            content_breakdown["totalFeed"] = int(ct_series.isin(["FEED_POST", "FEED", "POST"]).sum())
            content_breakdown["totalCarousel"] = int(ct_series.isin(["PHOTO_CAROUSEL", "CAROUSEL", "ALBUM"]).sum())
            content_breakdown["totalHighlights"] = int(ct_series.isin(["HIGHLIGHT", "HIGHLIGHTS"]).sum())
        else:
            if is_youtube:
                content_breakdown["totalVideos"] = total_original_posts
            else:
                content_breakdown["totalFeed"] = total_original_posts

        # Parse postedAt for temporal analysis & filtering (standardized to UTC)
        df["postedAt_dt"] = pd.to_datetime(df.get("postedAt", None), errors="coerce", utc=True)
        valid_dates = df["postedAt_dt"].dropna()

        # Extract available chronological years and months from original dataset
        available_years = sorted(list(valid_dates.dt.year.unique().astype(str)), reverse=True) if len(valid_dates) > 0 else []
        available_months = sorted(list(valid_dates.dt.strftime("%Y-%m").unique()), reverse=True) if len(valid_dates) > 0 else []

        # Apply Content Type Filter if specified
        has_content_filter = False
        if content_type and str(content_type).upper() != "ALL":
            has_content_filter = True
            target_ct = str(content_type).strip().upper()
            if "contentType" in df.columns:
                df["ct_upper"] = df["contentType"].fillna("LONG_VIDEO" if is_youtube else "FEED_POST").str.upper()
                if target_ct in ["LONG_VIDEO", "VIDEO"]:
                    df = df[df["ct_upper"].isin(["LONG_VIDEO", "VIDEO"])]
                elif target_ct in ["FEED_POST", "FEED", "POST"]:
                    df = df[df["ct_upper"].isin(["FEED_POST", "FEED", "POST"])]
                elif target_ct in ["PHOTO_CAROUSEL", "CAROUSEL", "ALBUM"]:
                    df = df[df["ct_upper"].isin(["PHOTO_CAROUSEL", "CAROUSEL", "ALBUM"])]
                elif target_ct in ["REELS", "REEL"]:
                    df = df[df["ct_upper"].isin(["REELS", "REEL"])]
                elif target_ct in ["HIGHLIGHT", "HIGHLIGHTS"]:
                    df = df[df["ct_upper"].isin(["HIGHLIGHT", "HIGHLIGHTS"])]
                else:
                    df = df[df["ct_upper"] == target_ct]

        # Apply Temporal Filters if specified
        has_temporal_filter = False
        if filter_year and str(filter_year).upper() != "ALL":
            has_temporal_filter = True
            df = df[df["postedAt_dt"].dt.year == int(filter_year)]

        if filter_month and str(filter_month).upper() != "ALL":
            has_temporal_filter = True
            month_str = str(filter_month).strip()
            if "-" in month_str:
                df = df[df["postedAt_dt"].dt.strftime("%Y-%m") == month_str]
            else:
                df = df[df["postedAt_dt"].dt.month == int(month_str)]

        if start_date and str(start_date).strip():
            has_temporal_filter = True
            start_ts = pd.to_datetime(start_date, utc=True)
            df = df[df["postedAt_dt"] >= start_ts]

        if end_date and str(end_date).strip():
            has_temporal_filter = True
            end_ts = pd.to_datetime(end_date, utc=True) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
            df = df[df["postedAt_dt"] <= end_ts]

        sample_size = len(df)

        # Default platform string
        platform_name = "YOUTUBE" if is_youtube else ("TIKTOK" if is_tiktok else "INSTAGRAM")

        # If filtered set is empty, return structured zero-metric response with metadata
        if sample_size == 0:
            return {
                "platform": platform_name,
                "username": username or "",
                "followers": safe_followers,
                "formulaType": "VIEW_BASED" if (is_tiktok or is_youtube) else "FOLLOWER_BASED",
                "sampleSize": 0,
                "totalLikes": 0,
                "totalComments": 0,
                "totalViews": 0,
                "totalShares": 0,
                "averageLikes": 0.0,
                "averageComments": 0.0,
                "averageViews": 0.0,
                "averageER": 0.0,
                "medianLikes": 0.0,
                "medianComments": 0.0,
                "medianViews": 0.0,
                "medianER": 0.0,
                "minER": 0.0,
                "maxER": 0.0,
                "spreadRange": 0.0,
                "quartiles": {"q1": 0.0, "median": 0.0, "q3": 0.0, "iqr": 0.0},
                "distribution": {
                    "viralCount": 0, "highCount": 0, "moderateCount": 0, "lowCount": 0,
                    "viralPct": 0.0, "highPct": 0.0, "moderatePct": 0.0, "lowPct": 0.0
                },
                "consistencyScore": 0,
                "commentToLikeRatio": 0.0,
                "botRisk": "LOW",
                "botRiskReason": "Tidak ada postingan pada filter yang dipilih.",
                "rateCardValuation": {"tier": "NANO", "minIdr": 0, "maxIdr": 0, "formatted": "Rp 0"},
                "postsRanked": [],
                "contentBreakdown": content_breakdown,
                "filterMeta": {
                    "applied": has_temporal_filter or has_content_filter,
                    "contentType": content_type,
                    "filterYear": filter_year,
                    "filterMonth": filter_month,
                    "startDate": start_date,
                    "endDate": end_date,
                    "filteredPostsCount": 0,
                    "totalPostsCount": total_original_posts,
                    "availableYears": available_years,
                    "availableMonths": available_months,
                    "message": "Tidak ada postingan yang ditemukan pada filter yang dipilih."
                }
            }

        # Ensure numeric columns
        for col in ["likes", "comments", "views", "shares"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).clip(lower=0)
            else:
                df[col] = 0.0

        sample_size = len(df)
        has_views = (df["views"] > 0).any()
        is_reels_filter = content_type and str(content_type).strip().upper() in ["REELS", "REEL"]

        if is_youtube:
            formula_type = "VIEW_BASED" if has_views else "FOLLOWER_BASED"
        elif is_tiktok:
            formula_type = "VIEW_BASED" if has_views else "FOLLOWER_BASED"
        elif is_facebook:
            formula_type = "VIEW_BASED" if (is_reels_filter and has_views) else "FOLLOWER_BASED"
        else: # Instagram
            formula_type = "VIEW_BASED" if (is_reels_filter and has_views) else "FOLLOWER_BASED"

        # Calculate individual Post ER
        if is_youtube:
            # YouTube formula: ((likes + comments) / max(views, 1)) * 100
            interactions = df["likes"] + df["comments"]
            safe_views = df["views"].replace(0, 1)
            df["post_er"] = (interactions / safe_views) * 100.0
        elif is_tiktok:
            # TikTok view-based: ((likes + comments + shares) / max(views, 1)) * 100
            interactions = df["likes"] + df["comments"] + df["shares"]
            safe_views = df["views"].replace(0, 1)
            df["post_er"] = (interactions / safe_views) * 100.0
        elif is_facebook:
            # Facebook: ((likes + comments + shares) / followers) * 100, or view-based for video/reel
            ct_col = df.get("contentType", pd.Series(["STATUS"] * len(df))).fillna("STATUS").astype(str).str.upper()
            is_video_row = ct_col.isin(["REEL", "REELS", "VIDEO"])
            has_row_views = df["views"] > 0
            view_based_mask = is_video_row & has_row_views

            df["post_er"] = ((df["likes"] + df["comments"] + df["shares"]) / safe_followers) * 100.0
            if view_based_mask.any():
                safe_views = df.loc[view_based_mask, "views"].replace(0, 1)
                interactions = df.loc[view_based_mask, "likes"] + df.loc[view_based_mask, "comments"] + df.loc[view_based_mask, "shares"]
                df.loc[view_based_mask, "post_er"] = (interactions / safe_views) * 100.0
        else:
            # Instagram: For reels with views, calculate view-based ER. For photos/feed, calculate follower-based ER.
            ct_col = df.get("contentType", pd.Series(["FEED_POST"] * len(df))).fillna("FEED_POST").astype(str).str.upper()
            is_reel_row = ct_col.isin(["REELS", "REEL"])
            has_row_views = df["views"] > 0
            view_based_mask = is_reel_row & has_row_views

            df["post_er"] = ((df["likes"] + df["comments"]) / safe_followers) * 100.0
            if view_based_mask.any():
                safe_views = df.loc[view_based_mask, "views"].replace(0, 1)
                reels_interactions = df.loc[view_based_mask, "likes"] + df.loc[view_based_mask, "comments"] + df.loc[view_based_mask, "shares"]
                df.loc[view_based_mask, "post_er"] = (reels_interactions / safe_views) * 100.0

        df["post_er"] = df["post_er"].clip(lower=0.0, upper=500.0)

        # Aggregate Metrics via NumPy/Pandas
        total_likes = int(df["likes"].sum())
        total_comments = int(df["comments"].sum())
        total_views = int(df["views"].sum())
        total_shares = int(df["shares"].sum())

        avg_likes = round(float(df["likes"].mean()), 1)
        avg_comments = round(float(df["comments"].mean()), 1)
        avg_views = round(float(df["views"].mean()), 1)
        avg_shares = round(float(df["shares"].mean()), 1)

        median_likes = round(float(df["likes"].median()), 1)
        median_comments = round(float(df["comments"].median()), 1)
        median_views = round(float(df["views"].median()), 1)
        median_er = round(float(df["post_er"].median()), 2)

        if formula_type == "VIEW_BASED" and total_views > 0:
            if is_youtube:
                avg_er = round(float(((total_likes + total_comments) / total_views) * 100.0), 2)
            else:
                avg_er = round(float(((total_likes + total_comments + total_shares) / total_views) * 100.0), 2)
        else:
            avg_er = round(float(((avg_likes + avg_comments) / safe_followers) * 100.0), 2)

        min_er = round(float(df["post_er"].min()), 2)
        max_er = round(float(df["post_er"].max()), 2)
        spread_range = round(float(max_er - min_er), 2)

        # Quartiles via NumPy percentiles
        er_values = df["post_er"].values
        q1 = round(float(np.percentile(er_values, 25)), 2)
        median_val = round(float(np.percentile(er_values, 50)), 2)
        q3 = round(float(np.percentile(er_values, 75)), 2)
        iqr = round(float(q3 - q1), 2)

        # Consistency Score based on Coefficient of Variation (CV)
        std_er = float(np.std(er_values))
        mean_er = float(np.mean(er_values))
        cv = (std_er / mean_er) if mean_er > 0 else 0
        consistency_score = int(np.clip(100 - (cv * 35), 10, 99))

        # Distribution / Tiers
        viral_threshold = max(q3 + 1.5 * iqr, q3 * 1.3)
        high_threshold = q3
        low_threshold = q1

        def assign_tier(val: float) -> str:
            if val >= viral_threshold and val > 0:
                return "VIRAL"
            elif val >= high_threshold:
                return "HIGH"
            elif val < low_threshold:
                return "LOW"
            return "MODERATE"

        df["tier"] = df["post_er"].apply(assign_tier)

        tier_counts = df["tier"].value_counts().to_dict()
        viral_cnt = int(tier_counts.get("VIRAL", 0))
        high_cnt = int(tier_counts.get("HIGH", 0))
        mod_cnt = int(tier_counts.get("MODERATE", 0))
        low_cnt = int(tier_counts.get("LOW", 0))

        distribution = {
            "viralCount": viral_cnt,
            "highCount": high_cnt,
            "moderateCount": mod_cnt,
            "lowCount": low_cnt,
            "viralPct": round((viral_cnt / sample_size) * 100, 1),
            "highPct": round((high_cnt / sample_size) * 100, 1),
            "moderatePct": round((mod_cnt / sample_size) * 100, 1),
            "lowPct": round((low_cnt / sample_size) * 100, 1),
        }

        # Comment to Like ratio & Bot Risk
        comment_to_like_ratio = round((total_comments / total_likes) * 100, 2) if total_likes > 0 else 0.0

        bot_risk = "LOW"
        bot_risk_reason = "Pola interaksi wajar dan tersebar secara organik."
        if comment_to_like_ratio < 0.3 and total_likes > 200:
            bot_risk = "HIGH"
            bot_risk_reason = f"Rasio komentar terhadap suka sangat rendah ({comment_to_like_ratio}%), mengindikasikan potensi bot auto-like."
        elif comment_to_like_ratio < 0.8 and total_likes > 500:
            bot_risk = "MODERATE"
            bot_risk_reason = f"Rasio komentar rendah ({comment_to_like_ratio}%), interaksi percakapan minim."
        elif cv > 2.5 and sample_size >= 10:
            bot_risk = "MODERATE"
            bot_risk_reason = "Volatilitas engagement sangat ekstrem, disarankan memeriksa keaslian lonjakan."

        # Rate Card Valuation
        rate_card = DataEngine._calculate_rate_card(safe_followers, avg_er, is_tiktok)

        # Ranked Posts
        df = df.sort_values(by="post_er", ascending=False).reset_index(drop=True)
        posts_ranked = []
        for idx, row in df.iterrows():
            posts_ranked.append({
                "index": int(idx + 1),
                "likes": int(row["likes"]),
                "comments": int(row["comments"]),
                "views": int(row["views"]),
                "shares": int(row["shares"]),
                "caption": str(row.get("caption", "") or "")[:150],
                "postedAt": str(row.get("postedAt", "") or ""),
                "postER": round(float(row["post_er"]), 2),
                "tier": str(row["tier"]),
                "contentType": str(row.get("contentType", "LONG_VIDEO") or "LONG_VIDEO"),
                "postUrl": str(row.get("postUrl", "") or row.get("url", "") or ""),
            })

        return {
            "platform": platform_name,
            "username": username or "",
            "followers": safe_followers,
            "formulaType": formula_type,
            "sampleSize": sample_size,
            "totalLikes": total_likes,
            "totalComments": total_comments,
            "totalViews": total_views,
            "totalShares": total_shares,
            "averageLikes": avg_likes,
            "averageComments": avg_comments,
            "averageViews": avg_views,
            "averageER": avg_er,
            "medianLikes": median_likes,
            "medianComments": median_comments,
            "medianViews": median_views,
            "medianER": median_er,
            "minER": min_er,
            "maxER": max_er,
            "spreadRange": spread_range,
            "quartiles": {
                "q1": q1,
                "median": median_val,
                "q3": q3,
                "iqr": iqr,
            },
            "distribution": distribution,
            "consistencyScore": consistency_score,
            "commentToLikeRatio": comment_to_like_ratio,
            "botRisk": bot_risk,
            "botRiskReason": bot_risk_reason,
            "rateCardValuation": rate_card,
            "postsRanked": posts_ranked,
            "contentBreakdown": content_breakdown,
            "filterMeta": {
                "applied": has_temporal_filter or has_content_filter,
                "contentType": content_type,
                "filterYear": filter_year,
                "filterMonth": filter_month,
                "startDate": start_date,
                "endDate": end_date,
                "filteredPostsCount": sample_size,
                "totalPostsCount": total_original_posts,
                "availableYears": available_years,
                "availableMonths": available_months,
            },
        }

    @staticmethod
    def _calculate_rate_card(followers: int, avg_er: float, is_tiktok: bool) -> Dict[str, Any]:
        """
        Calculates market-standard rate card valuation based on Indonesian creator ecosystem.
        """
        base_cpm = 35.0  # IDR per follower unit base
        er_factor = max(0.5, min(2.5, avg_er / 4.0))

        if followers < 10000:
            tier = "NANO"
            base_price = 350000
        elif followers < 50000:
            tier = "MICRO"
            base_price = 1200000
        elif followers < 250000:
            tier = "MID"
            base_price = 4500000
        elif followers < 1000000:
            tier = "MACRO"
            base_price = 12000000
        else:
            tier = "MEGA"
            base_price = 30000000

        estimated_price = base_price * er_factor
        min_idr = int(round(estimated_price * 0.75, -4))
        max_idr = int(round(estimated_price * 1.35, -4))

        def format_rupiah(num: int) -> str:
            if num >= 1_000_000:
                return f"Rp {num / 1_000_000:.1f} Juta"
            elif num >= 1_000:
                return f"Rp {num / 1_000:.0f} Ribu"
            return f"Rp {num:,}"

        return {
            "tier": tier,
            "minIdr": min_idr,
            "maxIdr": max_idr,
            "formatted": f"{format_rupiah(min_idr)} – {format_rupiah(max_idr)}",
        }
