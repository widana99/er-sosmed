import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { DashboardView } from './views/DashboardView.js';
import { LeaderboardView } from './views/LeaderboardView.js';
import { AnalyzeView } from './views/AnalyzeView.js';
import { AccountsListView } from './views/AccountsListView.js';
import { AccountDetailView } from './views/AccountDetailView.js';
import { ComparisonView } from './views/ComparisonView.js';
import { HistoryView } from './views/HistoryView.js';
import { CsvImportView } from './views/CsvImportView.js';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.js';
import { LayoutDashboard, Trophy, Search, History } from 'lucide-react';

export function AppContent() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'>('ALL');
  const [searchParams, setSearchParams] = useState<{ platform: string; username: string } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleGlobalSearch = (platform: string, username: string) => {
    setSearchParams({ platform, username });
    setSelectedAccountId(null);
    setActiveTab('analyze');
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedAccountId(null);
  };

  const mobileNavTabs = [
    { id: 'dashboard' as const, label: t.dashboard, icon: LayoutDashboard },
    { id: 'analyze' as const, label: t.analyze, icon: Search },
    { id: 'leaderboard' as const, label: t.leaderboard, icon: Trophy },
    { id: 'history' as const, label: t.history, icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-canvas-light dark:bg-canvas-dark text-ink-primary-light dark:text-ink-primary-dark transition-colors duration-200">
      {/* Sidebar (Desktop static rail + Mobile slide-out drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedAccountId(null);
          setActiveTab(tab);
        }}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Command Bar */}
        <Header
          onSearch={handleGlobalSearch}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Dynamic Main View Canvas */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="max-w-7xl mx-auto pb-24 lg:pb-16">
            {selectedAccountId ? (
              <AccountDetailView
                accountId={selectedAccountId}
                onBack={handleBackFromDetail}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    onSelectAccount={handleSelectAccount}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {activeTab === 'leaderboard' && (
                  <LeaderboardView onSelectAccount={handleSelectAccount} />
                )}
                {activeTab === 'analyze' && (
                  <AnalyzeView
                    initialSearch={searchParams}
                    onSelectAccount={handleSelectAccount}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {activeTab === 'accounts' && (
                  <AccountsListView
                    onSelectAccount={handleSelectAccount}
                    selectedPlatform={selectedPlatform}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {activeTab === 'comparison' && (
                  <ComparisonView onNavigateTab={setActiveTab} />
                )}
                {activeTab === 'history' && (
                  <HistoryView onSelectAccount={handleSelectAccount} />
                )}
                {activeTab === 'csv' && (
                  <CsvImportView onSelectAccount={handleSelectAccount} />
                )}
              </>
            )}
          </div>
        </main>

        {/* Mobile Quick Bottom Navigation Dock (Visible on < lg screens) */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 header-glass border-t border-black/8 dark:border-white/8 px-3 py-1.5 flex justify-around items-center"
          aria-label="Navigasi Bawah Ponsel"
        >
          {mobileNavTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !selectedAccountId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedAccountId(null);
                  setActiveTab(item.id);
                }}
                className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand font-semibold'
                    : 'text-ink-tertiary-light dark:text-ink-tertiary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand' : 'opacity-70'}`} />
                <span className="text-[10px] mt-0.5 tracking-tight leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
