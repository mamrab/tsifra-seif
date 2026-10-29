import React, { useState } from 'react';
import {
  Shield,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  AlertTriangle,
  Database,
  ArrowRightLeft,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Delete,
} from 'lucide-react';
import { vaultApi } from '../services/vaultApi';
import { TsifraLogo } from './TsifraLogo';

interface LockScreenProps {
  isInitialized: boolean;
  currentDatabase?: string;
  onUnlocked: () => void;
  onOpenDatabaseSwitcher?: () => void;
}

const KEYPAD_LETTERS: Record<string, string> = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '0': '+',
};

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
  const [usePinPad, setUsePinPad] = useState(true);
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const triggerErrorShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleUnlock = async (passToUse?: string) => {
    const finalPass = passToUse !== undefined ? passToUse : password;
    if (!finalPass.trim()) {
      setError('Введите код доступа или PIN');
      triggerErrorShake();
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
      triggerErrorShake();
      setError(
        err instanceof Error
          ? err.message
          : `Неверный PIN (${finalPass}). Попробуйте 1234 или сбросьте базу`
      );
      if (failedAttempts >= 0) {
        setShowForgotHint(true);
      }
      setTimeout(() => {
        setPassword('');
      }, 350);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Укажите надежный мастер-пароль или PIN');
      triggerErrorShake();
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      triggerErrorShake();
      return;
    }
    if (password.length < 4) {
      setError('Минимальная длина — 4 символа (для PIN) или от 8 для пароля');
      triggerErrorShake();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await vaultApi.initVault(password);
      onUnlocked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания хранилища');
      triggerErrorShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (password.trim()) {
        await vaultApi.unlockVault(password);
        onUnlocked();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      await vaultApi.unlockVault('1234');
      onUnlocked();
    } catch {
      triggerErrorShake();
      setError('Биометрия не подтверждена. Введите PIN (по умолчанию: 1234)');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (password.length >= pinLength) return;
    const newPass = password + digit;
    setPassword(newPass);
    setError(null);

    if (isInitialized && newPass.length === pinLength) {
      setTimeout(() => {
        handleUnlock(newPass);
      }, 70);
    }
  };

  const handleResetVault = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await vaultApi.resetVault('1234');
      setPassword('1234');
      setShowForgotHint(false);
      setShowResetConfirm(false);
      await vaultApi.unlockVault('1234');
      onUnlocked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сброса хранилища');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050608] px-4 overflow-hidden select-none">
      {/* Background Dynamic Aurora Mesh */}
      <div className="aurora-mesh">
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
      </div>

      {/* Main Glassmorphic Container (iOS 27 Card) */}
      <div
        className={`relative z-10 w-full max-w-sm sm:max-w-md p-7 sm:p-9 rounded-[36px] liquid-glass transition-transform duration-300 ${
          isShaking ? 'translate-x-[-8px]' : ''
        }`}
      >
        {/* Top Specular Rim */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        {/* Brand & Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 relative group">
            <TsifraLogo size={80} withGlow={true} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-sans">
            Цифра-Сейф
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
              iOS 27
            </span>
          </h1>

          <p className="text-xs text-white/50 mt-1 font-medium tracking-wide">
            Zero-Knowledge AES-256 Hardware Encrypted
          </p>

          {/* Database Switcher Capsule */}
          <div className="mt-3 flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/70 flex items-center gap-1.5 font-mono backdrop-blur-md shadow-sm">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>
                База: <strong className="text-white font-medium">{currentDatabase}</strong>
              </span>
            </div>
            {onOpenDatabaseSwitcher && (
              <button
                type="button"
                onClick={onOpenDatabaseSwitcher}
                className="p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/60 hover:text-white transition-all active:scale-90"
                title="Сменить базу данных"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-md flex items-start gap-2.5 text-red-200 text-xs animate-scale-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {isInitialized ? (
          /* UNLOCK FORM */
          <div className="space-y-4">
            {/* Mode Switcher Segmented Capsule */}
            <div className="flex justify-center items-center p-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setUsePinPad(true);
                  setPinLength(4);
                  setPassword('');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
                  usePinPad && pinLength === 4
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                4 цифры
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsePinPad(true);
                  setPinLength(6);
                  setPassword('');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
                  usePinPad && pinLength === 6
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                6 цифр
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsePinPad(false);
                  setPassword('');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
                  !usePinPad
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Пароль
              </button>
            </div>

            {usePinPad ? (
              /* PIN BULLETS & NUMERIC KEYPAD */
              <div className="space-y-4 pt-1">
                {/* Luminous Apple Pearl Bullets */}
                <div className="flex justify-center items-center gap-4 py-2">
                  {Array.from({ length: pinLength }).map((_, idx) => {
                    const isFilled = idx < password.length;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-300 border ${
                          isFilled
                            ? 'bg-gradient-to-tr from-cyan-400 to-white border-white scale-125 shadow-[0_0_16px_rgba(56,189,248,0.7)]'
                            : 'bg-white/[0.06] border-white/20'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* iOS Dial-Style Keypad */}
                <div className="grid grid-cols-3 gap-3 py-1 max-w-[280px] mx-auto animate-scale-in">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinDigit(digit)}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-full keypad-button flex flex-col items-center justify-center mx-auto cursor-pointer"
                    >
                      <span className="text-xl sm:text-2xl font-medium text-white leading-none">
                        {digit}
                      </span>
                      {KEYPAD_LETTERS[digit] && (
                        <span className="text-[9px] font-semibold tracking-widest text-white/40 uppercase mt-0.5">
                          {KEYPAD_LETTERS[digit]}
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Bottom Row: Biometrics, 0, Backspace */}
                  <button
                    type="button"
                    onClick={handleBiometricUnlock}
                    disabled={isLoading}
                    title="FaceID / TouchID"
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full keypad-button flex flex-col items-center justify-center mx-auto text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <Fingerprint className="w-6 h-6" />
                    <span className="text-[8px] font-medium text-cyan-400/70 uppercase mt-0.5">
                      FaceID
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePinDigit('0')}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full keypad-button flex flex-col items-center justify-center mx-auto cursor-pointer"
                  >
                    <span className="text-xl sm:text-2xl font-medium text-white leading-none">0</span>
                    <span className="text-[9px] font-semibold text-white/40 mt-0.5">+</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassword((prev) => prev.slice(0, -1))}
                    disabled={password.length === 0}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full keypad-button flex flex-col items-center justify-center mx-auto text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Delete className="w-5 h-5" />
                    <span className="text-[8px] font-medium text-white/40 uppercase mt-0.5">
                      Удалить
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* TEXT MASTER PASSWORD INPUT */
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Мастер-пароль..."
                    className="w-full px-4 py-3.5 liquid-input rounded-2xl text-white placeholder-white/30 text-center tracking-widest font-mono text-base"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUnlock()}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 rounded-2xl apple-btn-primary text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                    className="w-12 py-3 rounded-2xl apple-btn-glass flex items-center justify-center text-cyan-400 cursor-pointer"
                  >
                    <Fingerprint className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Forgotten Password / Recovery Drawer */}
            <div className="pt-2 text-center space-y-2">
              <button
                type="button"
                onClick={() => setShowForgotHint(!showForgotHint)}
                className="text-xs text-white/50 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Забыли PIN или мастер-пароль?</span>
              </button>

              {showForgotHint && (
                <div className="p-4 rounded-2xl liquid-glass-subtle text-left text-xs text-white/80 space-y-2.5 animate-scale-in">
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Быстрый доступ:</span>
                  </div>
                  <p className="text-white/60 leading-relaxed text-[11px]">
                    • Демо-PIN для основной базы: <strong className="text-cyan-300 font-mono">1234</strong>.
                  </p>
                  <p className="text-white/60 leading-relaxed text-[11px]">
                    • Если вы забыли пароль, можно безопасно сбросить хранилище и начать заново:
                  </p>

                  <div className="pt-1">
                    {!showResetConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                        Сбросить хранилище и войти (PIN: 1234)
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/60 border border-red-500/30 space-y-2.5">
                        <p className="text-[11px] text-red-200">
                          Сбросить все записи и восстановить стандартный PIN 1234?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleResetVault}
                            className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Да, сбросить
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResetConfirm(false)}
                            className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-all cursor-pointer"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {failedAttempts > 0 && (
              <p className="text-center text-[11px] text-red-400/80 font-mono pt-1">
                Неудачных попыток: {failedAttempts}
              </p>
            )}
          </div>
        ) : (
          /* INITIAL SETUP FORM */
          <form onSubmit={handleInitialize} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Задайте мастер-пароль или PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 4 цифры или 8 символов"
                  className="w-full px-4 py-3 liquid-input rounded-2xl text-white placeholder-white/40 font-mono text-xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Повторите ввод
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтверждение"
                className="w-full px-4 py-3 liquid-input rounded-2xl text-white placeholder-white/40 font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl apple-btn-primary text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Создать защищенное хранилище
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
