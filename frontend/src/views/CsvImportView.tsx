import React, { useState, useRef } from 'react';
import { api } from '../services/api.js';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  FolderOpen,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';

const SAMPLE_CSV = `platform,username,followers,post_date,likes,comments,views,shares
instagram,ginoptrwdna,12500,2026-09-25,720,32,8200,120
instagram,creativestudio,28400,2026-09-24,1420,84,18400,320
tiktok,trendmaker,95000,2026-09-25,5200,140,105000,420
youtube,gadgetin,12500000,2026-09-24,45000,1800,850000,1200
facebook,kemensetneg.ri,240000,2026-09-23,1200,85,15000,450`;

interface CsvImportViewProps {
  onSelectAccount: (accountId: string) => void;
}

export const CsvImportView: React.FC<CsvImportViewProps> = ({ onSelectAccount }) => {
  const { t } = useLanguage();
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Harap pilih file dengan ekstensi .csv');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      setPreview(null);
      setImportResult(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('Gagal membaca file CSV.');
    };
    reader.readAsText(file);
    // Reset input so same file can be reloaded if needed
    e.target.value = '';
  };

  const handlePreview = async () => {
    if (!csvContent.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.previewCsv(csvContent);
      setPreview(res);
      setImportResult(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memvalidasi struktur CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!csvContent.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.importCsv(csvContent);
      setImportResult(res);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Gagal mengimpor data CSV');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setCsvContent(SAMPLE_CSV);
    setPreview(null);
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
          {t.csvTitle}
        </h1>
        <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
          {t.csvSubtitle}
        </p>
      </div>

      {/* CSV Input Card */}
      <div className="card-surface p-6 bg-white dark:bg-[#12141A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              Input & Impor File CSV
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.uploadCsvBtn}</span>
            </button>
            <button
              onClick={loadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-brand/10 text-brand hover:bg-brand/20 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.loadSampleCsv}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark font-mono">
          Header Wajib:{' '}
          <code className="text-brand">
            platform,username,followers,post_date,likes,comments,views,shares
          </code>
        </p>

        <textarea
          rows={7}
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder={`Tempel baris data CSV Anda di sini atau klik "Unggah File .CSV" di atas...`}
          className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg p-3 text-xs font-mono text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand focus:outline-hidden"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={loading || !csvContent.trim()}
            className="px-4 py-2 bg-surface-subtle-light dark:bg-surface-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold rounded-lg text-ink-primary-light dark:text-ink-primary-dark transition-all disabled:opacity-50"
          >
            {loading ? 'Memvalidasi...' : t.validatePreview}
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !csvContent.trim()}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{loading ? 'Memproses...' : t.importCalculate}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Validation Preview Table */}
      {preview && (
        <div className="card-surface p-6 bg-white dark:bg-[#12141A] space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
                Pratinjau Validasi CSV ({preview.validRows} / {preview.totalRows} baris valid)
              </h3>
            </div>
            <button
              onClick={handleImport}
              className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {t.importCalculate}
            </button>
          </div>

          {preview.errors && preview.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs space-y-1">
              <p className="font-bold">Peringatan Validasi:</p>
              {preview.errors.map((e: string, idx: number) => (
                <p key={idx}>• {e}</p>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-black/5 dark:border-white/5 uppercase text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
                <tr>
                  <th className="py-2 px-3">Platform</th>
                  <th className="py-2 px-3">Username</th>
                  <th className="py-2 px-3">Followers</th>
                  <th className="py-2 px-3">Post Date</th>
                  <th className="py-2 px-3 text-right">Likes</th>
                  <th className="py-2 px-3 text-right">Comments</th>
                  <th className="py-2 px-3 text-right">Views</th>
                  <th className="py-2 px-3 text-right">Shares</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {preview.records.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="py-2 px-3 font-semibold uppercase">{row.platform}</td>
                    <td className="py-2 px-3 text-brand">@{row.username}</td>
                    <td className="py-2 px-3">{row.followers.toLocaleString()}</td>
                    <td className="py-2 px-3 text-ink-tertiary-light dark:text-ink-tertiary-dark">
                      {row.postDate}
                    </td>
                    <td className="py-2 px-3 text-right">{row.likes}</td>
                    <td className="py-2 px-3 text-right">{row.comments}</td>
                    <td className="py-2 px-3 text-right">{row.views || '—'}</td>
                    <td className="py-2 px-3 text-right">{row.shares || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Success Output */}
      {importResult && (
        <div className="card-surface p-6 bg-white dark:bg-[#12141A] space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-bold font-display">{importResult.message}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {importResult.importedAccounts.map((item: any) => (
              <div
                key={item.account.id}
                onClick={() => onSelectAccount(item.account.id)}
                className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark">
                    @{item.account.username}
                  </p>
                  <p className="text-xs text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono">
                    {item.account.platform} • {item.postsImported} {t.postsTracked.toLowerCase()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-brand block">
                    {item.analysis.engagementRate.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono">
                    {t.calculatedEr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
