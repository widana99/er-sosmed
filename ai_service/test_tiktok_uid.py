import urllib.request
import json
import os

secUid = "MS4wLjABAAAAumODalOtaNE3TgtFnEHEyY4mX2zqmUn3LdIfFLa8aJjH8a-N0iSnh9prnnVQNntA"
url = f"https://www.tiktok.com/api/post/item_list/?secUid={secUid}&count=35&cursor=0"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://www.tiktok.com/@byoncombat',
    'Accept-Language': 'en-US,en;q=0.9',
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        text = resp.read().decode('utf-8', errors='ignore')
        print('HTTP Status:', resp.status)
        print('Response length:', len(text))
        try:
            data = json.loads(text)
            items = data.get('itemList', [])
            print('Items returned:', len(items))
            print('hasMore:', data.get('hasMore'))
            print('cursor:', data.get('cursor'))
            if items:
                print('Sample post #1:', items[0].get('desc')[:60], 'likes:', items[0].get('stats', {}).get('diggCount'))
        except Exception as pe:
            print('JSON parse error:', pe)
            print('First 200 chars:', text[:200])
except Exception as e:
    print('Request error:', e)
