import { Router } from 'express';
import {
  searchAccount,
  listAccounts,
  getAccountDetail,
  addPost,
  resolveAccountLink,
  getLeaderboard,
  updateJubirProfile,
  batchAnalyzeAccounts,
  extractLinksFromFile,
  deleteAccount,
} from '../controllers/accountController.js';
import {
  calculateAndSave,
  calculateDeepAnalysis,
  getDashboardKPI,
  getAllAnalyses,
  deleteAnalysisRun,
  clearAnalysisHistory,
} from '../controllers/analyticsController.js';
import {
  createBatchGroup,
  getBatchGroups,
  getBatchGroupDetail,
  deleteBatchGroup,
  getGroupCategories,
} from '../controllers/groupController.js';
import { compareAccounts } from '../controllers/comparisonController.js';
import { previewCsv, importCsv } from '../controllers/csvController.js';
import {
  exportAccountPdf,
  exportAccountsExcel,
  exportBatchExcel,
  exportGroupExcel,
  exportGroupPdf,
} from '../controllers/exportController.js';
import {
  getAccountAiIntelligence,
  simulateDraftPost,
  getAccountTrends,
} from '../controllers/aiController.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Auth mock (MVP)
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  return res.json({
    user: {
      id: 'admin-1',
      name: 'Admin Analyst',
      email,
      role: 'ADMIN',
    },
    token: 'jwt-session-token-mvp',
  });
});

apiRouter.get('/auth/me', (req, res) => {
  return res.json({
    user: {
      id: 'admin-1',
      name: 'Admin Analyst',
      email: 'admin@er-analyzer.local',
      role: 'ADMIN',
    },
  });
});

// Accounts & Jubir
apiRouter.post('/accounts/search', searchAccount);
apiRouter.post('/accounts/batch-analyze', batchAnalyzeAccounts);
apiRouter.post('/accounts/extract-links', extractLinksFromFile);
apiRouter.post('/accounts/resolve-link', resolveAccountLink);
apiRouter.get('/accounts', listAccounts);
apiRouter.get('/accounts/:id', getAccountDetail);
apiRouter.delete('/accounts/:id', deleteAccount);
apiRouter.post('/accounts/:id/posts', addPost);
apiRouter.patch('/accounts/:id/jubir', updateJubirProfile);

// Leaderboard & Regional Rankings
apiRouter.get('/leaderboard', getLeaderboard);

// Analytics & Dashboard
apiRouter.get('/analytics/kpi', getDashboardKPI);
apiRouter.get('/analytics/history', getAllAnalyses);
apiRouter.delete('/analytics/runs/:id', deleteAnalysisRun);
apiRouter.delete('/analytics/history', clearAnalysisHistory);
apiRouter.post('/analysis/calculate', calculateAndSave);
apiRouter.post('/analysis/calculate-deep', calculateDeepAnalysis);

// Batch Scraper Groups & Categories
apiRouter.get('/groups/categories', getGroupCategories);
apiRouter.get('/groups', getBatchGroups);
apiRouter.get('/groups/:id', getBatchGroupDetail);
apiRouter.post('/groups', createBatchGroup);
apiRouter.delete('/groups/:id', deleteBatchGroup);

// Comparison
apiRouter.post('/comparison', compareAccounts);

// CSV Import
apiRouter.post('/csv/preview', previewCsv);
apiRouter.post('/csv/import', importCsv);

// Export Reports (PDF & Excel)
apiRouter.get('/export/account/:id/pdf', exportAccountPdf);
apiRouter.get('/export/accounts/excel', exportAccountsExcel);
apiRouter.post('/export/batch-excel', exportBatchExcel);
apiRouter.get('/export/group/:id/excel', exportGroupExcel);
apiRouter.get('/export/group/:id/pdf', exportGroupPdf);

// AI Content Intelligence, Viral Prediction & Multi-Year Trends
apiRouter.get('/ai/account/:id/intelligence', getAccountAiIntelligence);
apiRouter.post('/ai/simulate-draft', simulateDraftPost);
apiRouter.get('/ai/account/:id/trends', getAccountTrends);

