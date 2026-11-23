import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en' | 'ms';

interface Translations {
  // Navigation
  dashboard: string;
  leaderboard: string;
  analyze: string;
  accounts: string;
  comparison: string;
  history: string;
  csv: string;
  platformView: string;
  mainMenu: string;
  chiefAnalyst: string;

  // Header
  searchPlaceholder: string;
  analyzeBtn: string;
  liveEngine: string;
  themeToggle: string;
  languageSelect: string;

  // Common Actions
  exportPdf: string;
  exportExcel: string;
  recalculate: string;
  addPost: string;
  backToDashboard: string;
  back: string;
  refresh: string;
  save: string;
  cancel: string;
  viewDetail: string;
  openProfile: string;

  // Metrics & Explanations
  erTitle: string;
  erSubtitle: string;
  followerBased: string;
  viewBased: string;
  realtimeData: string;
  simulatedData: string;
  avgLikes: string;
  avgComments: string;
  avgViews: string;
  followers: string;
  following: string;
  totalPosts: string;
  sampleSize: string;
  formulaCalculation: string;
  formulaDesc: string;
  rateCardValuation: string;
  rateCardDesc: string;

  // Tables & Filters
  rank: string;
  account: string;
  city: string;
  platform: string;
  role: string;
  posts: string;
  date: string;
  caption: string;
  likes: string;
  comments: string;
  views: string;
  postEr: string;
  actions: string;
  allCities: string;
  allPlatforms: string;
  sortBy: string;
  highestEr: string;
  mostViews: string;
  mostFollowers: string;
  mostLikes: string;
  searchFilter: string;

  // Dashboard Specific
  overviewTitle: string;
  overviewDesc: string;
  totalAccounts: string;
  totalPostsAnalyzed: string;
  avgPlatformEr: string;
  topPerformingJubir: string;
  recentAnalyses: string;
  quickActions: string;

  // Deep Analytics & Manual OCR Mode
  tabLiveSearch: string;
  tabBatchScraper: string;
  tabManualOcr: string;
  deepAnalysisTitle: string;
  medianEr: string;
  averageEr: string;
  minEr: string;
  maxEr: string;
  spreadRange: string;
  consistencyScore: string;
  commentToLikeRatio: string;
  botRisk: string;
  distributionTiers: string;
  quartiles: string;
  postRankings: string;

  // Comparison & Matrix
  compareTitle: string;
  compareSubtitle: string;
  selectCompareAccounts: string;
  erComparison: string;
  directMatrix: string;
  metricLabel: string;
  minTwoAccountsNeeded: string;

  // CSV Hub
  csvTitle: string;
  csvSubtitle: string;
  loadSampleCsv: string;
  uploadCsvBtn: string;
  validatePreview: string;
  importCalculate: string;

  // Accounts Directory
  trackedAccountsTitle: string;
  trackedAccountsSubtitle: string;
  accountsFound: string;
  noAccountsFound: string;
  postsTracked: string;
  calculatedEr: string;
}

