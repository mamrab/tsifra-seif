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
    } else if (itemType === 'secureNote') {
      if (!notes.trim()) {
        list.push({
          id: 'empty-note',
          type: 'warning',
          text: 'Забыли ввести текст заметки — поле пока пусто.',
        });
      } else {
        score += 65;
      }
    } else {
      // Standard credentials (password, card, serverKey)
      if (!username.trim() && itemType !== 'paymentCard') {
        list.push({
          id: 'missing-login',
          type: 'warning',
          text: 'Забыли логин, email или номер счета — позже будет сложно вспомнить аккаунт.',
        });
      } else {
        score += 25;
      }

      if (!password.trim()) {
        list.push({
          id: 'missing-password',
          type: 'warning',
          text: 'Забыли пароль — нажмите «Сгенерировать» для создания сверхстойкого ключа.',
        });
      } else if (password.length < 10) {
        list.push({
          id: 'short-password',
          type: 'warning',
          text: 'Пароль короче 10 символов — рекомендуется сгенерировать более стойкий ключ.',
        });
        score += 15;
      } else {
        score += 35;
      }

      if (!url.trim() && itemType === 'password') {
        list.push({
          id: 'missing-url',
          type: 'tip',
          text: 'Совет: укажите URL сервиса (https://...) для перехода на сайт в один клик.',
        });
      } else if (url.trim()) {
        score += 15;
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
      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-between text-xs text-zinc-300 animate-fade-in">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span className="font-medium text-white">Все обязательные поля отлично заполнены!</span>
        </div>
        <span className="font-mono text-white text-xs">100%</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 select-none animate-fade-in">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
          <Lightbulb className="w-3.5 h-3.5 text-white" />
          <span>Подсказки ассистента ({hints.length})</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span>Заполнено: {progressScore}%</span>
          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
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
            className={`flex items-start gap-2 text-[11px] leading-tight py-1 px-2 rounded-lg ${
              hint.type === 'warning'
                ? 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                : 'text-zinc-400'
            }`}
          >
            {hint.type === 'warning' ? (
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-white mt-0.5" />
            ) : (
              <Info className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500 mt-0.5" />
            )}
            <span>{hint.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
