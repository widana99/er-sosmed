import React, { useState } from 'react';
import { Search, Sun, Moon, Instagram, Menu, Youtube, Facebook } from 'lucide-react';
import { useLanguage, Language } from '../i18n/LanguageContext.js';

interface HeaderProps {
  onSearch: (platform: string, username: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  darkMode,
  setDarkMode,
  onToggleMobileMenu,
}) => {
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK'>('INSTAGRAM');
  const [username, setUsername] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onSearch(platform, username.trim());
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ms', label: 'Melayu', flag: '🇲🇾' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3 header-glass transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Mobile Hamburger Toggle + Brand icon for mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark text-ink-primary-light dark:text-ink-primary-dark border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
            ER
          </div>
        </div>

        {/* Center: Search and Platform Filter */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2 flex-1 max-w-2xl min-w-0">
          <div className="flex bg-surface-subtle-light dark:bg-surface-subtle-dark p-0.5 sm:p-1 rounded-xl border border-black/5 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setPlatform('INSTAGRAM')}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 ${
                platform === 'INSTAGRAM'
                  ? 'bg-white dark:bg-[#1A2234] text-pink-600 dark:text-pink-400 shadow-xs'
                  : 'text-ink-secondary-light dark:text-ink-secondary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark'
              }`}
              title="Instagram"
            >
              <Instagram className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('TIKTOK')}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 ${
                platform === 'TIKTOK'
                  ? 'bg-white dark:bg-[#1A2234] text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-ink-secondary-light dark:text-ink-secondary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark'
              }`}
              title="TikTok"
            >
              <span className="font-bold text-[11px] leading-none">TT</span>
              <span className="hidden sm:inline">TikTok</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('YOUTUBE')}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 ${
                platform === 'YOUTUBE'
                  ? 'bg-white dark:bg-[#1A2234] text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-ink-secondary-light dark:text-ink-secondary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark'
              }`}
              title="YouTube"
            >
              <Youtube className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span className="hidden sm:inline">YouTube</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('FACEBOOK')}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 ${
                platform === 'FACEBOOK'
                  ? 'bg-white dark:bg-[#1A2234] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-ink-secondary-light dark:text-ink-secondary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark'
              }`}
              title="Facebook"
            >
              <Facebook className="w-3.5 h-3.5 shrink-0 text-[#1877F2]" />
              <span className="hidden sm:inline">Facebook</span>
            </button>
          </div>

          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-ink-tertiary-light dark:text-ink-tertiary-dark absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full craft-input pl-9 pr-18 sm:pr-24 py-1.5 sm:py-2 text-xs sm:text-sm placeholder:text-ink-tertiary-light dark:placeholder:text-ink-tertiary-dark shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 sm:px-3 py-1 bg-brand hover:bg-brand-hover text-white text-[11px] sm:text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {t.analyzeBtn}
            </button>
          </div>
        </form>

        {/* Right Tools: Language Switcher, Realtime Status & Theme Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Functional Multi-Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark border border-black/5 dark:border-white/10 text-xs font-medium text-ink-primary-light dark:text-ink-primary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-xs"
              title={t.languageSelect}
            >
              <span className="text-sm leading-none">{currentLang.flag}</span>
              <span className="font-mono uppercase font-bold text-[10px] sm:text-[11px]">{currentLang.code}</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 z-50 w-36 rounded-xl craft-card p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-tertiary-light dark:text-ink-tertiary-dark">
                    {t.languageSelect}
                  </div>
                  {languages.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLanguage(item.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        language === item.code
                          ? 'bg-brand/10 dark:bg-brand/20 text-brand font-semibold'
                          : 'text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink-primary-light dark:hover:text-ink-primary-dark'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.flag}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold opacity-60">
                        {item.code}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.liveEngine}</span>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-surface-subtle-light dark:bg-surface-subtle-dark text-ink-secondary-light dark:text-ink-secondary-dark hover:text-ink-primary-light dark:hover:text-ink-primary-dark border border-black/5 dark:border-white/10 transition-all shadow-xs"
            title={t.themeToggle}
            aria-label={t.themeToggle}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand" />}
          </button>
        </div>
      </div>
    </header>
  );
};
export default Header;
