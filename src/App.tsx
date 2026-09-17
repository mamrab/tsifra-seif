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
import { Plus, KeyRound, Search } from 'lucide-react';

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

  // Filter and Search items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category/Type filter
      if (selectedFilter === 'favorites' && !item.favorite) return false;
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
        return matchTitle || matchUsername || matchCategory || matchNotes || matchTags;
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
      <div className="min-h-screen w-full flex items-center justify-center bg-[#07090e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Инициализация защищенного ядра...</span>
        </div>
      </div>
    );
  }

  // Not Unlocked -> Show Lock Screen
  if (!status || !status.isUnlocked) {
    return (
      <LockScreen
        isInitialized={Boolean(status?.isInitialized)}
        onUnlocked={() => loadVaultData()}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#090d16] text-slate-100 overflow-hidden select-none">
      {/* Sidebar */}
      <VaultSidebar
        items={items}
        selectedFilter={selectedFilter}
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
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f19]">
        {/* Header */}
        <VaultHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLock={handleLock}
          onOpenSettings={() => setIsSettingsOpen(true)}
          autoLockMinutes={status.autoLockMinutes}
        />

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
                {searchQuery ? <Search className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                {searchQuery ? 'Ничего не найдено' : 'В сейфе пока нет записей'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-5">
                {searchQuery
                  ? 'Попробуйте изменить поисковый запрос или сбросить фильтры'
                  : 'Добавьте свой первый пароль, защищенную заметку или ключ доступа в зашифрованное хранилище.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Создать первую запись
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        categories={status.categories || ['Общие', 'Соцсети', 'Финансы', 'Работа', 'Личное']}
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
      />
    </div>
  );
}

export default App;
