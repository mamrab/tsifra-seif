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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Локальные базы данных</h3>
              <p className="text-[11px] text-zinc-400">Изолированные зашифрованные файлы сейфа</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center gap-2 text-xs text-zinc-300">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Database List */}
        {!isCreating ? (
          <div className="py-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Доступные локальные сейфы:</span>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="text-white hover:text-zinc-300 flex items-center gap-1 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Новая база данных
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {databases.map((db) => {
                const isActive = db.isCurrent || (currentDatabase && (db.name === currentDatabase || db.filename === currentDatabase));
                return (
                  <div
                    key={db.filename}
                    onClick={() => !isActive && handleSwitch(db.name)}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between select-none ${
                      isActive
                        ? 'bg-zinc-900 border-white text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900/60 hover:border-zinc-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-zinc-300">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{db.name}</span>
                          {isActive && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold">
                              Активна
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 mt-0.5">
                          <span>{db.filename}</span>
                          <span>•</span>
                          <span>{formatBytes(db.sizeBytes)}</span>
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <div className="text-xs text-zinc-400 flex items-center gap-1">
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
          <form onSubmit={handleCreate} className="py-4 space-y-3.5 animate-slide-up">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Название новой базы данных
              </label>
              <input
                type="text"
                required
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                placeholder="напр. Работа, Крипто-сейф, Личное"
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Мастер-пароль для этой базы
              </label>
              <input
                type="password"
                required
                value={newDbPassword}
                onChange={(e) => setNewDbPassword(e.target.value)}
                placeholder="Секретный пароль или PIN"
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              Будет создан независимый зашифрованный файл <b>{newDbName ? `${newDbName.toLowerCase().replace(/\s+/g, '_')}.enc` : '*.enc'}</b> с собственным мастер-ключом.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300"
              >
                Назад
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold"
              >
                {loading ? 'Создание...' : 'Создать базу данных'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Хранение: локальная директория приложения</span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
