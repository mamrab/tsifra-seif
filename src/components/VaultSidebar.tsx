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
} from 'lucide-react';
import { VaultItem } from '../types/vault';

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
    { id: 'all', label: 'Все записи', icon: Layers, count: totalCount },
    { id: 'favorites', label: 'Избранное', icon: Star, count: favoritesCount },
    { id: 'type_crypto', label: 'Криптокошельки', icon: Coins, count: cryptoCount },
    { id: 'type_password', label: 'Пароли', icon: Key, count: passwordsCount },
    { id: 'type_note', label: 'Заметки', icon: FileText, count: notesCount },
    { id: 'type_card', label: 'Карты', icon: CreditCard, count: cardsCount },
  ];

  return (
    <aside className="w-64 bg-black border-r border-zinc-850 flex flex-col h-full select-none">
      {/* Database switcher header */}
      <div className="p-3.5 border-b border-zinc-800">
        <button
          onClick={onOpenDatabaseSwitcher}
          className="w-full p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between text-left transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-black border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">База данных</div>
              <div className="text-xs font-semibold text-white truncate">{currentDatabase || 'Основная'}</div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenNewItem}
          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">
          Разделы
        </div>

        {mainFilters.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => onSelectFilter(id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedFilter === id
                ? 'bg-zinc-900 text-white font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className={`w-4 h-4 ${selectedFilter === id ? 'text-white' : 'text-zinc-500'}`} />
              <span>{label}</span>
            </div>
            <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
              selectedFilter === id ? 'bg-black text-white border border-zinc-700' : 'text-zinc-500'
            }`}>
              {count}
            </span>
          </button>
        ))}

        {/* Custom Folder Categories */}
        {categories.length > 0 && (
          <>
            <div className="pt-4 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">
              Папки
            </div>
            {categories.map((cat) => {
              const catCount = items.filter((it) => it.category === cat).length;
              const filterId = `cat_${cat}`;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectFilter(filterId)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedFilter === filterId
                      ? 'bg-zinc-900 text-white font-semibold border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className={`w-4 h-4 flex-shrink-0 ${selectedFilter === filterId ? 'text-white' : 'text-zinc-500'}`} />
                    <span className="truncate">{cat}</span>
                  </div>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                    selectedFilter === filterId ? 'bg-black text-white border border-zinc-700' : 'text-zinc-500'
                  }`}>
                    {catCount}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Generator launcher & footer */}
      <div className="p-3 border-t border-zinc-800 space-y-2">
        <button
          onClick={onOpenGenerator}
          className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          Генератор паролей
        </button>

        <div className="pt-1 text-center text-[10px] text-zinc-500 font-mono">
          AES-256-GCM • Argon2id
        </div>
      </div>
    </aside>
  );
};
