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
  Coins,
  ShieldCheck,
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
  const [copiedType, setCopiedType] = useState<'username' | 'password' | 'seed' | 'pk' | 'address' | null>(null);

  const handleCopy = async (e: React.MouseEvent, text: string, type: 'username' | 'password' | 'seed' | 'pk' | 'address') => {
    e.stopPropagation();
    await copyToClipboardSecurely(text, 30);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getIconBadge = () => {
    switch (item.itemType) {
      case 'cryptoWallet':
        return {
          icon: <Coins className="w-5 h-5 text-sky-400" />,
          bg: 'bg-sky-500/10 border-sky-500/25 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
        };
      case 'password':
        return {
          icon: <Key className="w-5 h-5 text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
        };
      case 'secureNote':
        return {
          icon: <FileText className="w-5 h-5 text-violet-400" />,
          bg: 'bg-violet-500/10 border-violet-500/25 text-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.2)]',
        };
      case 'paymentCard':
        return {
          icon: <CreditCard className="w-5 h-5 text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.2)]',
        };
      case 'serverKey':
        return {
          icon: <Server className="w-5 h-5 text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]',
        };
      default:
        return {
          icon: <Lock className="w-5 h-5 text-cyan-400" />,
          bg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
        };
    }
  };

  const badge = getIconBadge();

  return (
    <div
      onClick={onClick}
      className="group relative p-4.5 rounded-[26px] liquid-card cursor-pointer flex flex-col justify-between select-none animate-scale-in overflow-hidden"
    >
      {/* Top Specular Sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-cyan-400/50 transition-colors" />

      {/* Top Row: Icon, Title, Favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all duration-300 ${badge.bg}`}
          >
            {badge.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors truncate">
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/[0.05] text-white/60 border border-white/10">
                {item.category}
              </span>
              {item.itemType === 'cryptoWallet' && item.cryptoData && (
                <>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 truncate max-w-[120px]">
                    {item.cryptoData.network.split(' ')[0]}
                  </span>
                  {item.cryptoData.privateKey && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-400 text-black font-bold flex items-center gap-0.5 shadow-sm">
                      <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                      PK
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleFavorite}
          className={`p-2 rounded-xl transition-all flex-shrink-0 active:scale-90 ${
            item.favorite
              ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20'
              : 'text-white/30 hover:text-white/70 hover:bg-white/[0.05] opacity-0 group-hover:opacity-100'
          }`}
          title={item.favorite ? 'В избранном' : 'Добавить в избранное'}
        >
          <Star className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Middle Snippet based on item type */}
      <div className="mt-3.5 text-xs text-white/50 min-h-[24px]">
        {item.itemType === 'cryptoWallet' ? (
          <div className="flex items-center justify-between text-[11px] font-mono text-white/60 bg-white/[0.02] p-2 rounded-xl border border-white/[0.06]">
            <span className="truncate text-white/80">
              {item.cryptoData?.address
                ? `${item.cryptoData.address.slice(0, 10)}...${item.cryptoData.address.slice(-6)}`
                : 'Адрес не указан'}
            </span>
            <span className="text-cyan-400/80 font-mono text-[10px] pl-2 flex-shrink-0">
              {item.cryptoData?.wordCount || 12} слов
            </span>
          </div>
        ) : item.itemType === 'secureNote' ? (
          <p className="line-clamp-2 text-white/50 text-xs italic font-mono bg-white/[0.02] p-2 rounded-xl border border-white/[0.06]">
            {item.notes || 'Пустая защищенная заметка'}
          </p>
        ) : (
          <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-xl border border-white/[0.06]">
            <span className="truncate font-mono text-white/70 text-xs">
              {item.username || (item.url ? item.url.replace(/^https?:\/\//, '') : '—')}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Quick Action Buttons */}
      <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-white/40 font-mono text-[11px]">
          <span>
            {item.itemType === 'cryptoWallet'
              ? item.cryptoData?.privateKey
                ? 'Key + Seed'
                : 'BIP-39 Seed'
              : '••••••••'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {item.itemType === 'cryptoWallet' && item.cryptoData ? (
            <>
              {item.cryptoData.address && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item.cryptoData!.address!, 'address')}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-white/70 hover:text-white border border-white/10 transition-all text-[10px] font-medium active:scale-95 cursor-pointer"
                  title="Скопировать публичный адрес"
                >
                  {copiedType === 'address' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : 'Адрес'}
                </button>
              )}

              {item.cryptoData.privateKey && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item.cryptoData!.privateKey!, 'pk')}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 transition-all text-[10px] font-semibold flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                  title="Скопировать приватный ключ"
                >
                  {copiedType === 'pk' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : 'PK'}
                </button>
              )}

              {item.cryptoData.words && item.cryptoData.words.filter(Boolean).length > 0 && (
                <button
                  type="button"
                  onClick={(e) =>
                    handleCopy(e, item.cryptoData!.words.filter(Boolean).join(' '), 'seed')
                  }
                  className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 transition-all flex items-center gap-1 text-[10px] font-medium active:scale-95 cursor-pointer shadow-sm"
                  title="Скопировать всю сид-фразу"
                >
                  {copiedType === 'seed' ? (
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-white/60" />
                  )}
                  <span>{copiedType === 'seed' ? 'Скопировано!' : 'Сид'}</span>
                </button>
              )}
            </>
          ) : (
            <>
              {item.username && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item.username!, 'username')}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-white/70 hover:text-white border border-white/10 transition-all text-[10px] font-medium active:scale-95 cursor-pointer"
                  title="Скопировать логин"
                >
                  {copiedType === 'username' ? (
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    'Логин'
                  )}
                </button>
              )}

              {item.password && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item.password!, 'password')}
                  className="px-2.5 py-1 rounded-xl bg-white text-black hover:bg-slate-200 font-semibold transition-all flex items-center gap-1 text-[10px] active:scale-95 cursor-pointer shadow-sm"
                  title="Скопировать пароль"
                >
                  {copiedType === 'password' ? (
                    <Check className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-black" />
                  )}
                  <span>{copiedType === 'password' ? 'Скопировано!' : 'Пароль'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
