import httpx
import re
import json

url = "https://www.youtube.com/watch?v=1XqBPxAx-6w"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
res = httpx.get(url, headers=headers, follow_redirects=True)
text = res.text

# Extract likeCount
m_likes = re.search(r'"likeCount":\s*"(\d+)"', text)
print("likeCount:", m_likes.group(1) if m_likes else "Not found")

# Extract comment count
m_comm = re.search(r'"commentCount":\s*\{\s*"simpleText":\s*"([0-9.,]+)"', text) or re.search(r'"totalComments":\s*"(\d+)"', text)
print("commentCount:", m_comm.group(1) if m_comm else "Not found")

# Also check ytInitialData
m = re.search(r'var ytInitialData = ({.*?});</script>', text)
if m:
    d = json.loads(m.group(1))
    contents = d.get("contents", {}).get("twoColumnWatchNextResults", {})
    results = contents.get("results", {}).get("results", {}).get("contents", [])
    print("Watch results items:", len(results))
    for r in results:
        vpr = r.get("videoPrimaryInfoRenderer")
        if vpr:
            print("Title:", vpr.get("title", {}).get("runs", [{}])[0].get("text"))
            print("Views:", vpr.get("viewCount", {}).get("videoViewCountRenderer", {}).get("viewCount", {}).get("simpleText"))
