"""
python_scraper.py
Python-native resilient scraper engine using HTTPX, BeautifulSoup, and Regex.
Extracts live profiles and post feeds for TikTok and Instagram without dummy data.
"""

import re
import json
import logging
from typing import Dict, Any, Optional, List
import os
from pathlib import Path
import httpx
from bs4 import BeautifulSoup
try:
    from content_analyzer import ContentAnalyzer
except ImportError:
    from ai_service.content_analyzer import ContentAnalyzer

logger = logging.getLogger("python_scraper")
logging.basicConfig(level=logging.INFO)


class PythonScraper:
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    ]

    @staticmethod
    def get_env_cookies() -> Dict[str, str]:
        cookies = {}
        tt_cookie = os.environ.get("TIKTOK_SESSION_COOKIE", "")
        if not tt_cookie:
            env_file = Path(__file__).resolve().parent.parent / "backend" / ".env"
            if env_file.exists():
                try:
                    for line in env_file.read_text(encoding="utf-8").splitlines():
                        if line.startswith("TIKTOK_SESSION_COOKIE="):
                            tt_cookie = line.split("=", 1)[1].strip(" \"'")
                            break
                except Exception:
                    pass
        if tt_cookie:
            cookies["sessionid"] = tt_cookie
            cookies["sessionid_ss"] = tt_cookie
            cookies["sid_tt"] = tt_cookie
            cookies["sid_guard"] = tt_cookie
        return cookies

    @classmethod
    async def scrape_account(cls, platform: str, username: str) -> Optional[Dict[str, Any]]:
        clean_user = username.strip().replace("@", "")
        plat = platform.upper()

        if plat == "TIKTOK":
            return await cls.scrape_tiktok(clean_user)
        elif plat == "INSTAGRAM":
            return await cls.scrape_instagram(clean_user)
        elif plat == "FACEBOOK":
            try:
                from facebook_scraper import FacebookScraper
            except ImportError:
                from ai_service.facebook_scraper import FacebookScraper
            return await FacebookScraper.scrape_account(clean_user)
        elif plat == "YOUTUBE":
            try:
                from youtube_scraper import YouTubeScraper
            except ImportError:
                from ai_service.youtube_scraper import YouTubeScraper
            return await YouTubeScraper.scrape_channel(clean_user)
        else:
            raise ValueError(f"Platform {platform} tidak didukung.")

    @classmethod
    async def scrape_tiktok(cls, username: str) -> Optional[Dict[str, Any]]:
        url = f"https://www.tiktok.com/@{username}"
        cookies = cls.get_env_cookies()
        headers = {
            "User-Agent": cls.USER_AGENTS[2],  # Mobile UA avoids aggressive bot blocks & returns hydration
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.tiktok.com/",
        }

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, cookies=cookies) as client:
            try:
                res = await client.get(url, headers=headers)
                if res.status_code == 404:
                    return None

                html = res.text

                # 1. Try extracting __UNIVERSAL_DATA_FOR_REHYDRATION__
                match = re.search(r'<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html, re.DOTALL)
                if match:
                    try:
                        data = json.loads(match.group(1))
                        default_scope = data.get("__DEFAULT_SCOPE__", {})
                        user_detail = default_scope.get("webapp.user-detail", {})
                        user_info = user_detail.get("userInfo", {}).get("user", {})
                        stats = user_detail.get("userInfo", {}).get("stats", {})

                        if user_info:
                            followers = int(stats.get("followerCount", 0))
                            following = int(stats.get("followingCount", 0))
                            video_count = int(stats.get("videoCount", 0))
                            signature = user_info.get("signature", "")
                            display_name = user_info.get("nickname") or username

                            # Extract posts
                            posts = []
                            items = user_detail.get("itemList", [])
                            if not items:
                                items = default_scope.get("webapp.user-detail", {}).get("itemModule", {})
                                if isinstance(items, dict):
                                    items = list(items.values())

                            # Try items from list
                            for item in items:
                                if isinstance(item, dict):
                                    post_stats = item.get("stats", {})
                                    cap = item.get("desc", "")
                                    posts.append({
                                        "id": str(item.get("id") or ""),
                                        "likes": int(post_stats.get("diggCount", 0)),
                                        "comments": int(post_stats.get("commentCount", 0)),
                                        "views": int(post_stats.get("playCount", 0)),
                                        "shares": int(post_stats.get("shareCount", 0)),
                                        "caption": cap,
                                        "postUrl": f"https://www.tiktok.com/@{username}/video/{item.get('id')}",
                                        "postedAt": item.get("createTime", None),
                                        "contentNiche": ContentAnalyzer.classify_topic(cap),
                                    })

                            corpus = f"{username} {display_name} {signature} " + " ".join(p['caption'] for p in posts)
                            primary_niche = ContentAnalyzer.classify_topic(corpus)

                            return {
                                "platform": "TIKTOK",
                                "username": username,
                                "displayName": display_name,
                                "avatarUrl": user_info.get("avatarLarger") or user_info.get("avatarThumb"),
                                "profileUrl": url,
                                "biography": signature,
                                "followers": followers,
                                "following": following,
                                "postsCount": video_count,
                                "contentNiche": primary_niche,
                                "isPrivate": bool(user_info.get("privateAccount", False) or user_info.get("secret", False)),
                                "source": "PYTHON_SCRAPER",
                                "posts": posts,
                            }
                    except Exception as parse_err:
                        logger.warning(f"Error parsing TikTok hydration JSON: {parse_err}")

                # 2. Open HTML / Meta Tag Parsing fallback
                soup = BeautifulSoup(html, "html.parser")
                meta_desc = soup.find("meta", {"name": "description"})
                desc_content = meta_desc.get("content", "") if meta_desc else ""

                # Example meta desc: "NAMA (@user) di TikTok | 25.4K Suka. 1200 Pengikut. Tonton video terbaru..."
                followers = 0
                following = 0
                posts_count = 0

                fol_match = re.search(r"([\d.,]+[KkMm]?)\s+(?:Pengikut|Followers)", desc_content)
                if fol_match:
                    followers = cls._parse_human_number(fol_match.group(1))

                # Extract title
                title_tag = soup.find("title")
                display_name = username
                if title_tag and title_tag.text:
                    display_name = title_tag.text.split("(")[0].strip() or username

                is_private = bool(
                    "this account is private" in html.lower() or
                    "akun ini bersifat pribadi" in html.lower() or
                    "akun ini privat" in html.lower()
                )

                return {
                    "platform": "TIKTOK",
                    "username": username,
                    "displayName": display_name,
                    "avatarUrl": None,
                    "profileUrl": url,
                    "followers": followers,
                    "following": following,
                    "postsCount": posts_count,
                    "isPrivate": is_private,
                    "source": "PYTHON_SCRAPER",
                    "posts": [],
                }
            except Exception as e:
                logger.error(f"TikTok scraping error for {username}: {e}")
                return None

    @classmethod
    async def scrape_instagram(cls, username: str) -> Optional[Dict[str, Any]]:
        url = f"https://www.instagram.com/{username}/"
        headers = {
            "User-Agent": cls.USER_AGENTS[0],
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
        }

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            try:
                res = await client.get(url, headers=headers)
                if res.status_code == 404:
                    return None

                html = res.text
                soup = BeautifulSoup(html, "html.parser")

                # Meta description parsing
                # e.g.: "12.5K Followers, 450 Following, 120 Posts - See Instagram photos and videos from..."
                meta_desc = soup.find("meta", {"name": "description"}) or soup.find("meta", {"property": "og:description"})
                desc_content = meta_desc.get("content", "") if meta_desc else ""

                followers = 0
                following = 0
                posts_count = 0

                parts = desc_content.split("-")[0] if "-" in desc_content else desc_content
                fol_match = re.search(r"([\d.,]+[KkMm]?)\s+(?:Followers|Pengikut)", parts, re.IGNORECASE)
                if fol_match:
                    followers = cls._parse_human_number(fol_match.group(1))

                fing_match = re.search(r"([\d.,]+[KkMm]?)\s+(?:Following|Mengikuti)", parts, re.IGNORECASE)
                if fing_match:
                    following = cls._parse_human_number(fing_match.group(1))

                posts_match = re.search(r"([\d.,]+[KkMm]?)\s+(?:Posts|Postingan)", parts, re.IGNORECASE)
                if posts_match:
                    posts_count = cls._parse_human_number(posts_match.group(1))

                # Image
                og_image = soup.find("meta", {"property": "og:image"})
                avatar_url = og_image.get("content") if og_image else None

                # Title
                og_title = soup.find("meta", {"property": "og:title"})
                display_name = username
                if og_title and og_title.get("content"):
                    display_name = og_title.get("content").split("(@")[0].strip() or username

                return {
                    "platform": "INSTAGRAM",
                    "username": username,
                    "displayName": display_name,
                    "avatarUrl": avatar_url,
                    "profileUrl": url,
                    "followers": followers,
                    "following": following,
                    "postsCount": posts_count,
                    "isPrivate": bool(
                        '"is_private":true' in html or
                        "this account is private" in html.lower() or
                        "akun ini bersifat pribadi" in html.lower() or
                        "akun ini privat" in html.lower()
                    ),
                    "source": "PYTHON_SCRAPER",
                    "posts": [],
                }
            except Exception as e:
                logger.error(f"Instagram scraping error for {username}: {e}")
                return None

    @staticmethod
    def _parse_human_number(text: str) -> int:
        clean = text.replace(",", ".").replace(" ", "").upper()
        if "K" in clean:
            val = float(clean.replace("K", ""))
            return int(val * 1000)
        elif "M" in clean:
            val = float(clean.replace("M", ""))
            return int(val * 1000000)
        else:
            try:
                return int(float(clean))
            except ValueError:
                return 0
