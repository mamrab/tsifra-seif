import { Search, Lock, Settings, X } from 'lucide-react';

interface VaultHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLock: () => void;
  onOpenSettings: () => void;
  autoLockMinutes: number;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onLock,
  onOpenSettings,
  autoLockMinutes,
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between gap-4 select-none">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по названию, логину, тегам..."
          className="w-full pl-9 pr-9 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5">
        {autoLockMinutes > 0 && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono"
            title={`Автоблокировка через ${autoLockMinutes} мин бездействия`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Автолок: {autoLockMinutes}м</span>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 transition-colors"
          title="Настройки"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onLock}
          className="py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors flex items-center gap-1.5 active:scale-95"
          title="Заблокировать сейф немедленно"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Заблокировать</span>
        </button>
      </div>
    </header>
  );
};
