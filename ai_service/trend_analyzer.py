"""
trend_analyzer.py
Time-series and Year-over-Year (YoY) content analytics engine powered by Pandas and NumPy.
Analyzes account evolution, momentum, and seasonal shifts over time.
"""

from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd


class TrendAnalyzer:
    @staticmethod
    def analyze_trends(
        posts: List[Dict[str, Any]],
        followers: int,
        platform: str,
        username: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes historical trends by Year and Month using Pandas Datetime indexing.
        """
        if not posts:
            return {
                "success": False,
                "message": "Belum ada data postingan untuk analisis tren tahun-ke-tahun.",
            }

        df = pd.DataFrame(posts)
        safe_followers = max(1, int(followers or 1))
        plat_upper = str(platform).upper()
        is_tiktok = plat_upper == "TIKTOK"
        is_youtube = plat_upper == "YOUTUBE"

        # Parse numeric columns
        for col in ["likes", "comments", "views", "shares"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).clip(lower=0)
            else:
                df[col] = 0.0

        # Parse postedAt
        df["postedAt"] = pd.to_datetime(df.get("postedAt", None), errors="coerce")
        # Drop invalid dates if any, or fill with now
        df["postedAt"] = df["postedAt"].fillna(pd.Timestamp.now())

        # Calculate individual ER
        has_views = (df["views"] > 0).any()
        if (is_tiktok or is_youtube) and has_views:
            safe_v = df["views"].replace(0, 1)
            interactions = df["likes"] + df["comments"] + (df["shares"] if is_tiktok else 0)
            df["post_er"] = (interactions / safe_v) * 100.0
        else:
            df["post_er"] = ((df["likes"] + df["comments"]) / safe_followers) * 100.0

        df["post_er"] = df["post_er"].clip(lower=0.0, upper=500.0)

        # Extract temporal components
        df["year"] = df["postedAt"].dt.year.astype(str)
        df["month_str"] = df["postedAt"].dt.strftime("%Y-%m")
        df["month_name"] = df["postedAt"].dt.strftime("%B")

        # ─── 1. Yearly Aggregation (Year-over-Year) ───
        yearly_group = df.groupby("year")
        yearly_data = []

        for year, group in yearly_group:
            p_count = len(group)
            avg_er = round(float(group["post_er"].mean()), 2)
            median_er = round(float(group["post_er"].median()), 2)
            avg_views = round(float(group["views"].mean()), 1)
            total_views = int(group["views"].sum())
            total_likes = int(group["likes"].sum())
            total_comments = int(group["comments"].sum())
            total_shares = int(group["shares"].sum())

            yearly_data.append({
                "year": str(year),
                "postCount": p_count,
                "averageER": avg_er,
                "medianER": median_er,
                "averageViews": avg_views,
                "totalViews": total_views,
                "totalLikes": total_likes,
                "totalComments": total_comments,
                "totalShares": total_shares,
            })

        # Sort years ascending
        yearly_data.sort(key=lambda x: x["year"])

        # Calculate YoY ER growth
        for i in range(1, len(yearly_data)):
            prev_er = yearly_data[i - 1]["medianER"]
            curr_er = yearly_data[i]["medianER"]
            if prev_er > 0:
                yoy_growth = round(((curr_er - prev_er) / prev_er) * 100, 1)
            else:
                yoy_growth = 0.0
            yearly_data[i]["yoyGrowthPct"] = yoy_growth
        if yearly_data:
            yearly_data[0]["yoyGrowthPct"] = 0.0

        # ─── 2. Monthly Progression (Time-Series) ───
        monthly_group = df.groupby("month_str")
        monthly_data = []

        for month_str, group in monthly_group:
            p_count = len(group)
            avg_er = round(float(group["post_er"].mean()), 2)
            median_er = round(float(group["post_er"].median()), 2)
            avg_views = round(float(group["views"].mean()), 1)

            monthly_data.append({
                "month": month_str,
                "postCount": p_count,
                "averageER": avg_er,
                "medianER": median_er,
                "averageViews": avg_views,
            })

        monthly_data.sort(key=lambda x: x["month"])

        # ─── 3. Momentum & Trajectory Analysis ───
        momentum_status = "STABLE"
        momentum_label = "Performa Stabil & Konsisten"
        momentum_color = "text-blue-500"
        momentum_note = "Tingkat interaksi audiens bergerak dalam kisaran wajar tanpa lonjakan atau penurunan drastis."

        if len(yearly_data) >= 2:
            latest = yearly_data[-1]
            previous = yearly_data[-2]
            growth = latest.get("yoyGrowthPct", 0.0)

            if growth >= 15.0:
                momentum_status = "ACCELERATING"
                momentum_label = "Tren Meningkat Signifikan (Accelerating)"
                momentum_color = "text-emerald-500"
                momentum_note = f"Engagement akun tahun {latest['year']} naik +{growth}% dibanding tahun {previous['year']}, menandakan perluasan audiens aktif."
            elif growth <= -15.0:
                momentum_status = "DECELERATING"
                momentum_label = "Tren Mengalami Penurunan (Decelerating)"
                momentum_color = "text-amber-500"
                momentum_note = f"Engagement akun tahun {latest['year']} mengalami penurunan {growth}% dibanding tahun sebelumnya, disarankan menyegarkan variasi hook konten."
        elif len(monthly_data) >= 3:
            recent_er = np.mean([m["medianER"] for m in monthly_data[-2:]])
            past_er = np.mean([m["medianER"] for m in monthly_data[:-2]])
            diff = ((recent_er - past_er) / past_er) * 100 if past_er > 0 else 0
            if diff >= 15.0:
                momentum_status = "ACCELERATING"
                momentum_label = "Tren Meningkat (Momentum Positif)"
                momentum_color = "text-emerald-500"
                momentum_note = f"Rata-rata interaksi bulan-bulan terakhir melonjak +{diff:.1f}% dibanding awal periode."
            elif diff <= -15.0:
                momentum_status = "DECELERATING"
                momentum_label = "Tren Melambat"
                momentum_color = "text-amber-500"
                momentum_note = f"Performa beberapa bulan terakhir melambat {diff:.1f}%, memerlukan eksperimen format baru."

        # ─── 4. Peak Month Seasonality ───
        month_name_group = df.groupby("month_name")["post_er"].agg(["mean", "count"]).reset_index()
        month_name_group = month_name_group[month_name_group["count"] >= 1].sort_values(by="mean", ascending=False)
        best_month_record = month_name_group.iloc[0] if not month_name_group.empty else None

        best_season_note = ""
        if best_month_record is not None:
            best_season_note = f"Bulan {best_month_record['month_name']} secara historis mencatatkan rata-rata ER tertinggi ({best_month_record['mean']:.2f}%)."

        return {
            "success": True,
            "username": username or "",
            "platform": platform,
            "followers": safe_followers,
            "totalPostsAnalyzed": len(df),
            "dateRange": {
                "oldestPost": df["postedAt"].min().strftime("%Y-%m-%d"),
                "latestPost": df["postedAt"].max().strftime("%Y-%m-%d"),
                "spanYears": len(yearly_data),
            },
            "yearlyTrends": yearly_data,
            "monthlyTrends": monthly_data[-12:],  # Last 12 active months
            "momentum": {
                "status": momentum_status,
                "label": momentum_label,
                "color": momentum_color,
                "note": momentum_note,
            },
            "seasonality": {
                "bestMonth": best_month_record["month_name"] if best_month_record is not None else "-",
                "note": best_season_note,
            },
            "availableYears": sorted(list(df["year"].dropna().unique()), reverse=True),
            "availableMonths": sorted(list(df["month_str"].dropna().unique()), reverse=True),
        }
