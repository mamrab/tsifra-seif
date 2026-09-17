import React, { useState } from 'react';
import {
  Key,
  FileText,
  CreditCard,
  Server,
  Star,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { VaultItem } from '../types/vault';
import { copyToClipboardSecurely } from '../utils/clipboard';

interface VaultItemCardProps {
  item: VaultItem;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const VaultItemCard: React.FC<VaultItemCardProps> = ({
  item,
  onClick,
  onToggleFavorite,
}) => {
  const [copiedType, setCopiedType] = useState<'username' | 'password' | null>(null);

  const handleCopy = async (e: React.MouseEvent, text: string, type: 'username' | 'password') => {
    e.stopPropagation();
    await copyToClipboardSecurely(text, 30);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getIcon = () => {
    switch (item.itemType) {
      case 'password':
        return <Key className="w-5 h-5 text-emerald-400" />;
      case 'secureNote':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'paymentCard':
        return <CreditCard className="w-5 h-5 text-cyan-400" />;
      case 'serverKey':
        return <Server className="w-5 h-5 text-purple-400" />;
      default:
        return <Lock className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/90 shadow-lg hover:shadow-emerald-500/5 transition-all cursor-pointer flex flex-col justify-between select-none"
    >
      {/* Top Row: Icon, Title, Favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            {getIcon()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                {item.category}
              </span>
              {item.tags.length > 0 && (
                <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                  #{item.tags[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleFavorite}
          className={`p-1.5 rounded-lg transition-colors ${
            item.favorite
              ? 'text-amber-400'
              : 'text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100'
          }`}
          title={item.favorite ? 'В избранном' : 'Добавить в избранное'}
        >
          <Star className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Middle Snippet: Username / Note */}
      <div className="mt-3 text-xs text-slate-400 min-h-[22px]">
        {item.itemType === 'secureNote' ? (
          <p className="line-clamp-2 text-slate-400 text-xs italic font-mono">
            {item.notes || 'Пустая заметка'}
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="truncate font-mono text-slate-300">
              {item.username || (item.url ? item.url.replace(/^https?:\/\//, '') : '—')}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Quick Action Buttons */}
      {item.itemType !== 'secureNote' && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <span>••••••••</span>
          </div>

          <div className="flex items-center gap-1">
            {item.username && (
              <button
                type="button"
                onClick={(e) => handleCopy(e, item.username!, 'username')}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                title="Скопировать логин"
              >
                {copiedType === 'username' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[10px] font-medium px-0.5">Логин</span>
                )}
              </button>
            )}

            {item.password && (
              <button
                type="button"
                onClick={(e) => handleCopy(e, item.password!, 'password')}
                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1"
                title="Скопировать пароль (автоочистка буфера через 30с)"
              >
                {copiedType === 'password' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-semibold">Пароль</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