export const translations: Record<Language, Translations> = {
  id: {
    dashboard: 'Ringkasan',
    leaderboard: 'Peringkat Jubir',
    analyze: 'Cari & Analisis',
    accounts: 'Semua Akun',
    comparison: 'Bandingkan Akun',
    history: 'Riwayat Analisis',
    csv: 'Pusat Data CSV',
    platformView: 'Filter Platform',
    mainMenu: 'Menu Utama',
    chiefAnalyst: 'Analis Utama',

    searchPlaceholder: 'Cari akun Instagram atau TikTok e.g. @username...',
    analyzeBtn: 'Analisis Akun',
    liveEngine: 'Data Langsung Aktual',
    themeToggle: 'Ganti Mode Gelap/Terang',
    languageSelect: 'Pilih Bahasa',

    exportPdf: 'Cetak Laporan PDF',
    exportExcel: 'Ekspor File Excel (.xlsx)',
    recalculate: 'Hitung Ulang ER',
    addPost: 'Tambah Post Manual',
    backToDashboard: 'Kembali ke Ringkasan',
    back: 'Kembali',
    refresh: 'Segarkan Data',
    save: 'Simpan',
    cancel: 'Batal',
    viewDetail: 'Lihat Detail Lengkap',
    openProfile: 'Buka Profil Asli',

    erTitle: 'Tingkat Keterlibatan (ER)',
    erSubtitle: 'Persentase penonton yang aktif menyukai, mengomentari, atau membagikan postingan.',
    followerBased: 'Berdasarkan Pengikut',
    viewBased: 'Berdasarkan Tayangan',
    realtimeData: 'Data Langsung Akun',
    simulatedData: 'Data Simulasi',
    avgLikes: 'Rata-rata Suka',
    avgComments: 'Rata-rata Komentar',
    avgViews: 'Rata-rata Tayangan',
    followers: 'Total Pengikut',
    following: 'Mengikuti',
    totalPosts: 'Total Postingan',
    sampleSize: 'Sampel Analisis',
    formulaCalculation: 'Cara Perhitungan ER',
    formulaDesc: 'Total interaksi (Suka + Komentar + Share) dibagi total Pengikut atau Tayangan dikali 100%.',
    rateCardValuation: 'Estimasi Nilai Endorse',
    rateCardDesc: 'Perkiraan biaya wajar promosi per postingan berdasarkan performa interaksi.',

    rank: 'Peringkat',
    account: 'Akun & Profil',
    city: 'Kota / Wilayah',
    platform: 'Platform',
    role: 'Peran / Penugasan',
    posts: 'Jumlah Post',
    date: 'Tanggal',
    caption: 'Keterangan Konten',
    likes: 'Suka',
    comments: 'Komentar',
    views: 'Tayangan',
    postEr: 'ER Post',
    actions: 'Aksi',
    allCities: 'Semua Kota & Daerah',
    allPlatforms: 'Semua Platform',
    sortBy: 'Urutkan Berdasarkan',
    highestEr: 'ER Tertinggi',
    mostViews: 'Tayangan Terbanyak',
    mostFollowers: 'Pengikut Terbanyak',
    mostLikes: 'Suka Terbanyak',
    searchFilter: 'Ketik nama akun atau kota...',

    overviewTitle: 'Ringkasan Kinerja Sosial Media',
    overviewDesc: 'Pemantauan tingkat keterlibatan, perbandingan performa, dan jangkauan audiens secara aktual.',
    totalAccounts: 'Total Akun Terdata',
    totalPostsAnalyzed: 'Postingan Teranalisis',
    avgPlatformEr: 'Rata-rata ER Keseluruhan',
    topPerformingJubir: 'Juru Bicara Terbaik',
    recentAnalyses: 'Analisis Akun Terakhir',
    quickActions: 'Aksi Cepat',

    tabLiveSearch: 'Pencarian Satuan (Live Scraper)',
    tabBatchScraper: 'Multi-Akun / Batch Scraper',
    tabManualOcr: 'Input Manual & OCR Screenshot',
    deepAnalysisTitle: 'Hasil Analisis Statistik Mendalam',
    medianEr: 'Median ER',
    averageEr: 'Rata-rata ER',
    minEr: 'ER Terendah (Floor)',
    maxEr: 'ER Tertinggi (Ceiling)',
    spreadRange: 'Rentang Sebaran (Spread)',
    consistencyScore: 'Skor Konsistensi Konten',
    commentToLikeRatio: 'Rasio Komentar ke Suka',
    botRisk: 'Indikator Risiko Bot / Anomali',
    distributionTiers: 'Distribusi Performa Konten',
    quartiles: 'Kuartil & Jangkauan Antarkuartil (IQR)',
    postRankings: 'Peringkat Kinerja Tiap Postingan',

    // Comparison
    compareTitle: 'Perbandingan Akun & Tolok Ukur Kinerja',
    compareSubtitle: 'Bandingkan tingkat keterlibatan (ER), konsistensi, dan interaksi 2 akun secara langsung berdampingan.',
    selectCompareAccounts: 'Pilih 2 Akun untuk Dibandingkan',
    erComparison: 'Perbandingan Rasio Keterlibatan (ER)',
    directMatrix: 'Matriks Perbandingan Langsung',
    metricLabel: 'Metrik Evaluasi',
    minTwoAccountsNeeded: 'Pilih minimal 2 akun terdata untuk mengaktifkan analisis perbandingan langsung.',

    // CSV Hub
    csvTitle: 'Pusat Analisis Data Massal CSV',
    csvSubtitle: 'Impor ribuan data postingan media sosial secara instan untuk menghitung ER, kuartil, dan distribusi performa.',
    loadSampleCsv: 'Muat Contoh Format CSV',
    uploadCsvBtn: 'Unggah File CSV (.csv)',
    validatePreview: 'Pratinjau & Validasi Data',
    importCalculate: 'Proses & Hitung Analisis',

    // Accounts Directory
    trackedAccountsTitle: 'Direktori Semua Akun Terpantau',
    trackedAccountsSubtitle: 'Daftar seluruh akun Instagram, TikTok, YouTube, dan Facebook yang telah tersimpan dalam sistem.',
    accountsFound: 'Akun Ditemukan',
    noAccountsFound: 'Belum ada akun yang sesuai dengan pencarian atau filter platform.',
    postsTracked: 'Postingan Terpantau',
    calculatedEr: 'Rasio ER Terhitung',
  },
  en: {
    dashboard: 'Overview',
    leaderboard: 'Spokesperson Rankings',
    analyze: 'Search & Analyze',
    accounts: 'All Accounts',
    comparison: 'Compare Accounts',
    history: 'Analysis History',
    csv: 'CSV Data Hub',
    platformView: 'Platform View',
    mainMenu: 'Main Menu',
    chiefAnalyst: 'Chief Analyst',

    searchPlaceholder: 'Search Instagram or TikTok account e.g. @username...',
    analyzeBtn: 'Analyze Account',
    liveEngine: 'Live Realtime Scraper',
    themeToggle: 'Toggle Theme',
    languageSelect: 'Select Language',

    exportPdf: 'Export PDF Report',
    exportExcel: 'Export Excel (.xlsx)',
    recalculate: 'Recalculate ER',
    addPost: 'Add Post',
    backToDashboard: 'Back to Overview',
    back: 'Back',
    refresh: 'Refresh Data',
    save: 'Save',
    cancel: 'Cancel',
    viewDetail: 'View Full Analysis',
    openProfile: 'Open Live Profile',

    erTitle: 'Engagement Rate (ER)',
    erSubtitle: 'Percentage of viewers actively liking, commenting, or sharing posts.',
    followerBased: 'Follower-based',
    viewBased: 'View-based',
    realtimeData: 'Live Account Data',
    simulatedData: 'Simulated Data',
    avgLikes: 'Avg Likes',
    avgComments: 'Avg Comments',
    avgViews: 'Avg Views',
    followers: 'Followers',
    following: 'Following',
    totalPosts: 'Total Posts',
    sampleSize: 'Sample Size',
    formulaCalculation: 'How ER is Calculated',
    formulaDesc: 'Total interactions (Likes + Comments + Shares) divided by total Followers or Views times 100%.',
    rateCardValuation: 'Estimated Rate Card',
    rateCardDesc: 'Fair market endorsement value per post based on actual engagement performance.',

    rank: 'Rank',
    account: 'Account & Profile',
    city: 'City / Region',
    platform: 'Platform',
    role: 'Role / Assignment',
    posts: 'Posts Count',
    date: 'Date',
    caption: 'Post Caption',
    likes: 'Likes',
    comments: 'Comments',
    views: 'Views',
    postEr: 'Post ER',
    actions: 'Actions',
    allCities: 'All Cities & Regions',
    allPlatforms: 'All Platforms',
    sortBy: 'Sort By',
    highestEr: 'Highest ER',
    mostViews: 'Most Views',
    mostFollowers: 'Most Followers',
    mostLikes: 'Most Likes',
    searchFilter: 'Search username or city...',

    overviewTitle: 'Social Media Engagement Overview',
    overviewDesc: 'Live tracking of engagement rates, spokesperson performance, and audience impact.',
    totalAccounts: 'Tracked Accounts',
    totalPostsAnalyzed: 'Posts Analyzed',
    avgPlatformEr: 'Overall Avg ER',
    topPerformingJubir: 'Top Spokespersons',
    recentAnalyses: 'Recent Analyses',
    quickActions: 'Quick Actions',

    tabLiveSearch: 'Single Account (Live Scraper)',
    tabBatchScraper: 'Multi-Account / Batch Scraper',
    tabManualOcr: 'Manual Input & Screenshot OCR',
    deepAnalysisTitle: 'Deep Statistical Analysis Results',
    medianEr: 'Median ER',
    averageEr: 'Average ER',
    minEr: 'Minimum ER (Floor)',
    maxEr: 'Maximum ER (Ceiling)',
    spreadRange: 'Spread Range',
    consistencyScore: 'Content Consistency Score',
    commentToLikeRatio: 'Comment-to-Like Ratio',
    botRisk: 'Bot / Anomaly Risk Indicator',
    distributionTiers: 'Performance Distribution Tiers',
    quartiles: 'Quartiles & IQR',
    postRankings: 'Individual Post Performance Matrix',

    // Comparison
    compareTitle: 'Account Comparison & Benchmarking',
    compareSubtitle: 'Direct side-by-side comparison of Engagement Rate (ER), consistency, and interactions between 2 accounts.',
    selectCompareAccounts: 'Select 2 Accounts to Compare',
    erComparison: 'Engagement Rate (ER) Comparison',
    directMatrix: 'Direct Side-by-Side Matrix',
    metricLabel: 'Evaluation Metric',
    minTwoAccountsNeeded: 'Select at least 2 tracked accounts to activate side-by-side comparative analysis.',

    // CSV Hub
    csvTitle: 'Batch CSV Data Analytics Hub',
    csvSubtitle: 'Import multi-row social media post metrics instantly to calculate ER, quartiles, and distribution tiers.',
    loadSampleCsv: 'Load Sample CSV Template',
    uploadCsvBtn: 'Upload CSV File (.csv)',
    validatePreview: 'Preview & Validate Data',
    importCalculate: 'Process & Calculate Analysis',

    // Accounts Directory
    trackedAccountsTitle: 'Tracked Accounts Directory',
    trackedAccountsSubtitle: 'Comprehensive roster of all tracked Instagram, TikTok, YouTube, and Facebook accounts in the database.',
    accountsFound: 'Accounts Found',
    noAccountsFound: 'No accounts found matching the current search query or platform filter.',
    postsTracked: 'Tracked Posts',
    calculatedEr: 'Calculated ER',
  },
  ms: {
    dashboard: 'Papan Pemuka',
    leaderboard: 'Kedudukan Jurucakap',
    analyze: 'Cari & Analisis',
    accounts: 'Semua Akaun',
    comparison: 'Banding Akaun',
    history: 'Sejarah Analisis',
    csv: 'Pusat Data CSV',
    platformView: 'Pandangan Platform',
    mainMenu: 'Menu Utama',
    chiefAnalyst: 'Penganalisis Utama',

    searchPlaceholder: 'Cari akaun Instagram atau TikTok e.g. @username...',
    analyzeBtn: 'Analisis Akaun',
    liveEngine: 'Data Langsung Masa Nyata',
    themeToggle: 'Tukar Mod Gelap/Cerah',
    languageSelect: 'Pilih Bahasa',

    exportPdf: 'Cetak Laporan PDF',
    exportExcel: 'Eksport Fail Excel (.xlsx)',
    recalculate: 'Kira Semula ER',
    addPost: 'Tambah Catatan',
    backToDashboard: 'Kembali ke Papan Pemuka',
    back: 'Kembali',
    refresh: 'Muat Semula',
    save: 'Simpan',
    cancel: 'Batal',
    viewDetail: 'Lihat Analisis Penuh',
    openProfile: 'Buka Profil Asal',

    erTitle: 'Kadar Penglibatan (ER)',
    erSubtitle: 'Peratusan penonton yang menyukai, memberi komen, atau berkongsi catatan.',
    followerBased: 'Berasaskan Pengikut',
    viewBased: 'Berasaskan Tontonan',
    realtimeData: 'Data Langsung Akaun',
    simulatedData: 'Data Simulasi',
    avgLikes: 'Purata Suka',
    avgComments: 'Purata Komen',
    avgViews: 'Purata Tontonan',
    followers: 'Jumlah Pengikut',
    following: 'Mengikuti',
    totalPosts: 'Jumlah Catatan',
    sampleSize: 'Saiz Sampel',
    formulaCalculation: 'Cara Pengiraan ER',
    formulaDesc: 'Jumlah interaksi (Suka + Komen + Kongsi) dibahagi jumlah Pengikut atau Tontonan darab 100%.',
    rateCardValuation: 'Anggaran Nilai Endorsement',
    rateCardDesc: 'Anggaran kos berpatutan setiap promosi berdasarkan prestasi penglibatan sebenar.',

    rank: 'Kedudukan',
    account: 'Akaun & Profil',
    city: 'Bandar / Wilayah',
    platform: 'Platform',
    role: 'Peranan / Tugas',
    posts: 'Bilangan Catatan',
    date: 'Tarikh',
    caption: 'Kapsyen Catatan',
    likes: 'Suka',
    comments: 'Komen',
    views: 'Tontonan',
    postEr: 'ER Catatan',
    actions: 'Tindakan',
    allCities: 'Semua Bandar & Wilayah',
    allPlatforms: 'Semua Platform',
    sortBy: 'Susun Mengikut',
    highestEr: 'ER Tertinggi',
    mostViews: 'Tontonan Terbanyak',
    mostFollowers: 'Pengikut Terbanyak',
    mostLikes: 'Suka Terbanyak',
    searchFilter: 'Taip nama akaun atau bandar...',

    overviewTitle: 'Ringkasan Prestasi Media Sosial',
    overviewDesc: 'Pemantauan kadar penglibatan, penanda aras jurucakap, dan jangkauan audiens masa nyata.',
    totalAccounts: 'Jumlah Akaun Berdaftar',
    totalPostsAnalyzed: 'Catatan Dianalisis',
    avgPlatformEr: 'Purata ER Keseluruhan',
    topPerformingJubir: 'Jurucakap Terbaik',
    recentAnalyses: 'Analisis Akaun Terkini',
    quickActions: 'Tindakan Pantas',

    tabLiveSearch: 'Carian Tunggal (Pengikis Langsung)',
    tabBatchScraper: 'Pelbagai Akaun / Pengikis Berkelompok',
    tabManualOcr: 'Input Manual & OCR Tangkapan Skrin',
    deepAnalysisTitle: 'Hasil Analisis Statistik Mendalam',
    medianEr: 'Median ER',
    averageEr: 'Purata ER',
    minEr: 'ER Terendah (Lantai)',
    maxEr: 'ER Tertinggi (Siling)',
    spreadRange: 'Julat Sebaran (Spread)',
    consistencyScore: 'Skor Ketekalan Kandungan',
    commentToLikeRatio: 'Nisbah Komen kepada Suka',
    botRisk: 'Penunjuk Risiko Bot / Anomali',
    distributionTiers: 'Taburan Prestasi Kandungan',
    quartiles: 'Kuartil & Julat Antara Kuartil (IQR)',
    postRankings: 'Matriks Prestasi Catatan Individu',

    // Comparison
    compareTitle: 'Perbandingan Akaun & Penanda Aras Prestasi',
    compareSubtitle: 'Bandingkan kadar penglibatan (ER), konsistensi, dan interaksi 2 akaun secara bersebelahan.',
    selectCompareAccounts: 'Pilih 2 Akaun untuk Dibandingkan',
    erComparison: 'Perbandingan Kadar Penglibatan (ER)',
    directMatrix: 'Matriks Perbandingan Bersebelahan',
    metricLabel: 'Metrik Penilaian',
    minTwoAccountsNeeded: 'Pilih sekurang-kurangnya 2 akaun untuk memulakan analisis perbandingan bersebelahan.',

    // CSV Hub
    csvTitle: 'Pusat Analisis Data Pukal CSV',
    csvSubtitle: 'Import data metrik catatan media sosial untuk mengira ER, kuartil, dan taburan prestasi serta-merta.',
    loadSampleCsv: 'Muat Templat Contoh CSV',
    uploadCsvBtn: 'Muat Naik Fail CSV (.csv)',
    validatePreview: 'Pratonton & Sahkan Data',
    importCalculate: 'Proses & Kira Analisis',

    // Accounts Directory
    trackedAccountsTitle: 'Direktori Semua Akaun Terpantau',
    trackedAccountsSubtitle: 'Senarai penuh akaun Instagram, TikTok, YouTube, dan Facebook yang tersimpan dalam pangkalan data.',
    accountsFound: 'Akaun Dijumpai',
    noAccountsFound: 'Tiada akaun ditemui yang sepadan dengan carian atau penapis platform.',
    postsTracked: 'Catatan Terpantau',
    calculatedEr: 'Kadar ER Terkira',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  t: translations.id,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('er_app_language');
    if (saved === 'en' || saved === 'id' || saved === 'ms') {
      return saved;
    }
    return 'id'; // Default Bahasa Indonesia per Indonesian requirements
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('er_app_language', lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
