import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { CryptoWalletData, VaultItemType } from '../types/vault';

interface SmartHintsBarProps {
  title: string;
  itemType: VaultItemType;
  username: string;
  password: string;
  url: string;
  notes: string;
  tagsInput?: string;
  tags?: string[];
  cryptoData?: CryptoWalletData;
}

interface HintItem {
  id: string;
  type: 'warning' | 'tip' | 'info';
  text: string;
}

export const SmartHintsBar: React.FC<SmartHintsBarProps> = ({
  title,
  itemType,
  username,
  password,
  url,
  notes,
  tagsInput = '',
  tags,
  cryptoData,
}) => {
  const effectiveTags = tags ? tags.join(', ') : tagsInput;

  const { hints, progressScore } = useMemo(() => {
    const list: HintItem[] = [];
    let score = 0;

    // 1. Title check
    if (!title.trim()) {
      list.push({
        id: 'missing-title',
        type: 'warning',
        text: 'Забыли указать название записи (например: Google, GitHub, MetaMask, Binance).',
      });
    } else {
      score += 25;
    }

    if (itemType === 'cryptoWallet') {
      const words = cryptoData?.words || [];
      const filledWordsCount = words.filter((w) => w.trim().length > 0).length;
      const targetCount = cryptoData?.wordCount || 12;
      const hasPrivateKey = Boolean(cryptoData?.privateKey?.trim());

      if (filledWordsCount === 0 && !hasPrivateKey) {
        list.push({
          id: 'crypto-no-keys',
          type: 'warning',
          text: `Забыли ввести секретные данные кошелька! Укажите ${targetCount} Seed-слов или вставьте Private Key.`,
        });
      } else if (filledWordsCount > 0 && filledWordsCount < targetCount) {
        list.push({
          id: 'crypto-partial-words',
          type: 'warning',
          text: `Заполнено только ${filledWordsCount} из ${targetCount} Seed-слов. Проверьте пропущенные номера!`,
        });
        score += Math.round((filledWordsCount / targetCount) * 40);
      } else if (filledWordsCount === targetCount) {
        score += 45;
      }

      if (hasPrivateKey) {
        score += 25;
      } else if (filledWordsCount === targetCount) {
        list.push({
          id: 'crypto-tip-pk',
          type: 'tip',
          text: 'Совет: вы также можете вставить экспортированный Private Key для быстрого импорта.',
        });
      }

      if (!cryptoData?.network) {
        list.push({
          id: 'crypto-missing-network',
          type: 'tip',
          text: 'Забыли выбрать блокчейн-сеть (Ethereum EVM, Solana, Bitcoin, TON).',
        });
      } else {
        score += 15;
      }

      if (!cryptoData?.address?.trim()) {
        list.push({
          id: 'crypto-missing-address',
          type: 'tip',
          text: 'Забыли публичный адрес кошелька (0x... / bc1q...) для быстрой сверки реквизитов.',
        });
      } else {
        score += 15;
      }
    } else if (itemType !== 'secureNote') {
      // Password checks
      if (!password.trim()) {
        list.push({
          id: 'missing-password',
          type: 'warning',
          text: 'Забыли указать пароль учетной записи. Нажмите «Сгенерировать» для создания безопасного ключа.',
        });
      } else {
        if (password.length < 8) {
          list.push({
            id: 'short-password',
            type: 'warning',
            text: `Пароль слишком короткий (${password.length} симв.). Рекомендуется от 12+ символов.`,
          });
          score += 15;
        } else {
          score += 35;
        }
      }

      // Username check
      if (itemType === 'password' && !username.trim()) {
        list.push({
          id: 'missing-username',
          type: 'tip',
          text: 'Забыли указать логин или email для входа.',
        });
      } else if (username.trim()) {
        score += 20;
      }

      // URL check
      if (itemType === 'password' && !url.trim()) {
        list.push({
          id: 'missing-url',
          type: 'tip',
          text: 'Забыли ссылку на сайт (URL) для быстрого перехода.',
        });
      } else if (url.trim()) {
        score += 10;
      }
    } else {
      // Secure note
      if (!notes.trim()) {
        list.push({
          id: 'missing-notes',
          type: 'warning',
          text: 'Заметка пустая. Добавьте текст или резервную информацию.',
        });
      } else {
        score += 65;
      }
    }

    // Tags check
    if (!effectiveTags.trim()) {
      list.push({
        id: 'missing-tags',
        type: 'tip',
        text: 'Совет: добавьте теги (напр. #работа, #крипта) для мгновенной группировки.',
      });
    }

    return { hints: list, progressScore: Math.min(100, score) };
  }, [title, itemType, username, password, url, notes, effectiveTags, cryptoData]);

  if (hints.length === 0) {
    return (
      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl flex items-center justify-between text-xs text-emerald-200 animate-fade-in shadow-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Все обязательные поля отлично заполнены!</span>
        </div>
        <span className="font-mono text-emerald-300 font-bold text-xs">100%</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 select-none animate-fade-in backdrop-blur-xl">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-white/80 font-semibold">
          <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
          <span>Подсказки ассистента ({hints.length})</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
          <span>Заполнено: {progressScore}%</span>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-all duration-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              style={{ width: `${progressScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hints List */}
      <div className="space-y-1.5 pt-0.5">
        {hints.slice(0, 3).map((hint) => (
          <div
            key={hint.id}
            className={`flex items-start gap-2 text-[11px] leading-tight py-1.5 px-2.5 rounded-xl ${
              hint.type === 'warning'
                ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20'
                : 'text-white/60 bg-white/[0.02]'
            }`}
          >
            {hint.type === 'warning' ? (
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5" />
            ) : (
              <Info className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400 mt-0.5" />
            )}
            <span>{hint.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
