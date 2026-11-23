import React, { useEffect, useState } from 'react';
import { api, SocialAccount } from '../services/api.js';
import { Users, Search, ArrowRight, PlusCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.js';

interface AccountsListViewProps {
  onSelectAccount: (accountId: string) => void;
  selectedPlatform: 'ALL' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK';
  onNavigateTab?: (tab: any) => void;
}

export const AccountsListView: React.FC<AccountsListViewProps> = ({
  onSelectAccount,
  selectedPlatform,
  onNavigateTab,
}) => {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAccounts();
  }, [selectedPlatform]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.listAccounts(selectedPlatform === 'ALL' ? undefined : selectedPlatform);
      setAccounts(data);
    } catch (err) {
      console.error('Failed to list accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = accounts.filter(
    (acc) =>
      acc.username.toLowerCase().includes(search.toLowerCase()) ||
      (acc.displayName && acc.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-ink-primary-light dark:text-ink-primary-dark">
          {t.trackedAccountsTitle}
        </h1>
        <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark mt-0.5">
          {t.trackedAccountsSubtitle}
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="card-surface p-4 bg-white dark:bg-[#12141A] flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-tertiary-light dark:text-ink-tertiary-dark absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchFilter}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-subtle-light/60 dark:bg-surface-subtle-dark/60 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-ink-primary-light dark:text-ink-primary-dark focus:ring-2 focus:ring-brand"
          />
        </div>
        <span className="text-xs font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark">
          {filtered.length} {t.accountsFound}
        </span>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-black/5 dark:bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-12 text-center bg-white dark:bg-[#12141A] rounded-2xl border border-black/8 dark:border-white/8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-ink-primary-light dark:text-ink-primary-dark">
              {t.noAccountsFound}
            </h3>
            <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark leading-relaxed">
              Gunakan bilah pencarian satuan atau pengikis multi-akun untuk mulai memantau metrik akun.
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('analyze')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.tabLiveSearch}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((acc) => {
            const followers = acc.snapshots?.[0]?.followers || 0;
            const latestAnalysis = acc.analyses?.[0];

            return (
              <div
                key={acc.id}
                onClick={() => onSelectAccount(acc.id)}
                className="card-surface p-5 bg-white dark:bg-[#12141A] hover:border-brand/40 cursor-pointer transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-brand/10 border border-black/10 dark:border-white/10 shrink-0 flex items-center justify-center font-bold text-brand">
                      {acc.avatarUrl ? (
                        <img
                          src={acc.avatarUrl}
                          alt={acc.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        acc.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-ink-primary-light dark:text-ink-primary-dark truncate max-w-[140px]">
                        {acc.displayName || `@${acc.username}`}
                      </h3>
                      <p className="text-xs font-mono text-ink-secondary-light dark:text-ink-secondary-dark">
                        @{acc.username}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      acc.platform === 'INSTAGRAM'
                        ? 'bg-pink-500/10 text-pink-600'
                        : acc.platform === 'YOUTUBE'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : acc.platform === 'FACEBOOK'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-cyan-500/10 text-cyan-600'
                    }`}
                  >
                    {acc.platform}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-black/5 dark:border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                      {t.followers}
                    </span>
                    <span className="font-bold">{followers.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                      {t.postsTracked}
                    </span>
                    <span className="font-bold">{acc._count?.posts || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-mono text-ink-tertiary-light dark:text-ink-tertiary-dark block">
                      {t.calculatedEr}
                    </span>
                    <span className="text-base font-bold font-mono text-brand">
                      {latestAnalysis ? `${latestAnalysis.engagementRate.toFixed(2)}%` : 'Pending'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle-light dark:bg-surface-subtle-dark text-ink-secondary-light dark:text-ink-secondary-dark">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
