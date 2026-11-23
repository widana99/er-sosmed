import urllib.request
import json

years = ['2026', '2025', '2024', '2023']
print("=== VERIFYING MULTI-YEAR FILTERING ON 2,732 POSTS OF @byoncombat ===")

for y in years:
    url = f"http://localhost:5000/api/accounts/e16076f1-8762-4512-8250-f00c77cd9034?year={y}"
    res = urllib.request.urlopen(url)
    data = json.loads(res.read().decode())
    meta = data.get('deepAnalysis', {}).get('filterMeta', {})
    count = meta.get('filteredPostsCount', 0)
    median_er = data.get('deepAnalysis', {}).get('medianER', 0)
    mean_er = data.get('deepAnalysis', {}).get('averageER', 0)
    avg_views = data.get('deepAnalysis', {}).get('averageViews', 0)
    consistency = data.get('deepAnalysis', {}).get('consistencyScore', 0)
    print(f"Year {y}: {count} posts | Median ER: {median_er}% | Mean ER: {mean_er}% | Consistency: {consistency}% | Avg Views: {avg_views:,.0f}")

print("\n=== VERIFYING SPECIFIC MONTH FILTER (e.g. Mei 2025) ===")
url_month = "http://localhost:5000/api/accounts/e16076f1-8762-4512-8250-f00c77cd9034?year=2025&month=4"
res_m = urllib.request.urlopen(url_month)
data_m = json.loads(res_m.read().decode())
meta_m = data_m.get('deepAnalysis', {}).get('filterMeta', {})
print(f"Mei 2025: {meta_m.get('filteredPostsCount')} posts | Median ER: {data_m.get('deepAnalysis', {}).get('medianER')}%")

print("\n=== VERIFYING CUSTOM DATE RANGE (e.g. 2024-06-01 to 2024-12-31) ===")
url_range = "http://localhost:5000/api/accounts/e16076f1-8762-4512-8250-f00c77cd9034?startDate=2024-06-01&endDate=2024-12-31"
res_r = urllib.request.urlopen(url_range)
data_r = json.loads(res_r.read().decode())
meta_r = data_r.get('deepAnalysis', {}).get('filterMeta', {})
print(f"H2 2024: {meta_r.get('filteredPostsCount')} posts | Median ER: {data_r.get('deepAnalysis', {}).get('medianER')}%")
