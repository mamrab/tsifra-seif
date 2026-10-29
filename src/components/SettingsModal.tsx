import React, { useState } from 'react';
import {
  X,
  Shield,
  Clock,
  Fingerprint,
  ClipboardCheck,
  Download,
  Upload,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { VaultSettings, VaultStatus } from '../types/vault';
import { vaultApi } from '../services/vaultApi';

interface SettingsModalProps {
  isOpen: boolean;
  status: VaultStatus | null;
  onClose: () => void;
  onUpdateStatus: () => Promise<void>;
  onOpenDatabaseSwitcher?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  status,
  onClose,
  onUpdateStatus,
  onOpenDatabaseSwitcher,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'password' | 'backup' | 'databases'>('security');

  // Settings State
  const [autoLockMinutes, setAutoLockMinutes] = useState(status?.autoLockMinutes || 5);
  const [lockOnBackground, setLockOnBackground] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(status?.biometricsEnabled || false);
  const [clipboardClearSeconds, setClipboardClearSeconds] = useState(30);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Backup State
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [importBase64, setImportBase64] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  if (!isOpen) return null;

  const handleSaveSecuritySettings = async () => {
    try {
      const newSettings: VaultSettings = {
        autoLockMinutes,
        lockOnBackground,
        biometricsEnabled,
        clipboardClearSeconds,
        theme: 'dark',
      };
      await vaultApi.updateSettings(newSettings);
      await onUpdateStatus();
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError('Новые пароли не совпадают');
      return;
    }
    if (newPassword.length < 4) {
      setPwError('Минимальная длина нового пароля — 4 символа');
      return;
    }

    setIsChangingPw(true);
    try {
      await vaultApi.changePassword(oldPassword, newPassword);
      setPwSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Ошибка смены пароля');
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleExportBackup = async () => {
    setBackupError(null);
    setBackupSuccess(null);
    setIsProcessingBackup(true);
    try {
      const rawEncrypted = await vaultApi.exportBackup();
      const blob = new Blob([rawEncrypted], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tsifra_backup_${new Date().toISOString().slice(0, 10)}.tsvault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupSuccess('Резервная копия успешно экспортирована');
    } catch (err: unknown) {
      setBackupError(err instanceof Error ? err.message : 'Ошибка экспорта');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importBase64 || !importPassword) {
      setBackupError('Выберите файл и введите пароль');
      return;
    }

    setBackupError(null);
    setBackupSuccess(null);
    setIsProcessingBackup(true);
    try {
      await vaultApi.importBackup(importBase64, importPassword);
      setBackupSuccess('Хранилище успешно восстановлено из резервной копии!');
      await onUpdateStatus();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setBackupError(err instanceof Error ? err.message : 'Ошибка импорта бэкапа');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportBase64(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-2xl p-4 animate-fade-in">
      <div className="w-full max-w-lg liquid-glass rounded-[32px] p-6 sm:p-7 relative max-h-[90vh] flex flex-col animate-scale-in border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
        {/* Top Specular Rim */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Настройки безопасности</h3>
              <p className="text-[11px] text-white/50">Конфигурация шифрования и доступа</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10 my-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Защита
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('databases')}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              activeTab === 'databases'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Базы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Пароль
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Бэкап
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto py-2 pr-1 flex-1 space-y-4">
          {activeTab === 'security' && (
            <div className="space-y-3.5">
              {/* Auto-lock timer */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Автоблокировка</h4>
                    <p className="text-[11px] text-white/50">Таймаут неактивности</p>
                  </div>
                </div>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(parseInt(e.target.value))}
                  className="liquid-input rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
                >
                  <option value={1} className="bg-[#0c0e17]">1 минута</option>
                  <option value={5} className="bg-[#0c0e17]">5 минут</option>
                  <option value={15} className="bg-[#0c0e17]">15 минут</option>
                  <option value={30} className="bg-[#0c0e17]">30 минут</option>
                  <option value={0} className="bg-[#0c0e17]">Отключено</option>
                </select>
              </div>

              {/* Lock on background */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Блокировка при сворачивании</h4>
                    <p className="text-[11px] text-white/50">Мгновенный lock при потере фокуса</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={lockOnBackground}
                  onChange={(e) => setLockOnBackground(e.target.checked)}
                  className="rounded bg-black/50 border-white/20 text-cyan-400 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Biometrics */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Биометрия</h4>
                    <p className="text-[11px] text-white/50">Touch ID, Face ID, Windows Hello</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={biometricsEnabled}
                  onChange={(e) => setBiometricsEnabled(e.target.checked)}
                  className="rounded bg-black/50 border-white/20 text-cyan-400 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Clipboard Auto-clear */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-cyan-400">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Очистка буфера обмена</h4>
                    <p className="text-[11px] text-white/50">Удалять скопированный пароль</p>
                  </div>
                </div>
                <select
                  value={clipboardClearSeconds}
                  onChange={(e) => setClipboardClearSeconds(parseInt(e.target.value))}
                  className="liquid-input rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
                >
                  <option value={15} className="bg-[#0c0e17]">15 секунд</option>
                  <option value={30} className="bg-[#0c0e17]">30 секунд</option>
                  <option value={60} className="bg-[#0c0e17]">60 секунд</option>
                  <option value={0} className="bg-[#0c0e17]">Не очищать</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSecuritySettings}
                  className="w-full py-3 px-4 rounded-2xl apple-btn-primary text-xs cursor-pointer shadow-lg"
                >
                  Применить параметры
                </button>
              </div>
            </div>
          )}

          {activeTab === 'databases' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Текущее локальное хранилище</h4>
                    <p className="text-[11px] text-cyan-300 font-mono">
                      {status?.currentDatabase || 'tsifra_vault.enc'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Цифра-Сейф поддерживает создание изолированных зашифрованных локальных баз данных (файлы .enc с отдельным мастер-паролем, солью Argon2id и AES-256-GCM).
                </p>
                {onOpenDatabaseSwitcher && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDatabaseSwitcher();
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl apple-btn-primary text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Управление и переключение баз</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {pwError && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-200 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>Мастер-пароль успешно изменен и хранилище перезашифровано!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Текущий мастер-пароль
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  className="w-full px-4 py-2.5 liquid-input rounded-2xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Новый мастер-пароль
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 4 цифры или 8 символов"
                  className="w-full px-4 py-2.5 liquid-input rounded-2xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повтор пароля"
                  className="w-full px-4 py-2.5 liquid-input rounded-2xl text-white text-xs font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPw}
                  className="w-full py-3 px-4 rounded-2xl apple-btn-primary text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-40"
                >
                  <KeyRound className="w-4 h-4" />
                  {isChangingPw ? 'Перезашифрование...' : 'Сменить мастер-пароль'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              {backupError && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{backupError}</span>
                </div>
              )}
              {backupSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-200 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{backupSuccess}</span>
                </div>
              )}

              {/* Export section */}
              <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2.5">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Экспорт зашифрованного хранилища</span>
                </div>
                <p className="text-xs text-white/60">
                  Сохраняет полную зашифрованную копию базы (включая соль Argon2id и теги GCM) в файл <b className="text-white">.tsvault</b>.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isProcessingBackup}
                  className="w-full py-2.5 px-3 rounded-2xl apple-btn-glass text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  Скачать резервную копию
                </button>
              </div>

              {/* Import section */}
              <form onSubmit={handleImportBackup} className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-3">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Импорт из резервной копии</span>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1.5">
                    Выберите файл .tsvault:
                  </label>
                  <input
                    type="file"
                    accept=".tsvault,.enc,.txt"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1.5">
                    Мастер-пароль от бэкапа:
                  </label>
                  <input
                    type="password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    placeholder="Пароль для расшифровки бэкапа"
                    className="w-full px-4 py-2.5 liquid-input rounded-2xl text-white text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingBackup || !importBase64 || !importPassword}
                  className="w-full py-2.5 px-4 rounded-2xl apple-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Восстановить хранилище
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
