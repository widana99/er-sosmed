import asyncio
from youtube_scraper import YouTubeScraper

async def test():
    data = await YouTubeScraper.scrape_channel('@byoncombat', max_videos_per_type=10)
    print("Channel:", data.get('displayName'), "| Subscribers:", data.get('followers'))
    print("Breakdown:", data.get('breakdown'))
    for p in data.get('posts', [])[:6]:
        print(f"[{p.get('contentType')}] {p.get('caption')[:45]} | Views: {p.get('views')} | Likes: {p.get('likes')} | Comments: {p.get('comments')}")

asyncio.run(test())
