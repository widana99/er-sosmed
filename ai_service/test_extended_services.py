import asyncio
from data_engine import DataEngine
from trend_analyzer import TrendAnalyzer
from python_scraper import PythonScraper

# Sample test posts
posts = [
    {
        "likes": 1200,
        "comments": 80,
        "views": 25000,
        "shares": 40,
        "caption": "Diskusi kebijakan publik untuk warga Lebak #lebak #kebijakan",
        "postedAt": "2024-03-15T12:00:00Z"
    },
    {
        "likes": 500,
        "comments": 30,
        "views": 8000,
        "shares": 10,
        "caption": "Edukasi anggaran belanja daerah #banten",
        "postedAt": "2025-01-20T14:30:00Z"
    },
    {
        "likes": 3400,
        "comments": 250,
        "views": 85000,
        "shares": 300,
        "caption": "Video viral klarifikasi aspirasi rakyat #viral #fyp",
        "postedAt": "2026-02-10T19:00:00Z"
    }
]

print("1. Testing DataEngine (Pandas/NumPy)...")
calc_result = DataEngine.calculate_comprehensive(
    platform="TIKTOK",
    followers=25000,
    posts=posts,
    username="testuser"
)
print("DataEngine Success! Median ER:", calc_result["medianER"], "Avg ER:", calc_result["averageER"], "Rate Card:", calc_result["rateCardValuation"]["formatted"])

print("\n2. Testing TrendAnalyzer (Pandas Time-Series)...")
trends_result = TrendAnalyzer.analyze_trends(
    posts=posts,
    followers=25000,
    platform="TIKTOK",
    username="testuser"
)
print("TrendAnalyzer Success! Total Years:", len(trends_result["yearlyTrends"]), "Momentum:", trends_result["momentum"]["label"])

print("\n3. Testing PythonScraper._parse_human_number...")
print("5.2K ->", PythonScraper._parse_human_number("5.2K"))
print("1.4M ->", PythonScraper._parse_human_number("1.4M"))

print("\nAll Python unit tests passed successfully!")
