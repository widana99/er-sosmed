import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from content_analyzer import ContentAnalyzer
from viral_predictor import ViralPredictor
from data_engine import DataEngine
from trend_analyzer import TrendAnalyzer
from python_scraper import PythonScraper
from youtube_scraper import YouTubeScraper

app = FastAPI(
    title="ER Social Media - AI Content, Data & Viral Intelligence Service",
    description="Production-grade AI microservice for empirical content analysis, Pandas/NumPy calculation, time-series trends, and Python scraping.",
    version="1.2.0"
)

# Enable CORS for localhost access from Express backend / React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PostItem(BaseModel):
    id: Optional[str] = None
    postUrl: Optional[str] = None
    caption: Optional[str] = ""
    postedAt: Optional[str] = None
    likes: Optional[int] = 0
    comments: Optional[int] = 0
    views: Optional[int] = 0
    shares: Optional[int] = 0
    saves: Optional[int] = 0
    contentType: Optional[str] = "VIDEO"

class AccountAnalysisRequest(BaseModel):
    username: str
    platform: str = "TIKTOK"
    followers: int = 1
    posts: List[Dict[str, Any]] = Field(default_factory=list)
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    filterYear: Optional[str] = None
    filterMonth: Optional[str] = None
    contentType: Optional[str] = None

class DraftSimulationRequest(BaseModel):
    caption: str
    targetHour: int = 19
    targetDay: str = "Jumat"
    followers: int = 1000
    platform: str = "TIKTOK"
    creatorMedianViews: float = 5000.0
    creatorMedianER: float = 6.0
    peakHours: Optional[List[int]] = None

class ScrapeAccountRequest(BaseModel):
    platform: str = "TIKTOK"
    username: str

class ScrapeYouTubeRequest(BaseModel):
    username: str
    maxVideos: Optional[int] = 150

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Content, Data & Viral Intelligence Engine",
        "version": "1.2.0",
        "capabilities": [
            "Pandas & NumPy Comprehensive Data Engine",
            "Multi-Year & Monthly Time-Series Trend Analyzer",
            "YouTube InnerTube Multi-Format Scraper (Long, Shorts, Live)",
            "Empirical Topic Modeling",
            "Keyword Impact Extraction (TF-IDF)",
            "Temporal Prime-Time Optimization",
            "Algorithmic Viral Prediction (0-100%)",
            "Draft Content Simulator",
            "Python Resilient Scraper"
        ]
    }

# ─── 1. Authoritative Calculations via Pandas & NumPy ───

@app.post("/api/calculate/comprehensive")
def calculate_comprehensive(req: AccountAnalysisRequest):
    try:
        results = DataEngine.calculate_comprehensive(
            platform=req.platform,
            followers=req.followers,
            posts=req.posts,
            username=req.username,
            start_date=req.startDate,
            end_date=req.endDate,
            filter_year=req.filterYear,
            filter_month=req.filterMonth,
            content_type=req.contentType,
        )
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── YouTube Scraping Endpoint ───

@app.post("/api/scrape/youtube")
async def scrape_youtube(req: ScrapeYouTubeRequest):
    try:
        res = await YouTubeScraper.scrape_channel(req.username, max_videos_per_type=req.maxVideos or 150)
        if not res:
            raise HTTPException(status_code=404, detail=f"Channel YouTube @{req.username} tidak ditemukan.")
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── 2. Multi-Year & Monthly Time-Series Trends ───

@app.post("/api/analytics/trends")
def analyze_trends(req: AccountAnalysisRequest):
    try:
        results = TrendAnalyzer.analyze_trends(
            posts=req.posts,
            followers=req.followers,
            platform=req.platform,
            username=req.username,
        )
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── 3. Python-Native Scraper Engine ───

@app.post("/api/scraper/scrape-account")
async def scrape_account(req: ScrapeAccountRequest):
    try:
        result = await PythonScraper.scrape_account(
            platform=req.platform,
            username=req.username
        )
        if result is None:
            return {"success": False, "message": f"Akun @{req.username} tidak ditemukan atau terproteksi."}
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── 4. AI Content Intelligence & Viral Prediction ───

@app.post("/api/ai/analyze-content")
def analyze_content(req: AccountAnalysisRequest):
    try:
        results = ContentAnalyzer.analyze_posts(
            posts=req.posts,
            followers=req.followers,
            platform=req.platform
        )
        return {
            "success": True,
            "username": req.username,
            "platform": req.platform,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/predict-viral")
def predict_viral(req: AccountAnalysisRequest):
    try:
        results = ViralPredictor.batch_predict_posts(
            posts=req.posts,
            followers=req.followers,
            platform=req.platform
        )
        return {
            "success": True,
            "username": req.username,
            "platform": req.platform,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/simulate-draft")
def simulate_draft(req: DraftSimulationRequest):
    try:
        result = ViralPredictor.simulate_draft_post(
            caption=req.caption,
            target_hour=req.targetHour,
            target_day=req.targetDay,
            creator_median_views=req.creatorMedianViews,
            creator_median_er=req.creatorMedianER,
            followers=req.followers,
            platform=req.platform,
            peak_hours=req.peakHours
        )
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/full-intelligence")
def full_intelligence(req: AccountAnalysisRequest):
    try:
        content_insights = ContentAnalyzer.analyze_posts(
            posts=req.posts,
            followers=req.followers,
            platform=req.platform
        )

        peak_hours = [
            int(h['hour'].split(':')[0])
            for h in content_insights.get('bestPostingHours', [])
        ]

        viral_insights = ViralPredictor.batch_predict_posts(
            posts=req.posts,
            followers=req.followers,
            platform=req.platform,
            peak_hours=peak_hours
        )

        return {
            "success": True,
            "username": req.username,
            "platform": req.platform,
            "followers": req.followers,
            "contentIntelligence": content_insights,
            "viralPrediction": viral_insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
