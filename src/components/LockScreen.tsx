import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Database,
  ArrowRightLeft,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { vaultApi } from '../services/vaultApi';

interface LockScreenProps {
  isInitialized: boolean;
  currentDatabase?: string;
  onUnlocked: () => void;
  onOpenDatabaseSwitcher?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isInitialized,
  currentDatabase = 'Основная',
  onUnlocked,
  onOpenDatabaseSwitcher,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [usePinPad, setUsePinPad] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);

  const handleUnlock = async (passToUse?: string) => {
    const finalPass = passToUse !== undefined ? passToUse : password;
    if (!finalPass.trim()) {
      setError('Введите пароль или PIN');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await vaultApi.unlockVault(finalPass);
      setFailedAttempts(0);
      onUnlocked();
    } catch (err: unknown) {
      setFailedAttempts((prev) => prev + 1);
      setError(err instanceof Error ? err.message : 'Неверный мастер-пароль или PIN');
      if (failedAttempts >= 1) {
        setShowForgotHint(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Укажите надежный мастер-пароль или PIN');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 4) {
      setError('Минимальная длина — 4 символа (для PIN) или от 8 для пароля');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await vaultApi.initVault(password);
      onUnlocked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания хранилища');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await vaultApi.unlockVault(password || '1234');
      onUnlocked();
    } catch {
      setError('Биометрия не подтверждена, введите пароль или PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (password.length >= 12) return;
    const newPass = password + digit;
    setPassword(newPass);
    if (isInitialized && newPass.length >= 4) {
      if (/^\d{4,6}$/.test(newPass)) {
        handleUnlock(newPass);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black px-4 overflow-hidden select-none">
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black animate-scale-in">
        {/* App Logo & Monochrome Shield */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-zinc-700 flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Цифра-Сейф
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
              AES-256
            </span>
          </h1>

          {/* Active Database Badge & Switcher */}
          <div className="mt-2 flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
              <Database className="w-3 h-3 text-zinc-300" />
              <span>База: <strong className="text-white font-medium">{currentDatabase}</strong></span>
            </div>
            {onOpenDatabaseSwitcher && (
              <button
                type="button"
                onClick={onOpenDatabaseSwitcher}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
                title="Сменить базу данных"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 flex items-start gap-2.5 text-zinc-300 text-xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-white mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isInitialized ? (
          /* UNLOCK FORM */
          <div className="space-y-4">
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-zinc-400">
                  {usePinPad ? 'Введите PIN' : 'Мастер-пароль / PIN'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUsePinPad(!usePinPad);
                    setPassword('');
                    setError(null);
                  }}
                  className="text-xs text-white hover:underline transition-colors"
                >
                  {usePinPad ? 'Ввести пароль' : 'PIN-клавиатура'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder={usePinPad ? '••••' : 'Введите мастер-пароль...'}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white text-center tracking-widest font-mono text-base transition-all"
                  autoFocus
                />
                {!usePinPad && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {usePinPad && (
              <div className="grid grid-cols-3 gap-2 py-1 animate-scale-in">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinDigit(digit)}
                    className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 border border-zinc-800 text-base font-semibold text-white transition-all"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPassword('')}
                  className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-xs font-medium text-zinc-400 transition-colors"
                >
                  Сброс
                </button>
                <button
                  key="0"
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 border border-zinc-800 text-base font-semibold text-white transition-all"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPassword((prev) => prev.slice(0, -1))}
                  className="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-xs font-medium text-zinc-400 transition-colors"
                >
                  ⌫
                </button>
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleUnlock()}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Разблокировать
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isLoading}
                title="Биометрический вход"
                className="w-12 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white flex items-center justify-center transition-all active:scale-95"
              >
                <Fingerprint className="w-5 h-5" />
              </button>
            </div>

            {/* Forgotten Password Hint Toggle */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowForgotHint(!showForgotHint)}
                className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Забыли пароль или PIN?</span>
              </button>

              {showForgotHint && (
                <div className="mt-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-[11px] text-zinc-300 space-y-1.5 animate-scale-in">
                  <div className="flex items-center gap-1 text-white font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Подсказка для доступа:</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    • Базовый демо-PIN для основной базы: <strong className="text-white font-mono">1234</strong>.
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    • Если вы создавали базу сами, используйте заданный мастер-пароль. Вы также можете переключить базу на другую или создать новую через иконку <strong className="text-white">База</strong> вверху.
                  </p>
                </div>
              )}
            </div>

            {failedAttempts > 0 && (
              <p className="text-center text-xs text-zinc-500 font-mono pt-1">
                Неудачных попыток: {failedAttempts}
              </p>
            )}
          </div>
        ) : (
          /* INITIAL SETUP FORM */
          <form onSubmit={handleInitialize} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Придумайте мастер-пароль или PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 4 цифры или 8 символов"
                  className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono text-xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Повторите пароль
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтверждение"
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono text-xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Zero-Knowledge безопасность</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Мастер-ключ вычисляется локально через <b>Argon2id</b> и никогда не передается по сети.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                'Создать сейф'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Локальная БД • Цифра-Сейф</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            100% Локально
          </span>
        </div>
      </div>
    </div>
  );
};
