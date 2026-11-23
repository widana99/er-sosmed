import sys
import os
import json
import asyncio
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from python_scraper import PythonScraper
except ImportError:
    from ai_service.python_scraper import PythonScraper

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", required=True)
    parser.add_argument("--username", required=True)
    args = parser.parse_args()

    try:
        data = await PythonScraper.scrape_account(args.platform, args.username)
        if data is None:
            print(json.dumps({"success": False, "message": f"Akun @{args.username} tidak ditemukan."}))
        else:
            print(json.dumps({"success": True, "data": data}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    asyncio.run(main())

