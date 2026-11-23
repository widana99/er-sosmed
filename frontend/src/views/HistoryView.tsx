import React, { useEffect, useState } from 'react';
import { api, AnalysisRun } from '../services/api.js';
import { useLanguage } from '../i18n/LanguageContext.js';
import {
  History,
  Search,
  Filter,
  Calendar,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface HistoryViewProps {
  onSelectAccount: (accountId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectAccount }) => {
  const { t } = useLanguage();
  const [analyses, setAnalyses] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'>('ALL');

  // Deletion Modal States
  const [runToDelete, setRunToDelete] = useState<AnalysisRun | null>(null);
  const [deletingRun, setDeletingRun] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAnalyses();
      setAnalyses(data);
    } catch (err) {
      console.error('Failed to load analyses history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRun = async () => {
    if (!runToDelete) return;
    try {
      setDeletingRun(true);
      setActionError(null);
      await api.deleteAnalysisRun(runToDelete.id);
      setRunToDelete(null);
      setSuccessMsg('Riwayat kalkulasi analisis berhasil dihapus.');
      setTimeout(() => setSuccessMsg(null), 3500);
      await loadHistory();
    } catch (err: any) {
      setActionError(err.message || 'Gagal menghapus riwayat analisis.');
    } finally {
      setDeletingRun(false);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      setClearingAll(true);
      setActionError(null);
      const res = await api.clearAnalysisHistory(platformFilter === 'ALL' ? undefined : platformFilter);
      setShowClearAllModal(false);
      setSuccessMsg(res.message || 'Seluruh riwayat kalkulasi analisis berhasil dibersihkan.');
      setTimeout(() => setSuccessMsg(null), 3500);
      await loadHistory();
    } catch (err: any) {
      setActionError(err.message || 'Gagal membersihkan riwayat analisis.');
    } finally {
      setClearingAll(false);
    }
  };

  const filtered = analyses.filter((run) => {
    const matchesSearch =
      run.account?.username.toLowerCase().includes(search.toLowerCase()) ||
      run.formulaType.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform =
      platformFilter === 'ALL' || run.account?.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
            Riwayat Kalkulasi Analisis ER
          </h1>
          <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
            Audit jejak riwayat kalkulasi rumus, sample postingan, dan metrik interaktivitas.
          </p>
        </div>

        {analyses.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearAllModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-600 hover:text-white transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Semua Riwayat</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card-surface p-4 bg-white dark:bg-[#12141A] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-ink-tertiary-light dark:text-ink-tertiary-dark absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan username akun atau rumus kalkulasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {(['ALL', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                platformFilter === p
                  ? 'bg-brand text-white shadow-xs font-semibold'
                  : 'bg-surface-subtle-light dark:bg-surface-subtle-dark text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {p === 'ALL' ? 'Semua Platform' : p === 'FACEBOOK' ? 'Facebook' : p === 'YOUTUBE' ? 'YouTube' : p}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="card-surface p-6 bg-white dark:bg-[#12141A]">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-black/5 dark:bg-white/5 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-ink-tertiary-light dark:text-ink-tertiary-dark text-xs font-mono">
            Tidak ada riwayat kalkulasi analisis yang sesuai kriteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/5 font-mono uppercase text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Akun</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Formula</th>
                  <th className="py-2.5 px-3">Sample</th>
                  <th className="py-2.5 px-3 text-right">Avg Likes</th>
                  <th className="py-2.5 px-3 text-right">Avg Comments</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3 text-right">Engagement Rate</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
                {filtered.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 text-ink-tertiary-light dark:text-ink-tertiary-dark whitespace-nowrap cursor-pointer"
                    >
                      {new Date(run.analyzedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 font-semibold text-ink-primary-light dark:text-ink-primary-dark cursor-pointer"
                    >
                      @{run.account?.username}
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 cursor-pointer"
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        run.account?.platform === 'INSTAGRAM'
                          ? 'text-pink-600 bg-pink-50 dark:bg-pink-950/40'
                          : run.account?.platform === 'YOUTUBE'
                          ? 'text-red-600 bg-red-50 dark:bg-red-950/40'
                          : run.account?.platform === 'FACEBOOK'
                          ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                          : 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40'
                      }`}>
                        {run.account?.platform}
                      </span>
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 text-ink-secondary-light dark:text-ink-secondary-dark text-[11px] cursor-pointer"
                    >
                      {run.formulaType === 'FOLLOWER_BASED' ? 'Follower-based' : 'View-based'}
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 text-ink-secondary-light dark:text-ink-secondary-dark cursor-pointer"
                    >
                      {run.sampleSize} posts
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 text-right cursor-pointer"
                    >
                      {run.averageLikes.toLocaleString()}
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 text-right cursor-pointer"
                    >
                      {run.averageComments.toLocaleString()}
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 cursor-pointer"
                    >
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/10">
                        {run.source}
                      </span>
                    </td>
                    <td
                      onClick={() => onSelectAccount(run.accountId)}
                      className="py-3 px-3 text-right font-bold text-sm text-brand cursor-pointer"
                    >
                      {run.engagementRate.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRunToDelete(run);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 transition-all"
                        title="Hapus riwayat kalkulasi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Single Run Confirmation Modal */}
      {runToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#12141A] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark">
                  Hapus Riwayat Analisis?
                </h3>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
                  Konfirmasi penghapusan data kalkulasi
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
              Riwayat kalkulasi untuk akun <strong className="text-ink-primary-light dark:text-ink-primary-dark">@{runToDelete.account?.username}</strong> ({runToDelete.formulaType}, ER {runToDelete.engagementRate.toFixed(2)}%) yang dilakukan pada {new Date(runToDelete.analyzedAt).toLocaleDateString('id-ID')} akan dihapus permanen.
            </p>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setRunToDelete(null)}
                disabled={deletingRun}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteRun}
                disabled={deletingRun}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingRun ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Riwayat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#12141A] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink-primary-light dark:text-ink-primary-dark">
                  Bersihkan Seluruh Riwayat Analisis?
                </h3>
                <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
                  Tindakan ini akan menghapus semua riwayat kalkulasi
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
              Anda akan menghapus seluruh data catatan riwayat kalkulasi ER{platformFilter !== 'ALL' ? ` untuk platform ${platformFilter}` : ''}. Akun dan postingan tidak akan terhapus, hanya rekaman riwayat audit kalkulasi yang dibersihkan.
            </p>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                disabled={clearingAll}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-ink-secondary-light dark:text-ink-secondary-dark transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAllHistory}
                disabled={clearingAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {clearingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan Semua</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

