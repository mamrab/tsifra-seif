import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { GeneratorConfig, GeneratedSecret } from '../types/vault';
import { vaultApi } from '../services/vaultApi';
import { copyToClipboardSecurely } from '../utils/clipboard';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectPassword,
}) => {
  const [config, setConfig] = useState<GeneratorConfig>({
    mode: 'password',
    length: 18,
    includeUppercase: true,
    includeLowercase: true,
    includeDigits: true,
    includeSymbols: true,
    excludeAmbiguous: false,
    wordCount: 4,
    separator: '-',
  });

  const [generated, setGenerated] = useState<GeneratedSecret | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSecret = useCallback(async (customCfg?: GeneratorConfig) => {
    setIsRefreshing(true);
    try {
      const activeCfg = customCfg || config;
      const result = await vaultApi.generatePassword(activeCfg);
      setGenerated(result);
    } catch (err) {
      console.error('Error generating secret:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [config]);

  useEffect(() => {
    if (isOpen) {
      refreshSecret();
    }
  }, [isOpen, refreshSecret]);

  const handleConfigChange = (patch: Partial<GeneratorConfig>) => {
    const updated = { ...config, ...patch };

    // Prevent disabling all character types in password mode
    if (updated.mode === 'password') {
      if (
        !updated.includeUppercase &&
        !updated.includeLowercase &&
        !updated.includeDigits &&
        !updated.includeSymbols
      ) {
        updated.includeLowercase = true;
      }
    }

    setConfig(updated);
    refreshSecret(updated);
  };

  const handleCopy = async () => {
    if (!generated) return;
    await copyToClipboardSecurely(generated.value, 30);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const strengthLabel = () => {
    if (!generated) return '';
    switch (generated.strengthLevel) {
      case 'weak':
        return 'Слабый';
      case 'fair':
        return 'Средний';
      case 'good':
        return 'Хороший';
      case 'strong':
        return 'Стойкий';
      case 'excellent':
        return 'Максимальная защита';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-2xl p-4 animate-fade-in">
      <div className="w-full max-w-lg liquid-glass rounded-[32px] p-6 sm:p-7 relative animate-scale-in border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
        {/* Top Specular Rim */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Генератор крипто-паролей</h3>
              <p className="text-[11px] text-white/50">CSPRNG энтропия высокой стойкости</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10 my-5">
          <button
            type="button"
            onClick={() => handleConfigChange({ mode: 'password', length: config.length < 6 ? 16 : config.length })}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              config.mode === 'password'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Пароль
          </button>
          <button
            type="button"
            onClick={() => handleConfigChange({ mode: 'passphrase' })}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              config.mode === 'passphrase'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Кодовая фраза
          </button>
          <button
            type="button"
            onClick={() => handleConfigChange({ mode: 'pin', length: config.length > 16 || config.length < 4 ? 6 : config.length })}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              config.mode === 'pin'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            PIN-код
          </button>
        </div>

        {/* Generated Value Box */}
        <div className="p-4 bg-black/40 rounded-3xl border border-white/10 relative group mb-5 backdrop-blur-xl shadow-inner">
          <div className="font-mono text-base md:text-lg text-white break-all select-all tracking-wide min-h-[48px] flex items-center pr-20">
            {generated?.value || '...'}
          </div>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              onClick={() => refreshSecret()}
              disabled={isRefreshing}
              title="Перегенерировать"
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              title="Скопировать в буфер обмена"
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength & Entropy Indicator Bar */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 transition-all ${
                      generated && step <= (generated.score ?? 3)
                        ? 'bg-gradient-to-r from-cyan-400 to-sky-300'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-white/80">{strengthLabel()}</span>
            </div>
            <span className="text-cyan-400/80 font-mono text-[11px]">
              {generated?.entropy} бит энтропии
            </span>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="space-y-4">
          {config.mode === 'password' && (
            <>
              <div>
                <div className="flex justify-between items-center text-xs text-white/70 mb-2">
                  <span>Длина пароля</span>
                  <span className="font-mono font-semibold text-white text-sm">
                    {config.length} символов
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={config.length}
                  onChange={(e) => handleConfigChange({ length: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeUppercase}
                    onChange={(e) => handleConfigChange({ includeUppercase: e.target.checked })}
                    className="rounded bg-black/50 border-white/20 text-cyan-400 focus:ring-cyan-400 w-4 h-4"
                  />
                  <span>Заглавные (A-Z)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeLowercase}
                    onChange={(e) => handleConfigChange({ includeLowercase: e.target.checked })}
                    className="rounded bg-black/50 border-white/20 text-cyan-400 focus:ring-cyan-400 w-4 h-4"
                  />
                  <span>Строчные (a-z)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeDigits}
                    onChange={(e) => handleConfigChange({ includeDigits: e.target.checked })}
                    className="rounded bg-black/50 border-white/20 text-cyan-400 focus:ring-cyan-400 w-4 h-4"
                  />
                  <span>Цифры (0-9)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeSymbols}
                    onChange={(e) => handleConfigChange({ includeSymbols: e.target.checked })}
                    className="rounded bg-black/50 border-white/20 text-cyan-400 focus:ring-cyan-400 w-4 h-4"
                  />
                  <span>Спецсимволы (!@#$)</span>
                </label>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-white/50 hover:text-white pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.excludeAmbiguous}
                  onChange={(e) => handleConfigChange({ excludeAmbiguous: e.target.checked })}
                  className="rounded bg-black/50 border-white/20 text-cyan-400 focus:ring-cyan-400 w-4 h-4"
                />
                <span>Исключить неоднозначные (1, l, I, 0, O)</span>
              </label>
            </>
          )}

          {config.mode === 'passphrase' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs text-white/70 mb-2">
                  <span>Количество слов</span>
                  <span className="font-mono font-semibold text-white text-sm">
                    {config.wordCount} слова
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={config.wordCount}
                  onChange={(e) => handleConfigChange({ wordCount: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1.5">Разделитель слов</label>
                <div className="flex gap-2">
                  {[
                    { label: 'Дефис (-)', val: '-' },
                    { label: 'Точка (.)', val: '.' },
                    { label: 'Прочерк (_)', val: '_' },
                    { label: 'Пробел ( )', val: ' ' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => handleConfigChange({ separator: s.val })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border cursor-pointer ${
                        config.separator === s.val
                          ? 'bg-white text-black border-white font-bold shadow-sm'
                          : 'bg-white/[0.04] border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {config.mode === 'pin' && (
            <div>
              <div className="flex justify-between items-center text-xs text-white/70 mb-2">
                <span>Длина PIN-кода</span>
                <span className="font-mono font-semibold text-white text-sm">
                  {config.length} цифр
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                value={config.length}
                onChange={(e) => handleConfigChange({ length: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex gap-3">
          {onSelectPassword ? (
            <button
              onClick={() => {
                if (generated) {
                  onSelectPassword(generated.value);
                  onClose();
                }
              }}
              className="flex-1 py-3 px-4 apple-btn-primary rounded-2xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              Вставить в запись
            </button>
          ) : (
            <button
              onClick={handleCopy}
              className="flex-1 py-3 px-4 apple-btn-primary rounded-2xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg"
            >
              {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
              {copied ? 'Скопировано!' : 'Скопировать пароль'}
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-2xl apple-btn-glass text-xs font-medium cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
