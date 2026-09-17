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
      const result = await vaultApi.generatePassword(customCfg || config);
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

  const strengthColor = () => {
    if (!generated) return 'bg-slate-700';
    switch (generated.strengthLevel) {
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-amber-500';
      case 'good':
        return 'bg-blue-500';
      case 'strong':
        return 'bg-emerald-500';
      case 'excellent':
        return 'bg-teal-400';
      default:
        return 'bg-emerald-500';
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Генератор паролей</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 my-5">
          <button
            type="button"
            onClick={() => handleConfigChange({ mode: 'password' })}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${
              config.mode === 'password'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Пароль
          </button>
          <button
            type="button"
            onClick={() => handleConfigChange({ mode: 'passphrase' })}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${
              config.mode === 'passphrase'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Кодовая фраза
          </button>
          <button
            type="button"
            onClick={() => handleConfigChange({ mode: 'pin' })}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${
              config.mode === 'pin'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PIN-код
          </button>
        </div>

        {/* Generated Value Display Box */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/90 relative group mb-5">
          <div className="font-mono text-base md:text-lg text-emerald-400 break-all select-all tracking-wide min-h-[48px] flex items-center pr-20">
            {generated?.value || '...'}
          </div>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button
              onClick={() => refreshSecret()}
              disabled={isRefreshing}
              title="Перегенерировать"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-90"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              title="Скопировать в буфер обмена"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-90"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength & Entropy Indicator Bar */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 transition-all ${
                      generated && step <= (generated.score ?? 3)
                        ? strengthColor()
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-slate-300">{strengthLabel()}</span>
            </div>
            <span className="text-slate-400 font-mono">
              {generated?.entropy} бит энтропии
            </span>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="space-y-4">
          {config.mode === 'password' && (
            <>
              <div>
                <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
                  <span>Длина пароля</span>
                  <span className="font-mono font-semibold text-emerald-400 text-sm">
                    {config.length} символов
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={config.length}
                  onChange={(e) => handleConfigChange({ length: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeUppercase}
                    onChange={(e) => handleConfigChange({ includeUppercase: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Заглавные (A-Z)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeLowercase}
                    onChange={(e) => handleConfigChange({ includeLowercase: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Строчные (a-z)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeDigits}
                    onChange={(e) => handleConfigChange({ includeDigits: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Цифры (0-9)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.includeSymbols}
                    onChange={(e) => handleConfigChange({ includeSymbols: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Спецсимволы (!@#$)</span>
                </label>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-400 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.excludeAmbiguous}
                  onChange={(e) => handleConfigChange({ excludeAmbiguous: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Исключить неоднозначные (1, l, I, 0, O)</span>
              </label>
            </>
          )}

          {config.mode === 'passphrase' && (
            <div>
              <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
                <span>Количество слов</span>
                <span className="font-mono font-semibold text-emerald-400 text-sm">
                  {config.wordCount} слова
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={config.wordCount}
                onChange={(e) => handleConfigChange({ wordCount: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {config.mode === 'pin' && (
            <div>
              <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
                <span>Длина PIN-кода</span>
                <span className="font-mono font-semibold text-emerald-400 text-sm">
                  {config.length} цифр
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                value={config.length}
                onChange={(e) => handleConfigChange({ length: parseInt(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
          {onSelectPassword ? (
            <button
              onClick={() => {
                if (generated) {
                  onSelectPassword(generated.value);
                  onClose();
                }
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Вставить в запись
            </button>
          ) : (
            <button
              onClick={handleCopy}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано!' : 'Скопировать пароль'}
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
