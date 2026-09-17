import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { vaultApi } from './services/vaultApi';
import { VaultItem, VaultStatus } from './types/vault';
import { LockScreen } from './components/LockScreen';
import { VaultSidebar } from './components/VaultSidebar';
import { VaultHeader } from './components/VaultHeader';
import { VaultItemCard } from './components/VaultItemCard';
import { ItemModal } from './components/ItemModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { SettingsModal } from './components/SettingsModal';
import { DatabaseSwitcherModal } from './components/DatabaseSwitcherModal';
import { ForgottenHintsModal, ForgottenIssue } from './components/ForgottenHintsModal';
import { Plus, KeyRound, Search, Lightbulb } from 'lucide-react';

export function App() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorCallback, setGeneratorCallback] = useState<((p: string) => void) | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDatabaseSwitcherOpen, setIsDatabaseSwitcherOpen] = useState(false);
  const [isForgottenHintsOpen, setIsForgottenHintsOpen] = useState(false);

  // Fetch status and items
  const loadVaultData = useCallback(async () => {
    try {
      const st = await vaultApi.getStatus();
      setStatus(st);
      if (st.isUnlocked) {
        const vaultItems = await vaultApi.getItems();
        setItems(vaultItems);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load vault status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  // Handle Manual Lock
  const handleLock = useCallback(async () => {
    try {
      await vaultApi.lockVault();
      setStatus((prev) => (prev ? { ...prev, isUnlocked: false } : null));
      setItems([]);
      setIsItemModalOpen(false);
      setIsSettingsOpen(false);
      setIsGeneratorOpen(false);
      setIsDatabaseSwitcherOpen(false);
      setIsForgottenHintsOpen(false);
    } catch (err) {
      console.error('Failed to lock vault:', err);
    }
  }, []);

  // Inactivity Auto-Lock & Background Lock Hooks
  useEffect(() => {
    if (!status?.isUnlocked) return;

    let lastActivity = Date.now();
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Inactivity check interval
    const interval = setInterval(() => {
      const autoLockMinutes = status.autoLockMinutes ?? 5;
      if (autoLockMinutes > 0) {
        const elapsedMinutes = (Date.now() - lastActivity) / (1000 * 60);
        if (elapsedMinutes >= autoLockMinutes) {
          handleLock();
        }
      }
    }, 5000);

    // Background / Tab hide lock
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [status?.isUnlocked, status?.autoLockMinutes, handleLock]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleLock();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && status?.isUnlocked) {
        e.preventDefault();
        setEditingItem(null);
        setIsItemModalOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && status?.isUnlocked) {
        e.preventDefault();
        setGeneratorCallback(null);
        setIsGeneratorOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status?.isUnlocked, handleLock]);

  // Calculate forgotten hints across the vault
  const forgottenIssues = useMemo<ForgottenIssue[]>(() => {
    const issues: ForgottenIssue[] = [];

    for (const it of items) {
      if (it.itemType === 'cryptoWallet') {
        const words = it.cryptoData?.words || [];
        const filledCount = words.filter((w) => w.trim().length > 0).length;
        const target = it.cryptoData?.wordCount || 12;
        const hasPk = Boolean(it.cryptoData?.privateKey?.trim());

        if (filledCount === 0 && !hasPk) {
          issues.push({
            id: `crypto_keys_${it.id}`,
            item: it,
            type: 'crypto_incomplete',
            title: it.title,
            description: `Забыли ввести Seed-слова (${target} слов) или секретный Private Key.`,
            actionText: 'Заполнить ключи',
          });
        } else if (filledCount > 0 && filledCount < target) {
          issues.push({
            id: `crypto_words_${it.id}`,
            item: it,
            type: 'crypto_incomplete',
            title: it.title,
            description: `Заполнено только ${filledCount} из ${target} Seed-слов.`,
            actionText: 'Дописать слова',
          });
        }

        if (!it.cryptoData?.address?.trim()) {
          issues.push({
            id: `crypto_addr_${it.id}`,
            item: it,
            type: 'crypto_incomplete',
            title: it.title,
            description: 'Забыли указать публичный адрес кошелька для быстрой сверки переводов.',
            actionText: 'Указать адрес',
          });
        }
      } else if (it.itemType !== 'secureNote') {
        if (!it.password || it.password.trim().length === 0) {
          issues.push({
            id: `pw_empty_${it.id}`,
            item: it,
            type: 'missing_password',
            title: it.title,
            description: 'Не указан пароль для учетной записи.',
            actionText: 'Сгенерировать',
          });
        } else if (it.password.length < 10) {
          issues.push({
            id: `pw_weak_${it.id}`,
            item: it,
            type: 'short_password',
            title: it.title,
            description: `Пароль слишком короткий (${it.password.length} симв.). Рекомендуется от 12+ символов.`,
            actionText: 'Усилить пароль',
          });
        }

        if (it.itemType === 'password' && (!it.username || it.username.trim().length === 0)) {
          issues.push({
            id: `usr_empty_${it.id}`,
            item: it,
            type: 'missing_login',
            title: it.title,
            description: 'Забыли сохранить логин, email или телефон аккаунта.',
            actionText: 'Добавить логин',
          });
        }
      }
    }

    return issues;
  }, [items]);

  // Filter and Search items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category/Type filter
      if (selectedFilter === 'favorites' && !item.favorite) return false;
      if (selectedFilter === 'type_crypto' && item.itemType !== 'cryptoWallet') return false;
      if (selectedFilter === 'type_password' && item.itemType !== 'password') return false;
      if (selectedFilter === 'type_note' && item.itemType !== 'secureNote') return false;
      if (selectedFilter === 'type_card' && item.itemType !== 'paymentCard') return false;
      if (selectedFilter.startsWith('cat_')) {
        const cat = selectedFilter.replace('cat_', '');
        if (item.category !== cat) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchUsername = item.username?.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchCryptoWords = item.cryptoData?.words.some((w) => w.toLowerCase().includes(q));
        const matchCryptoAddress = item.cryptoData?.address?.toLowerCase().includes(q);
        const matchCryptoPk = item.cryptoData?.privateKey?.toLowerCase().includes(q);
        return (
          matchTitle ||
          matchUsername ||
          matchCategory ||
          matchNotes ||
          matchTags ||
          matchCryptoWords ||
          matchCryptoAddress ||
          matchCryptoPk
        );
      }

      return true;
    });
  }, [items, selectedFilter, searchQuery]);

  // CRUD Handlers
  const handleSaveItem = async (itemToSave: VaultItem) => {
    const saved = await vaultApi.saveItem(itemToSave);
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteItem = async (id: string) => {
    await vaultApi.deleteItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleToggleFavorite = async (e: React.MouseEvent, item: VaultItem) => {
    e.stopPropagation();
    const updated = { ...item, favorite: !item.favorite };
    await handleSaveItem(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Инициализация защищенного ядра...</span>
        </div>
      </div>
    );
  }

  // Not Unlocked -> Show Lock Screen
  if (!status || !status.isUnlocked) {
    return (
      <>
        <LockScreen
          isInitialized={Boolean(status?.isInitialized)}
          currentDatabase={status?.currentDatabase || 'tsifra_vault.enc'}
          onOpenDatabaseSwitcher={() => setIsDatabaseSwitcherOpen(true)}
          onUnlocked={() => loadVaultData()}
        />
        <DatabaseSwitcherModal
          isOpen={isDatabaseSwitcherOpen}
          currentDatabase={status?.currentDatabase || 'tsifra_vault.enc'}
          onClose={() => setIsDatabaseSwitcherOpen(false)}
          onDatabaseSwitched={() => {
            loadVaultData();
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-black text-zinc-100 overflow-hidden select-none">
      {/* Sidebar */}
      <VaultSidebar
        items={items}
        selectedFilter={selectedFilter}
        currentDatabase={status.currentDatabase || 'tsifra_vault.enc'}
        onOpenDatabaseSwitcher={() => setIsDatabaseSwitcherOpen(true)}
        onSelectFilter={setSelectedFilter}
        onOpenNewItem={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        onOpenGenerator={() => {
          setGeneratorCallback(null);
          setIsGeneratorOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {/* Header */}
        <VaultHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLock={handleLock}
          currentDatabase={status.currentDatabase || 'tsifra_vault.enc'}
          onOpenDatabaseSwitcher={() => setIsDatabaseSwitcherOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          autoLockMinutes={status.autoLockMinutes}
          forgottenCount={forgottenIssues.length}
          onOpenForgottenHints={() => setIsForgottenHintsOpen(true)}
        />

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Forgotten Items Top Notification Banner (if any issues found) */}
          {forgottenIssues.length > 0 && !searchQuery && (
            <div className="mb-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs animate-scale-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-white">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-white font-medium">Ассистент сейфа:</span>
                  <span className="text-zinc-400 ml-1.5">
                    найдено {forgottenIssues.length} рекомендаций по заполнению данных и криптокошельков.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsForgottenHintsOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-[11px] transition-all cursor-pointer"
              >
                Что вы забыли
              </button>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-sm">
                {searchQuery ? <Search className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                {searchQuery ? 'Ничего не найдено' : 'В сейфе пока нет записей'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-5">
                {searchQuery
                  ? 'Попробуйте изменить поисковый запрос или сбросить фильтры'
                  : 'Добавьте свой первый пароль, мнемоническую сид-фразу кошелька или защищенную заметку.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Создать первую запись
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in">
              {filteredItems.map((item) => (
                <VaultItemCard
                  key={item.id}
                  item={item}
                  onClick={() => {
                    setEditingItem(item);
                    setIsItemModalOpen(true);
                  }}
                  onToggleFavorite={(e) => handleToggleFavorite(e, item)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Item Modal (Create / Edit) */}
      <ItemModal
        isOpen={isItemModalOpen}
        item={editingItem}
        categories={status.categories || ['Общие', 'Соцсети', 'Финансы', 'Работа', 'Личное', 'Крипта']}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        onOpenGenerator={(cb) => {
          setGeneratorCallback(() => cb);
          setIsGeneratorOpen(true);
        }}
      />

      {/* Password Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => {
          setIsGeneratorOpen(false);
          setGeneratorCallback(null);
        }}
        onSelectPassword={
          generatorCallback
            ? (pass) => {
                generatorCallback(pass);
                setIsGeneratorOpen(false);
                setGeneratorCallback(null);
              }
            : undefined
        }
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        status={status}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateStatus={loadVaultData}
        onOpenDatabaseSwitcher={() => setIsDatabaseSwitcherOpen(true)}
      />

      {/* Database Switcher Modal */}
      <DatabaseSwitcherModal
        isOpen={isDatabaseSwitcherOpen}
        currentDatabase={status.currentDatabase || 'tsifra_vault.enc'}
        onClose={() => setIsDatabaseSwitcherOpen(false)}
        onDatabaseSwitched={() => {
          loadVaultData();
        }}
      />

      {/* Forgotten Hints Modal */}
      <ForgottenHintsModal
        isOpen={isForgottenHintsOpen}
        onClose={() => setIsForgottenHintsOpen(false)}
        issues={forgottenIssues}
        onResolveIssue={(issue) => {
          setIsForgottenHintsOpen(false);
          if (issue.item) {
            setEditingItem(issue.item);
            setIsItemModalOpen(true);
          } else if (issue.type === 'backup_needed') {
            setIsSettingsOpen(true);
          }
        }}
      />
    </div>
  );
}

export default App;
