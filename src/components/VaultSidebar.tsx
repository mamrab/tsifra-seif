import React from 'react';
import {
  Shield,
  Key,
  FileText,
  CreditCard,
  Star,
  Plus,
  Sparkles,
  Folder,
  Layers,
} from 'lucide-react';
import { VaultItem } from '../types/vault';

interface VaultSidebarProps {
  items: VaultItem[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenNewItem: () => void;
  onOpenGenerator: () => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  items,
  selectedFilter,
  onSelectFilter,
  onOpenNewItem,
  onOpenGenerator,
}) => {
  const totalCount = items.length;
  const favoritesCount = items.filter((it) => it.favorite).length;
  const passwordsCount = items.filter((it) => it.itemType === 'password').length;
  const notesCount = items.filter((it) => it.itemType === 'secureNote').length;
  const cardsCount = items.filter((it) => it.itemType === 'paymentCard').length;

  const categories = Array.from(new Set(items.map((it) => it.category).filter(Boolean)));

  const mainFilters = [
    { id: 'all', label: 'Все записи', icon: Layers, count: totalCount },
    { id: 'favorites', label: 'Избранное', icon: Star, count: favoritesCount },
    { id: 'type_password', label: 'Пароли', icon: Key, count: passwordsCount },
    { id: 'type_note', label: 'Заметки', icon: FileText, count: notesCount },
    { id: 'type_card', label: 'Карты', icon: CreditCard, count: cardsCount },
  ];

  return (
    <aside className="w-64 bg-slate-950/70 border-r border-slate-800/80 flex flex-col h-full select-none">
      {/* Brand header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            Цифра-Сейф
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Зашифровано</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenNewItem}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Категории
        </div>

        {mainFilters.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => onSelectFilter(id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedFilter === id
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className={`w-4 h-4 ${selectedFilter === id ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{label}</span>
            </div>
            <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
              selectedFilter === id ? 'bg-slate-700 text-emerald-300' : 'text-slate-500'
            }`}>
              {count}
            </span>
          </button>
        ))}

        {/* Custom Folder Categories */}
        {categories.length > 0 && (
          <>
            <div className="pt-4 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className={`w-4 h-4 flex-shrink-0 ${selectedFilter === filterId ? 'text-teal-400' : 'text-slate-500'}`} />
                    <span className="truncate">{cat}</span>
                  </div>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                    selectedFilter === filterId ? 'bg-slate-700 text-teal-300' : 'text-slate-500'
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
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          onClick={onOpenGenerator}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Генератор паролей
        </button>

        <div className="pt-1 text-center text-[10px] text-slate-500 font-mono">
          Argon2id • AES-256-GCM
        </div>
      </div>
    </aside>
  );
};
