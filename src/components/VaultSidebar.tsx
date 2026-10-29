import React from 'react';
import {
  Key,
  FileText,
  CreditCard,
  Star,
  Plus,
  Sparkles,
  Folder,
  Layers,
  Coins,
  Database,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { VaultItem } from '../types/vault';
import { TsifraLogo } from './TsifraLogo';

interface VaultSidebarProps {
  items: VaultItem[];
  currentDatabase: string;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenNewItem: () => void;
  onOpenGenerator: () => void;
  onOpenDatabaseSwitcher: () => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  items,
  currentDatabase,
  selectedFilter,
  onSelectFilter,
  onOpenNewItem,
  onOpenGenerator,
  onOpenDatabaseSwitcher,
}) => {
  const totalCount = items.length;
  const favoritesCount = items.filter((it) => it.favorite).length;
  const cryptoCount = items.filter((it) => it.itemType === 'cryptoWallet').length;
  const passwordsCount = items.filter((it) => it.itemType === 'password').length;
  const notesCount = items.filter((it) => it.itemType === 'secureNote').length;
  const cardsCount = items.filter((it) => it.itemType === 'paymentCard').length;

  const categories = Array.from(new Set(items.map((it) => it.category).filter(Boolean)));

  const mainFilters = [
    { id: 'all', label: 'Все записи', icon: Layers, count: totalCount, color: 'text-cyan-400' },
    { id: 'favorites', label: 'Избранное', icon: Star, count: favoritesCount, color: 'text-amber-400' },
    { id: 'type_crypto', label: 'Криптокошельки', icon: Coins, count: cryptoCount, color: 'text-sky-400' },
    { id: 'type_password', label: 'Пароли', icon: Key, count: passwordsCount, color: 'text-emerald-400' },
    { id: 'type_note', label: 'Заметки', icon: FileText, count: notesCount, color: 'text-violet-400' },
    { id: 'type_card', label: 'Карты', icon: CreditCard, count: cardsCount, color: 'text-rose-400' },
  ];

  return (
    <aside className="w-64 bg-[#07090e]/75 backdrop-blur-3xl border-r border-white/[0.08] flex flex-col h-full select-none relative z-20">
      {/* App Branding & Mini Logo */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TsifraLogo size={32} withGlow={false} />
          <div>
            <div className="text-xs font-bold text-white tracking-tight leading-tight">Цифра-Сейф</div>
            <div className="text-[10px] font-mono text-cyan-400/80">v2.5 • iOS 27</div>
          </div>
        </div>
      </div>

      {/* Database Switcher Header Card */}
      <div className="p-3 border-b border-white/[0.06]">
        <button
          onClick={onOpenDatabaseSwitcher}
          className="w-full p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer shadow-inner"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-white/40 uppercase tracking-wider font-mono">Хранилище</div>
              <div className="text-xs font-semibold text-white truncate">{currentDatabase || 'Основная'}</div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        </button>
      </div>

      {/* Primary Action Button (Apple Gradient Pill) */}
      <div className="p-3">
        <button
          onClick={onOpenNewItem}
          className="w-full py-2.5 px-3 rounded-2xl apple-btn-primary text-xs active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Новая запись
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35 font-mono">
          Разделы
        </div>

        {mainFilters.map(({ id, label, icon: Icon, count, color }) => {
          const isActive = selectedFilter === id;
          return (
            <button
              key={id}
              onClick={() => onSelectFilter(id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                isActive
                  ? 'bg-white/[0.12] text-white font-semibold border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : color}`} />
                <span className="truncate">{label}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-white/[0.04] text-white/40 border border-white/5'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Custom Folder Categories */}
        {categories.length > 0 && (
          <>
            <div className="pt-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35 font-mono">
              Папки
            </div>
            {categories.map((cat) => {
              const catCount = items.filter((it) => it.category === cat).length;
              const filterId = `cat_${cat}`;
              const isActive = selectedFilter === filterId;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectFilter(filterId)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.12] text-white font-semibold border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-white/40'
                      }`}
                    />
                    <span className="truncate">{cat}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-sm'
                        : 'bg-white/[0.04] text-white/40 border border-white/5'
                    }`}
                  >
                    {catCount}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Generator Launcher & Hardware Security Footer */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        <button
          onClick={onOpenGenerator}
          className="w-full py-2 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Генератор паролей
        </button>

        <div className="p-2 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/10 flex items-center justify-between text-[10px] font-mono text-cyan-300/80">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>AES-256-GCM</span>
          </div>
          <span className="text-white/40">Offline</span>
        </div>
      </div>
    </aside>
  );
};
