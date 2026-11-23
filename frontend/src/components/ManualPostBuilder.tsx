import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  Calculator,
  Instagram,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Youtube,
  Facebook,
} from 'lucide-react';
import { OcrService, cleanOcrNumber } from '../services/ocrService.js';
import { useLanguage } from '../i18n/LanguageContext.js';

export interface ManualPostRow {
  id: string;
  imagePreview?: string;
  postUrl?: string;
  likes: number | '';
  comments: number | '';
  views: number | '';
  shares: number | '';
  caption: string;
  ocrProcessing?: boolean;
}

export interface ManualAnalysisPayload {
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  username: string;
  followers: number;
  posts: Array<{
    likes: number;
    comments: number;
    views?: number;
    shares?: number;
    caption?: string;
  }>;
}

export interface ManualPostBuilderInitialData {
  platform?: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  username?: string;
  followers?: number;
  posts?: ManualPostRow[];
}

interface ManualPostBuilderProps {
  onAnalyze: (payload: ManualAnalysisPayload) => void;
  loading?: boolean;
  initialData?: ManualPostBuilderInitialData | null;
}

export const ManualPostBuilder: React.FC<ManualPostBuilderProps> = ({
  onAnalyze,
  loading = false,
  initialData,
}) => {
  const { t, language } = useLanguage();
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'>(initialData?.platform || 'INSTAGRAM');
  const [username, setUsername] = useState(initialData?.username || '');
  const [followers, setFollowers] = useState<number | ''>(
    initialData?.followers !== undefined && initialData.followers > 0 ? initialData.followers : ''
  );
  const [posts, setPosts] = useState<ManualPostRow[]>(
    initialData?.posts && initialData.posts.length > 0
      ? initialData.posts
      : [
          { id: '1', likes: '', comments: '', views: '', shares: '', caption: '' },
          { id: '2', likes: '', comments: '', views: '', shares: '', caption: '' },
          { id: '3', likes: '', comments: '', views: '', shares: '', caption: '' },
        ]
  );

  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [profileOcrLoading, setProfileOcrLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.platform) setPlatform(initialData.platform);
      if (initialData.username !== undefined) setUsername(initialData.username);
      if (initialData.followers !== undefined && initialData.followers > 0) setFollowers(initialData.followers);
      if (initialData.posts && initialData.posts.length > 0) {
        setPosts(initialData.posts);
        setOcrStatus(
          language === 'id'
            ? `✓ Memuat ${initialData.posts.length} postingan dari akun @${initialData.username || 'user'}. Anda dapat memeriksa dan menyesuaikan metrik sebelum kalkulasi.`
            : `✓ Loaded ${initialData.posts.length} posts from @${initialData.username || 'user'}. You can inspect and adjust metrics before calculation.`
        );
      }
    }
  }, [initialData, language]);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const postsInputRef = useRef<HTMLInputElement>(null);

  // 1. Profile OCR Handler
  const handleProfileImageUpload = async (file: File) => {
    try {
      setProfileOcrLoading(true);
      setErrorMsg(null);
      const parsed = await OcrService.parseProfileScreenshot(file);
      if (parsed.username && !username) {
        setUsername(parsed.username);
      }
      if (parsed.followers) {
        setFollowers(parsed.followers);
      }
      setOcrStatus(
        language === 'id'
          ? `Berhasil membaca profil: @${parsed.username || username || 'akun'} (${parsed.followers?.toLocaleString() || 0} pengikut)`
          : `Profile detected: @${parsed.username || username || 'account'} (${parsed.followers?.toLocaleString() || 0} followers)`
      );
    } catch (err: any) {
      console.error('Profile OCR failed:', err);
      setErrorMsg(language === 'id' ? 'Gagal membaca screenshot profil. Silakan masukkan angka followers secara manual.' : 'Failed to parse profile screenshot.');
    } finally {
      setProfileOcrLoading(false);
    }
  };

  // 2. Batch Post Screenshots Handler
  const handlePostImagesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setOcrStatus(
      language === 'id'
        ? `Memproses ${files.length} screenshot postingan dengan OCR browser...`
        : `Processing ${files.length} post screenshots with client OCR...`
    );

    const newRows: ManualPostRow[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const rowId = `post-ocr-${Date.now()}-${i}`;

      try {
        const parsed = await OcrService.parsePostScreenshot(file);
        newRows.push({
          id: rowId,
          imagePreview: previewUrl,
          likes: parsed.likes !== undefined ? parsed.likes : '',
          comments: parsed.comments !== undefined ? parsed.comments : '',
          views: parsed.views !== undefined ? parsed.views : '',
          shares: parsed.shares !== undefined ? parsed.shares : '',
          caption: parsed.caption || file.name.replace(/\.[^/.]+$/, ''),
        });
      } catch (err) {
        console.error('Post OCR failed for file:', file.name, err);
        newRows.push({
          id: rowId,
          imagePreview: previewUrl,
          likes: '',
          comments: '',
          views: '',
          shares: '',
          caption: file.name,
        });
      }
    }

    setPosts((prev) => {
      // Replace initial empty placeholder rows if they are untouched
      const isInitialUntouched = prev.every((r) => r.likes === '' && r.comments === '' && !r.imagePreview);
      return isInitialUntouched ? newRows : [...prev, ...newRows];
    });

    setOcrStatus(
      language === 'id'
        ? `Selesai! ${newRows.length} postingan berhasil diekstrak. Silakan periksa angka sebelum kalkulasi.`
        : `Done! ${newRows.length} posts extracted. Please verify metrics before calculation.`
    );
  };

  // Add / Remove Rows
  const handleAddRow = () => {
    setPosts((prev) => [
      ...prev,
      { id: `post-${Date.now()}`, likes: '', comments: '', views: '', shares: '', caption: '' },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setPosts((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleUpdateRow = (id: string, field: keyof ManualPostRow, value: any) => {
    setPosts((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Preset demo data for fast testing
  const handleLoadSample = () => {
    setUsername('sample_creator');
    setFollowers(25000);
    setPosts([
      { id: '1', likes: 1200, comments: 85, views: 18400, shares: 14, caption: 'Tutorial Konten Edukasi #1' },
      { id: '2', likes: 2450, comments: 140, views: 42000, shares: 62, caption: 'Behind the scene video produksi' },
      { id: '3', likes: 980, comments: 45, views: 14200, shares: 8, caption: 'Q&A sesi tanya jawab bersama followers' },
      { id: '4', likes: 8500, comments: 620, views: 165000, shares: 320, caption: 'Konten Viral FYP kolaborasi partner' },
      { id: '5', likes: 1100, comments: 65, views: 16900, shares: 12, caption: 'Update mingguan jadwal kegiatan' },
    ]);
    setErrorMsg(null);
    setOcrStatus(language === 'id' ? 'Contoh 5 data postingan berhasil dimuat!' : 'Sample 5 posts data loaded!');
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numFollowers = Number(followers);
    if (!numFollowers || numFollowers <= 0) {
      setErrorMsg(language === 'id' ? 'Jumlah followers harus diisi angka lebih dari 0.' : 'Followers count must be greater than 0.');
      return;
    }

    const validPosts = posts
      .filter((p) => p.likes !== '' || p.views !== '')
      .map((p) => ({
        likes: Number(p.likes) || 0,
        comments: Number(p.comments) || 0,
        views: p.views !== '' ? Number(p.views) : undefined,
        shares: p.shares !== '' ? Number(p.shares) : undefined,
        caption: p.caption,
      }));

    if (validPosts.length === 0) {
      setErrorMsg(language === 'id' ? 'Masukkan minimal 1 data postingan dengan angka likes atau views.' : 'At least 1 post with likes or views is required.');
      return;
    }

    onAnalyze({
      platform,
      username: username.trim() || 'User Account',
      followers: numFollowers,
      posts: validPosts,
    });
  };

  return (
    <div className="card-surface p-6 sm:p-8 space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-brand/10 text-brand border border-brand/20">
              <Calculator className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              {language === 'id' ? 'Input Manual & OCR Screenshot per Postingan' : 'Manual Input & Multi-Post Screenshot OCR'}
            </h2>
          </div>
          <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
            {language === 'id'
              ? 'Input data individual per post secara manual atau seret screenshot untuk ekstraksi angka otomatis. Mencegah bias rata-rata.'
              : 'Enter individual post metrics manually or drag screenshot images to auto-extract numbers. Eliminates outlier skew.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/10 dark:border-white/10 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all text-ink-secondary-light dark:text-ink-secondary-dark shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{language === 'id' ? 'Muat Contoh Data' : 'Load Sample Data'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Account Profile Card */}
        <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark">
              1. {language === 'id' ? 'Informasi Akun & Pengikut' : 'Account Profile & Followers'}
            </span>

            {/* Profile Screenshot OCR Trigger */}
            <input
              type="file"
              ref={profileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleProfileImageUpload(e.target.files[0]);
              }}
            />
            <button
              type="button"
              disabled={profileOcrLoading}
              onClick={() => profileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-semibold disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {profileOcrLoading
                  ? (language === 'id' ? 'Membaca Screenshot...' : 'Reading Screenshot...')
                  : (language === 'id' ? 'Auto-fill via Screenshot Profil' : 'Auto-fill from Profile Screenshot')}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Platform Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                {t.platform} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-surface-subtle-light dark:bg-surface-subtle-dark p-1 rounded-xl border border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setPlatform('INSTAGRAM')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    platform === 'INSTAGRAM'
                      ? 'bg-white dark:bg-[#1A1E2B] text-pink-600 shadow-xs'
                      : 'text-ink-secondary-light dark:text-ink-secondary-dark'
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('TIKTOK')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    platform === 'TIKTOK'
                      ? 'bg-white dark:bg-[#1A1E2B] text-cyan-600 dark:text-cyan-400 shadow-xs'
                      : 'text-ink-secondary-light dark:text-ink-secondary-dark'
                  }`}
                >
                  <span className="font-bold text-[10px]">TT</span>
                  <span>TikTok</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('YOUTUBE')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    platform === 'YOUTUBE'
                      ? 'bg-white dark:bg-[#1A1E2B] text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-ink-secondary-light dark:text-ink-secondary-dark'
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  <span>YouTube</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('FACEBOOK')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    platform === 'FACEBOOK'
                      ? 'bg-white dark:bg-[#1A1E2B] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-ink-secondary-light dark:text-ink-secondary-dark'
                  }`}
                >
                  <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                Username / Akun
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ujangfootstep"
                className="w-full bg-white dark:bg-[#121620] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark font-mono focus:ring-2 focus:ring-brand/40 focus:outline-hidden"
              />
            </div>

            {/* Total Followers */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark mb-1">
                {t.followers} *
              </label>
              <input
                type="number"
                required
                min={1}
                value={followers}
                onChange={(e) => setFollowers(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 12500"
                className="w-full bg-white dark:bg-[#121620] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-ink-primary-light dark:text-ink-primary-dark font-mono font-bold focus:ring-2 focus:ring-brand/40 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Batch Post Screenshot Dropzone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark">
              2. {language === 'id' ? 'Unggah Screenshot Postingan (Opsional / Otomatis OCR)' : 'Upload Post Screenshots (OCR Auto-Fill)'}
            </span>
            <span className="text-[11px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
              {posts.length} {t.posts.toLowerCase()}
            </span>
          </div>

          <input
            type="file"
            ref={postsInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handlePostImagesUpload(e.target.files);
            }}
          />

          <div
            onClick={() => postsInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handlePostImagesUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-black/10 dark:border-white/10 hover:border-brand/40 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-black/[0.01] dark:hover:bg-white/[0.02] space-y-2 group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark">
                {language === 'id'
                  ? 'Tarik & letakkan screenshot postingan di sini, atau klik untuk memilih file'
                  : 'Drag & drop post screenshots here, or click to browse'}
              </p>
              <p className="text-[11px] text-ink-tertiary-light dark:text-ink-tertiary-dark mt-0.5">
                {language === 'id'
                  ? 'Bisa pilih banyak gambar sekaligus. OCR client-side akan membaca Likes, Komen, dan Views secara instan.'
                  : 'Select multiple images. OCR will automatically extract Likes, Comments, Views & Shares.'}
              </p>
            </div>
          </div>

          {/* OCR Feedback Status */}
          {ocrStatus && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-brand/10 text-brand text-xs font-medium border border-brand/20 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{ocrStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Step 3: Interactive Multi-Post Data Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark">
              3. {language === 'id' ? 'Tabel Data Individual Postingan (Dapat Diedit)' : 'Individual Post Data Table (Editable)'}
            </span>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Tambah Baris Post' : 'Add Post Row'}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle-light/80 dark:bg-surface-subtle-dark/80 border-b border-black/5 dark:border-white/5 font-mono uppercase text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-16">Preview</th>
                  <th className="py-2.5 px-3 min-w-[100px]">{t.likes} *</th>
                  <th className="py-2.5 px-3 min-w-[100px]">{t.comments} *</th>
                  <th className="py-2.5 px-3 min-w-[110px]">
                    {t.views} {platform === 'TIKTOK' ? '*' : ''}
                  </th>
                  <th className="py-2.5 px-3 min-w-[100px]">Shares</th>
                  <th className="py-2.5 px-3 min-w-[180px]">{t.caption}</th>
                  <th className="py-2.5 px-3 w-12 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
                {posts.map((post, idx) => (
                  <tr key={post.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-center font-bold text-brand">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      {post.imagePreview ? (
                        <img
                          src={post.imagePreview}
                          alt={`Post ${idx + 1}`}
                          className="w-10 h-10 rounded-lg object-cover border border-black/10 dark:border-white/10"
                        />
                      ) : post.postUrl ? (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-brand/10 hover:bg-brand/20 border border-brand/20 flex flex-col items-center justify-center text-brand transition-colors group"
                          title="Buka postingan asli"
                        >
                          <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-mono font-bold mt-0.5">Live</span>
                        </a>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/5 flex items-center justify-center text-ink-tertiary-light">
                          <ImageIcon className="w-4 h-4 opacity-50" />
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        required
                        value={post.likes}
                        onChange={(e) =>
                          handleUpdateRow(post.id, 'likes', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-full bg-white dark:bg-[#121620] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        required
                        value={post.comments}
                        onChange={(e) =>
                          handleUpdateRow(post.id, 'comments', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-full bg-white dark:bg-[#121620] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        value={post.views}
                        onChange={(e) =>
                          handleUpdateRow(post.id, 'views', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-full bg-white dark:bg-[#121620] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        value={post.shares}
                        onChange={(e) =>
                          handleUpdateRow(post.id, 'shares', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-full bg-white dark:bg-[#121620] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={post.caption}
                        onChange={(e) => handleUpdateRow(post.id, 'caption', e.target.value)}
                        placeholder="Keterangan singkat..."
                        className="w-full bg-white dark:bg-[#121620] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-sans truncate"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(post.id)}
                        disabled={posts.length <= 1}
                        className="p-1 rounded-md text-ink-tertiary-light hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === 'id' ? 'Menghitung Statistik Mendalam...' : 'Computing Deep Analytics...'}</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>
                  {language === 'id'
                    ? 'Kalkulasi Analisis Lengkap (Median, Min/Max, Distribusi, ER)'
                    : 'Calculate Full Analytics (Median, Min/Max, Distribution, ER)'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
