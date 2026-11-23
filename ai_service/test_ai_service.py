import json
from content_analyzer import ContentAnalyzer
from viral_predictor import ViralPredictor

# Sample real posts like those stored for @calonpejabatjujur
sample_posts = [
    {
        "id": "post-1",
        "caption": "Edukasi publik tentang pentingnya transparansi dan partisipasi aktif masyarakat #fyp #transparansi #indonesia",
        "postedAt": "2026-09-28T19:30:00Z",
        "likes": 2150,
        "comments": 45,
        "views": 24000,
        "shares": 25,
        "saves": 18
    },
    {
        "id": "post-2",
        "caption": "Kira-kira bagaimana solusi terbaik untuk mengatasi ketimpangan ekonomi di daerah? Tulis di komentar ya! #opini #ekonomi #viral",
        "postedAt": "2026-09-24T20:15:00Z",
        "likes": 3400,
        "comments": 92,
        "views": 42000,
        "shares": 54,
        "saves": 35
    },
    {
        "id": "post-3",
        "caption": "Update informasi penting seputar kebijakan anggaran pendidikan nasional #berita #kebijakan #edukasi",
        "postedAt": "2026-09-20T13:00:00Z",
        "likes": 950,
        "comments": 12,
        "views": 11000,
        "shares": 8,
        "saves": 5
    }
]

print("=== TESTING CONTENT ANALYZER ===")
content_res = ContentAnalyzer.analyze_posts(sample_posts, followers=25400, platform='TIKTOK')
print("Topics detected:", json.dumps(content_res['topics'], indent=2))
print("Top Keywords:", json.dumps(content_res['topKeywords'], indent=2))
print("Best Posting Hours:", json.dumps(content_res['bestPostingHours'], indent=2))

print("\n=== TESTING VIRAL PREDICTOR ===")
viral_res = ViralPredictor.batch_predict_posts(sample_posts, followers=25400, platform='TIKTOK')
print("Average Viral Score:", viral_res['averageViralScore'])
print("Ranked Posts Summary:")
for p in viral_res['rankedPosts']:
    print(f" - {p['postId']}: Score {p['viralScore']}% ({p['viralTierLabel']}), Drivers: {p['drivers']}")

print("\n=== TESTING DRAFT SIMULATOR ===")
sim_res = ViralPredictor.simulate_draft_post(
    caption="Kupas tuntas mengapa kebijakan transparansi anggaran wajib dikawal pemuda? Simak faktanya! #transparansi #pemuda #fyp",
    target_hour=20,
    target_day="Kamis",
    creator_median_views=24000,
    creator_median_er=9.3,
    followers=25400,
    platform='TIKTOK'
)
print("Draft Simulation:", json.dumps(sim_res, indent=2))
print("\nALL AI TESTS PASSED!")
