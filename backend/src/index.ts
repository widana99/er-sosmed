import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (high signal, minimal noise)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400 || process.env.NODE_ENV === 'development') {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ER Analyzer Backend running on http://localhost:${PORT}`);
  if (process.env.RAPIDAPI_KEY) {
    console.log(`🔑 RapidAPI key loaded (Tier 1: primary data source)`);
    console.log(`   TikTok host: ${process.env.RAPIDAPI_TIKTOK_HOST || 'tiktok-scraper7.p.rapidapi.com'}`);
    console.log(`   Instagram host: ${process.env.RAPIDAPI_INSTAGRAM_HOST || 'instagram-scraper-api2.p.rapidapi.com'}`);
  } else {
    console.log(`ℹ️  RapidAPI key not set — authenticated Browser Scraper & SSR scraper active`);
  }
  if (process.env.TIKTOK_SESSION_COOKIE) console.log(`🔑 TikTok session cookie loaded (authenticated realtime scraping)`);
  if (process.env.INSTAGRAM_SESSION_COOKIE) console.log(`🔑 Instagram session cookie loaded (authenticated realtime scraping)`);
  console.log(`🌐 Realtime Browser Engine: Active (Chrome/Edge Puppeteer)`);
});
