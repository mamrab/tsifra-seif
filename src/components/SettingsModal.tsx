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
} from 'lucide-react';
import { VaultSettings, VaultStatus } from '../types/vault';
import { vaultApi } from '../services/vaultApi';

interface SettingsModalProps {
  isOpen: boolean;
  status: VaultStatus | null;
  onClose: () => void;
  onUpdateStatus: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  status,
  onClose,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'password' | 'backup'>('security');

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
      const base64Data = await vaultApi.exportBackup();
      const blob = new Blob([base64Data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tsifra_vault_backup_${new Date().toISOString().slice(0, 10)}.tsvault`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupSuccess('Зашифрованный файл бэкапа успешно скачан!');
    } catch (err: unknown) {
      setBackupError(err instanceof Error ? err.message : 'Ошибка экспорта бэкапа');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importBase64.trim() || !importPassword.trim()) {
      setBackupError('Укажите зашифрованные данные бэкапа и мастер-пароль к ним');
      return;
    }

    setBackupError(null);
    setBackupSuccess(null);
    setIsProcessingBackup(true);
    try {
      await vaultApi.importBackup(importBase64, importPassword);
      setBackupSuccess('Резервная копия успешно восстановлена!');
      await onUpdateStatus();
      setImportBase64('');
      setImportPassword('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Настройки безопасности</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 my-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Безопасность
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'password'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Смена пароля
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'backup'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Резервная копия
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto py-2 pr-1 flex-1 space-y-4">
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Auto-lock timer */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                    <Clock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Автоблокировка</h4>
                    <p className="text-xs text-slate-400">Блокировать при бездействии</p>
                  </div>
                </div>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={1}>1 минута</option>
                  <option value={5}>5 минут</option>
                  <option value={15}>15 минут</option>
                  <option value={30}>30 минут</option>
                  <option value={0}>Отключено</option>
                </select>
              </div>

              {/* Lock on background */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Блокировка при сворачивании</h4>
                    <p className="text-xs text-slate-400">Мгновенный lock при потере фокуса</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={lockOnBackground}
                  onChange={(e) => setLockOnBackground(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Biometrics */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Биометрия</h4>
                    <p className="text-xs text-slate-400">Touch ID, Face ID, Windows Hello</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={biometricsEnabled}
                  onChange={(e) => setBiometricsEnabled(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Clipboard Auto-clear */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Очистка буфера обмена</h4>
                    <p className="text-xs text-slate-400">Удалять скопированный пароль</p>
                  </div>
                </div>
                <select
                  value={clipboardClearSeconds}
                  onChange={(e) => setClipboardClearSeconds(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={15}>15 секунд</option>
                  <option value={30}>30 секунд</option>
                  <option value={60}>60 секунд</option>
                  <option value={0}>Не очищать</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSecuritySettings}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Применить параметры
                </button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {pwError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Мастер-пароль успешно изменен и хранилище перезашифровано!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Текущий мастер-пароль
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Новый мастер-пароль
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 4 цифры или 8 символов"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повтор пароля"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPw}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  {isChangingPw ? 'Перезашифрование...' : 'Сменить мастер-пароль'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-5">
              {backupError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{backupError}</span>
                </div>
              )}
              {backupSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{backupSuccess}</span>
                </div>
              )}

              {/* Export section */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Экспорт зашифрованного хранилища</span>
                </div>
                <p className="text-xs text-slate-400">
                  Сохраняет полную зашифрованную копию базы (включая соль Argon2id и теги GCM) в файл <b>.tsvault</b>.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isProcessingBackup}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Скачать резервную копию
                </button>
              </div>

              {/* Import section */}
              <form onSubmit={handleImportBackup} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Импорт из резервной копии</span>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Выберите файл .tsvault:
                  </label>
                  <input
                    type="file"
                    accept=".tsvault,.enc,.txt"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Мастер-пароль от бэкапа:
                  </label>
                  <input
                    type="password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    placeholder="Пароль для расшифровки бэкапа"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingBackup || !importBase64 || !importPassword}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
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
