import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Check,
  Plus,
  HardDrive,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { DatabaseInfo } from '../types/vault';
import { vaultApi } from '../services/vaultApi';

interface DatabaseSwitcherModalProps {
  isOpen: boolean;
  currentDatabase?: string;
  onClose: () => void;
  onDatabaseSwitched: () => void | Promise<void>;
}

export const DatabaseSwitcherModal: React.FC<DatabaseSwitcherModalProps> = ({
  isOpen,
  currentDatabase,
  onClose,
  onDatabaseSwitched,
}) => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newDbPassword, setNewDbPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDatabases = async () => {
    try {
      const list = await vaultApi.listDatabases();
      setDatabases(list);
    } catch (err) {
      console.error('Failed to list databases:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDatabases();
      setIsCreating(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitch = async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      await vaultApi.switchDatabase(name);
      await onDatabaseSwitched();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка переключения базы');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim() || !newDbPassword.trim()) {
      setError('Укажите имя базы данных и мастер-пароль');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await vaultApi.createDatabase(newDbName.trim(), newDbPassword.trim());
      await onDatabaseSwitched();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания базы данных');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
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
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Локальные базы данных</h3>
              <p className="text-[11px] text-white/50">Изолированные зашифрованные файлы сейфа</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Database List */}
        {!isCreating ? (
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60 px-1">
              <span>Доступные локальные сейфы:</span>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Новая база данных
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {databases.map((db) => {
                const isActive =
                  db.isCurrent ||
                  (currentDatabase && (db.name === currentDatabase || db.filename === currentDatabase));
                return (
                  <div
                    key={db.filename}
                    onClick={() => !isActive && handleSwitch(db.name)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between select-none ${
                      isActive
                        ? 'bg-white/[0.12] border-cyan-400/50 text-white shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/20 cursor-pointer active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-white/70 flex-shrink-0">
                        <HardDrive className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{db.name}</span>
                          {isActive && (
                            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-400 text-black font-extrabold shadow-sm">
                              Активна
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-white/40 mt-0.5">
                          <span className="truncate">{db.filename}</span>
                          <span>•</span>
                          <span>{formatBytes(db.sizeBytes)}</span>
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 ml-2" />
                    ) : (
                      <div className="text-xs text-white/50 flex items-center gap-1 flex-shrink-0 ml-2">
                        <span>Переключить</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Create New Local DB Form */
          <form onSubmit={handleCreate} className="py-4 space-y-3.5 animate-scale-in">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Название новой базы данных
              </label>
              <input
                type="text"
                required
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                placeholder="напр. Работа, Крипто-сейф, Личное"
                className="w-full px-4 py-2.5 liquid-input rounded-2xl text-xs text-white placeholder-white/30"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Мастер-пароль для этой базы
              </label>
              <input
                type="password"
                required
                value={newDbPassword}
                onChange={(e) => setNewDbPassword(e.target.value)}
                placeholder="Секретный пароль или PIN"
                className="w-full px-4 py-2.5 liquid-input rounded-2xl text-xs font-mono text-white placeholder-white/30"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-white/60 leading-relaxed">
              Будет создан независимый зашифрованный файл{' '}
              <strong className="text-cyan-300 font-mono">
                {newDbName ? `${newDbName.toLowerCase().replace(/\s+/g, '_')}.enc` : '*.enc'}
              </strong>{' '}
              с собственным изолированным мастер-ключом.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-2xl apple-btn-glass text-xs text-white/70 hover:text-white cursor-pointer"
              >
                Назад
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-2xl apple-btn-primary text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                {loading ? 'Создание...' : 'Создать базу данных'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/40">
          <span>Хранение: изолированная локальная директория</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
