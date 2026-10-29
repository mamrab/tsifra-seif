import React from 'react';
import { Search, Lock, Settings, X, Database, Lightbulb } from 'lucide-react';
import { TsifraLogo } from './TsifraLogo';

interface VaultHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLock: () => void;
  onOpenSettings: () => void;
  onOpenDatabaseSwitcher: () => void;
  currentDatabase: string;
  autoLockMinutes: number;
  forgottenCount?: number;
  onOpenForgottenHints?: () => void;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onLock,
  onOpenSettings,
  onOpenDatabaseSwitcher,
  currentDatabase,
  autoLockMinutes,
  forgottenCount = 0,
  onOpenForgottenHints,
}) => {
  return (
    <header className="h-16 px-5 border-b border-white/[0.08] bg-[#090b12]/80 backdrop-blur-2xl flex items-center justify-between gap-4 select-none relative z-20">
      {/* Top subtle specular edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Left Search Bar (iOS Floating Island Style) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="md:hidden flex items-center">
          <TsifraLogo size={28} withGlow={false} />
        </div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по названию, логину, seed-словам, ключам, тегам..."
            className="w-full pl-9 pr-9 py-2 bg-white/[0.05] hover:bg-white/[0.07] focus:bg-white/[0.09] border border-white/10 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/40 transition-all shadow-inner"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30 border border-white/10 px-1.5 py-0.5 rounded-md">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Header Actions (Apple Capsule Controls) */}
      <div className="flex items-center gap-2">
        {/* Forgotten Checklist Button */}
        {onOpenForgottenHints && (
          <button
            onClick={onOpenForgottenHints}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
              forgottenCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20'
                : 'bg-white/[0.05] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.09]'
            }`}
            title="Проверить, что забыли заполнить"
          >
            <Lightbulb
              className={`w-3.5 h-3.5 ${forgottenCount > 0 ? 'text-amber-400 animate-pulse' : 'text-white/60'}`}
            />
            <span className="hidden sm:inline">Что забыли</span>
            {forgottenCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-black font-mono text-[10px] font-bold flex items-center justify-center">
                {forgottenCount}
              </span>
            )}
          </button>
        )}

        {/* Database Switcher Button */}
        <button
          onClick={onOpenDatabaseSwitcher}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs text-white/80 transition-all font-mono active:scale-95 cursor-pointer shadow-sm"
          title="Сменить локальную базу данных"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="max-w-[110px] truncate">{currentDatabase || 'Основная'}</span>
        </button>

        {/* Auto-Lock Indicator Pill */}
        {autoLockMinutes > 0 && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] text-white/60 font-mono"
            title={`Автоблокировка через ${autoLockMinutes} мин бездействия`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
            <span>{autoLockMinutes}м</span>
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
          title="Настройки"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Lock Vault Button */}
        <button
          onClick={onLock}
          className="p-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/25 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
          title="Заблокировать сейф (Ctrl+L)"
        >
          <Lock className="w-4 h-4" />
          <span className="hidden lg:inline text-xs font-semibold">Заблокировать</span>
        </button>
      </div>
    </header>
  );
};
