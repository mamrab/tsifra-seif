import React from 'react';
import { Search, Lock, Settings, X, Database, Lightbulb } from 'lucide-react';

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
    <header className="h-16 border-b border-zinc-800 bg-black/60 backdrop-blur-md px-6 flex items-center justify-between gap-4 select-none">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по названию, логину, seed-словам, ключам, тегам..."
          className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Forgotten Checklist Button */}
        {onOpenForgottenHints && (
          <button
            onClick={onOpenForgottenHints}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              forgottenCount > 0
                ? 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-850'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Проверить, что забыли заполнить"
          >
            <Lightbulb className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Что забыли</span>
            {forgottenCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-black font-mono text-[10px] font-bold flex items-center justify-center">
                {forgottenCount}
              </span>
            )}
          </button>
        )}

        {/* Database Switcher Button */}
        <button
          onClick={onOpenDatabaseSwitcher}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors font-mono"
          title="Сменить локальную базу данных"
        >
          <Database className="w-3.5 h-3.5 text-zinc-400" />
          <span className="max-w-[110px] truncate">{currentDatabase || 'Основная'}</span>
        </button>

        {autoLockMinutes > 0 && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono"
            title={`Автоблокировка через ${autoLockMinutes} мин бездействия`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{autoLockMinutes}м</span>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
          title="Настройки"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onLock}
          className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors flex items-center gap-1.5 active:scale-95"
          title="Заблокировать сейф немедленно"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Блокировка</span>
        </button>
      </div>
    </header>
  );
};
