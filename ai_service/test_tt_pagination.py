import urllib.request
import json
import os
import time
from pathlib import Path

# Load cookies from backend/.env
env_path = Path(__file__).resolve().parent.parent / 'backend' / '.env'
tt_cookie = ""
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith('TIKTOK_SESSION_COOKIE='):
            tt_cookie = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

print("Testing TikTok cursor pagination for byoncombat...")
print("Cookie present:", bool(tt_cookie), "Value length:", len(tt_cookie))

secUid = "MS4wLjABAAAAumODalOtaNE3TgtFnEHEyY4mX2zqmUn3LdIfFLa8aJjH8a-N0iSnh9prnnVQNntA"
collected = []
cursor = "0"
has_more = True
page = 0
max_pages = 5

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://www.tiktok.com/@byoncombat',
    'Accept-Language': 'en-US,en;q=0.9',
}
if tt_cookie:
    headers['Cookie'] = f"sessionid={tt_cookie}; sessionid_ss={tt_cookie}; sid_tt={tt_cookie}; sid_guard={tt_cookie}"

url = f"https://www.tiktok.com/api/post/item_list/?secUid={secUid}&count=35&cursor={cursor}"
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        text = resp.read().decode('utf-8', errors='ignore')
        print("Status code:", resp.status)
        print("Response length:", len(text))
        print("First 300 chars:", text[:300])
except Exception as e:
    print(f"Error: {e}")
