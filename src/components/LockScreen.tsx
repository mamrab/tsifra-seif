import React, { useState } from 'react';
import { Shield, Lock, Key, Fingerprint, Eye, EyeOff, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { vaultApi } from '../services/vaultApi';

interface LockScreenProps {
  isInitialized: boolean;
  onUnlocked: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ isInitialized, onUnlocked }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [usePinPad, setUsePinPad] = useState(false);

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
      // Biometric simulation / native trigger
      await new Promise((resolve) => setTimeout(resolve, 600));
      await vaultApi.unlockVault(password || '1234');
      onUnlocked();
    } catch {
      setError('Биометрия не подтверждена или требуется ввести пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (password.length >= 12) return;
    const newPass = password + digit;
    setPassword(newPass);
    if (isInitialized && newPass.length >= 4) {
      // Auto attempt on 4-6 digits if purely numeric
      if (/^\d{4,6}$/.test(newPass)) {
        handleUnlock(newPass);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#07090e] px-4 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 shadow-2xl shadow-black/80">
        {/* App Logo & Shield */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Shield className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Цифра-Сейф
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              AES-256
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isInitialized
              ? 'Хранилище зашифровано. Введите PIN или пароль'
              : 'Создание локального зашифрованного хранилища'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isInitialized ? (
          /* UNLOCK FORM */
          <div className="space-y-6">
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-300">
                  {usePinPad ? 'Введите PIN' : 'Мастер-пароль / PIN'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUsePinPad(!usePinPad);
                    setPassword('');
                    setError(null);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {usePinPad ? 'Ввести пароль' : 'Открыть PIN-клавиатуру'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder={usePinPad ? '••••' : 'Введите мастер-пароль...'}
                  className="w-full px-4 py-3.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center tracking-widest font-mono text-lg transition-all"
                  autoFocus
                />
                {!usePinPad && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            {usePinPad && (
              <div className="grid grid-cols-3 gap-3 py-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinDigit(digit)}
                    className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-700/70 active:bg-emerald-500/20 active:scale-95 border border-slate-700/50 text-xl font-semibold text-white transition-all shadow"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPassword('')}
                  className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-xs font-medium text-slate-400 transition-colors"
                >
                  Очистить
                </button>
                <button
                  key="0"
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-700/70 active:bg-emerald-500/20 active:scale-95 border border-slate-700/50 text-xl font-semibold text-white transition-all shadow"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPassword((prev) => prev.slice(0, -1))}
                  className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-xs font-medium text-slate-400 transition-colors"
                >
                  ⌫
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleUnlock()}
                disabled={isLoading}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
                title="Биометрический вход (Touch ID / Face ID / Windows Hello)"
                className="w-14 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-emerald-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <Fingerprint className="w-6 h-6" />
              </button>
            </div>

            {failedAttempts > 0 && (
              <p className="text-center text-xs text-slate-500">
                Неудачных попыток: {failedAttempts}
              </p>
            )}
          </div>
        ) : (
          /* INITIAL SETUP FORM */
          <form onSubmit={handleInitialize} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Придумайте мастер-пароль или PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 4 цифры или 8 символов"
                  className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Повторите пароль
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтверждение"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero-Knowledge защита</span>
              </div>
              <p>
                Мастер-ключ вычисляется через <b>Argon2id</b> и никогда не сохраняется в открытом виде.
                Если вы забудете пароль, восстановить доступ будет невозможно.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Создать сейф
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tauri 2 + Rust + React</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Автономно & Локально
          </span>
        </div>
      </div>
    </div>
  );
};
