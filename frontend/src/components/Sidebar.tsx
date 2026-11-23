import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Search,
  Users,
  GitCompare,
  History,
  FileSpreadsheet,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';

export type ActiveTab =
  | 'dashboard'
  | 'leaderboard'
  | 'analyze'
  | 'accounts'
  | 'comparison'
  | 'history'
  | 'csv';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPlatform: 'ALL' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  setSelectedPlatform: (p: 'ALL' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedPlatform,
  setSelectedPlatform,
  isOpen = false,
  onClose,
}) => {
  const { t } = useLanguage();

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    { id: 'dashboard' as const, label: t.dashboard, icon: LayoutDashboard },
    { id: 'leaderboard' as const, label: t.leaderboard, icon: Trophy },
    { id: 'analyze' as const, label: t.analyze, icon: Search },
    { id: 'accounts' as const, label: t.accounts, icon: Users },
    { id: 'comparison' as const, label: t.comparison, icon: GitCompare },
    { id: 'history' as const, label: t.history, icon: History },
    { id: 'csv' as const, label: t.csv, icon: FileSpreadsheet },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose?.();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F1523] border-r border-black/8 dark:border-white/8 select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-black/6 dark:border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-display font-extrabold text-base shadow-sm">
            ER
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
              Engagement Rate
            </h2>
            <p className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono uppercase tracking-wider">
              Analytics Suite
            </p>
          </div>
        </div>

        {/* Close Button on Mobile Drawer */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-ink-tertiary-light hover:text-ink-primary-light dark:hover:text-ink-primary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark tracking-wider">
          {t.platformView}
        </div>
        <div className="grid grid-cols-5 gap-1 px-1 mb-4 bg-surface-subtle-light dark:bg-surface-subtle-dark p-1 rounded-xl border border-black/5 dark:border-white/8">
          {(['ALL', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setSelectedPlatform(p);
                if (activeTab !== 'accounts') {
                  setActiveTab('accounts');
                }
                onClose?.();
              }}
              className={`py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedPlatform === p
                  ? 'bg-white dark:bg-[#1A243A] text-ink-primary-light dark:text-ink-primary-dark shadow-xs font-semibold'
                  : 'text-ink-secondary-light dark:text-ink-secondary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark'
              }`}
            >
              {p === 'ALL' ? 'All' : p === 'INSTAGRAM' ? 'IG' : p === 'TIKTOK' ? 'TT' : p === 'YOUTUBE' ? 'YT' : 'FB'}
            </button>
          ))}
        </div>

        <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-ink-tertiary-light dark:text-ink-tertiary-dark tracking-wider">
          {t.mainMenu}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand/10 dark:bg-brand/15 text-brand font-semibold shadow-xs border border-brand/20'
                  : 'text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/4 dark:hover:bg-white/4 hover:text-ink-primary-light dark:hover:text-ink-primary-dark border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'opacity-70'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-black/6 dark:border-white/8">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/8">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="truncate">
            <p className="text-xs font-semibold text-ink-primary-light dark:text-ink-primary-dark">
              {t.chiefAnalyst}
            </p>
            <p className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark font-mono truncate">
              admin@er-analytics.local
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar Rail (Visible on >= lg screens) */}
      <aside className="hidden lg:flex w-64 h-screen shrink-0 sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer (< lg screens) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay with smooth dim */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer slide-in panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
export default Sidebar;
