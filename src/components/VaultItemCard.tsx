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

  const getIcon = () => {
    switch (item.itemType) {
      case 'cryptoWallet':
        return <Coins className="w-5 h-5 text-white" />;
      case 'password':
        return <Key className="w-5 h-5 text-white" />;
      case 'secureNote':
        return <FileText className="w-5 h-5 text-zinc-300" />;
      case 'paymentCard':
        return <CreditCard className="w-5 h-5 text-zinc-300" />;
      case 'serverKey':
        return <Server className="w-5 h-5 text-zinc-300" />;
      default:
        return <Lock className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none animate-scale-in"
    >
      {/* Top Row: Icon, Title, Favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white group-hover:text-zinc-100 transition-colors truncate">
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                {item.category}
              </span>
              {item.itemType === 'cryptoWallet' && item.cryptoData && (
                <>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 truncate max-w-[120px]">
                    {item.cryptoData.network.split(' ')[0]}
                  </span>
                  {item.cryptoData.privateKey && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
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
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            item.favorite
              ? 'text-white'
              : 'text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100'
          }`}
          title={item.favorite ? 'В избранном' : 'Добавить в избранное'}
        >
          <Star className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Middle Snippet based on item type */}
      <div className="mt-3 text-xs text-zinc-400 min-h-[22px]">
        {item.itemType === 'cryptoWallet' ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="truncate">{item.cryptoData?.address ? `${item.cryptoData.address.slice(0, 10)}...${item.cryptoData.address.slice(-6)}` : 'Адрес не указан'}</span>
              <span className="text-zinc-500 font-mono text-[10px]">{item.cryptoData?.wordCount || 12} слов</span>
            </div>
          </div>
        ) : item.itemType === 'secureNote' ? (
          <p className="line-clamp-2 text-zinc-400 text-xs italic font-mono">
            {item.notes || 'Пустая заметка'}
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="truncate font-mono text-zinc-300 text-xs">
              {item.username || (item.url ? item.url.replace(/^https?:\/\//, '') : '—')}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Quick Action Buttons */}
      <div className="mt-3 pt-3 border-t border-zinc-850 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
          <span>{item.itemType === 'cryptoWallet' ? (item.cryptoData?.privateKey ? 'Key + Seed' : 'Seed-фраза') : '••••••••'}</span>
        </div>

        <div className="flex items-center gap-1">
          {item.itemType === 'cryptoWallet' && item.cryptoData ? (
            <>
              {item.cryptoData.address && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item.cryptoData!.address!, 'address')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors text-[10px] font-medium"
                  title="Скопировать публичный адрес"
                >
                  {copiedType === 'address' ? <Check className="w-3.5 h-3.5 text-white" /> : 'Адрес'}
                </button>
              )}

              {item.cryptoData.privateKey && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item.cryptoData!.privateKey!, 'pk')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 transition-colors text-[10px] font-semibold flex items-center gap-1"
                  title="Скопировать приватный ключ"
                >
                  {copiedType === 'pk' ? <Check className="w-3.5 h-3.5 text-white" /> : 'PK'}
                </button>
              )}

              {item.cryptoData.words && item.cryptoData.words.filter(Boolean).length > 0 && (
                <button
                  type="button"
                  onClick={(e) =>
                    handleCopy(e, item.cryptoData!.words.filter(Boolean).join(' '), 'seed')
                  }
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center gap-1 text-[10px] font-medium"
                  title="Скопировать всю сид-фразу"
                >
                  {copiedType === 'seed' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
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
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors text-[10px] font-medium"
                  title="Скопировать логин"
                >
                  {copiedType === 'username' ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    'Логин'
                  )}
                </button>
              )}

              {item.password && (
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, item.password!, 'password')}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                  title="Скопировать пароль"
                >
                  {copiedType === 'password' ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Пароль</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
