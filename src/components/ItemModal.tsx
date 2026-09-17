import React, { useState } from 'react';
import {
  X,
  Lock,
  FileText,
  CreditCard,
  Server,
  Star,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Plus,
  Sparkles,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { CustomField, VaultItem, VaultItemType, CryptoWalletData } from '../types/vault';
import { copyToClipboardSecurely } from '../utils/clipboard';
import { CryptoSeedGrid } from './CryptoSeedGrid';
import { SmartHintsBar } from './SmartHintsBar';

interface ItemModalProps {
  isOpen: boolean;
  item: VaultItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (item: VaultItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onOpenGenerator: (callback: (password: string) => void) => void;
}

const defaultCryptoData: CryptoWalletData = {
  network: 'Ethereum / EVM',
  wordCount: 12,
  words: Array(12).fill(''),
  privateKey: '',
  address: '',
  derivationPath: "m/44'/60'/0'/0/0",
  passphrase: '',
  chainId: '1',
  rpcUrl: 'https://eth.llamarpc.com',
  walletApp: 'MetaMask / Rabby',
};

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  item,
  categories,
  onClose,
  onSave,
  onDelete,
  onOpenGenerator,
}) => {
  const isNew = !item;

  const [title, setTitle] = useState(item?.title || '');
  const [itemType, setItemType] = useState<VaultItemType>(item?.itemType || 'password');
  const [category, setCategory] = useState(item?.category || (categories[0] || 'Общие'));
  const [username, setUsername] = useState(item?.username || '');
  const [password, setPassword] = useState(item?.password || '');
  const [url, setUrl] = useState(item?.url || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [favorite, setFavorite] = useState(item?.favorite || false);
  const [tagsInput, setTagsInput] = useState(item?.tags.join(', ') || '');
  const [customFields, setCustomFields] = useState<CustomField[]>(item?.customFields || []);
  const [cryptoData, setCryptoData] = useState<CryptoWalletData>(item?.cryptoData || defaultCryptoData);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state when item changes
  React.useEffect(() => {
    if (item) {
      setTitle(item.title);
      setItemType(item.itemType);
      setCategory(item.category);
      setUsername(item.username || '');
      setPassword(item.password || '');
      setUrl(item.url || '');
      setNotes(item.notes || '');
      setFavorite(item.favorite);
      setTagsInput(item.tags.join(', '));
      setCustomFields(item.customFields || []);
      setCryptoData(item.cryptoData || defaultCryptoData);
    } else {
      setTitle('');
      setItemType('password');
      setCategory(categories[0] || 'Общие');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
      setFavorite(false);
      setTagsInput('');
      setCustomFields([]);
      setCryptoData(defaultCryptoData);
    }
    setConfirmDelete(false);
  }, [item, categories]);

  if (!isOpen) return null;

  const handleCopy = async (val: string, fieldName: string) => {
    await copyToClipboardSecurely(val, 30);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddField = () => {
    setCustomFields([
      ...customFields,
      { id: 'f_' + Date.now(), label: 'Поле', value: '', isSecret: false },
    ]);
  };

  const handleUpdateField = (index: number, patch: Partial<CustomField>) => {
    const next = [...customFields];
    next[index] = { ...next[index], ...patch };
    setCustomFields(next);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const toSave: VaultItem = {
        id: item?.id || 'item_' + Date.now(),
        title: title.trim(),
        itemType,
        category,
        username: itemType !== 'secureNote' && itemType !== 'cryptoWallet' ? (username.trim() || undefined) : undefined,
        password: itemType !== 'secureNote' && itemType !== 'cryptoWallet' ? (password || undefined) : undefined,
        url: itemType === 'password' ? (url.trim() || undefined) : undefined,
        notes: notes.trim() || undefined,
        tags,
        favorite,
        customFields,
        cryptoData: itemType === 'cryptoWallet' ? cryptoData : undefined,
        createdAt: item?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await onSave(toSave);
      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative max-h-[92vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`p-2 rounded-xl border transition-all ${
                favorite
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
            <h3 className="text-base font-semibold text-white">
              {isNew ? 'Новая запись в сейфе' : 'Редактирование записи'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="vault-item-form" onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 pr-1 flex-1">
          {/* Item Type Selector */}
          <div className="grid grid-cols-5 gap-1.5 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800">
            {[
              { type: 'password', label: 'Пароль', icon: Lock },
              { type: 'cryptoWallet', label: 'Крипто', icon: Coins },
              { type: 'secureNote', label: 'Заметка', icon: FileText },
              { type: 'paymentCard', label: 'Карта', icon: CreditCard },
              { type: 'serverKey', label: 'Ключ/API', icon: Server },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setItemType(type as VaultItemType)}
                className={`py-2 px-1 text-xs font-medium rounded-lg flex flex-col items-center gap-1.5 transition-all ${
                  itemType === type
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Smart Hints Bar */}
          <SmartHintsBar
            itemType={itemType}
            title={title}
            username={username}
            password={password}
            url={url}
            notes={notes}
            tags={tagsInput.split(',').filter(Boolean)}
            cryptoData={cryptoData}
          />

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Название <span className="text-white">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={itemType === 'cryptoWallet' ? 'Например: MetaMask (Main), Ledger Cold' : 'например: Google, GitHub, Сбербанк'}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Категория
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-white cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dedicated Crypto Wallet Seed Section */}
          {itemType === 'cryptoWallet' && (
            <div className="border border-zinc-800 rounded-2xl p-4 bg-black/50 space-y-4">
              <CryptoSeedGrid
                data={cryptoData}
                onChange={(updated) => setCryptoData(updated)}
              />
            </div>
          )}

          {/* Username (if password or server key or card) */}
          {itemType !== 'secureNote' && itemType !== 'cryptoWallet' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Логин / Email / Имя пользователя
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@domain.com или login"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white text-sm pr-11"
                />
                {username && (
                  <button
                    type="button"
                    onClick={() => handleCopy(username, 'username')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white"
                    title="Скопировать логин"
                  >
                    {copiedField === 'username' ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Password (if password or card or serverKey) */}
          {itemType !== 'secureNote' && itemType !== 'cryptoWallet' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-zinc-300">
                  {itemType === 'paymentCard' ? 'CVV / PIN' : 'Пароль'}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onOpenGenerator((newPass) => {
                      setPassword(newPass);
                    })
                  }
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Сгенерировать
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Секретный пароль"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono text-sm pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-zinc-400 hover:text-white"
                    title={showPassword ? 'Скрыть' : 'Показать'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {password && (
                    <button
                      type="button"
                      onClick={() => handleCopy(password, 'password')}
                      className="p-1.5 text-zinc-400 hover:text-white"
                      title="Скопировать пароль"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* URL */}
          {itemType === 'password' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Веб-сайт / URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white text-sm pr-11"
                />
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white"
                    title="Перейти по ссылке"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Secure Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              {itemType === 'cryptoWallet' ? 'Заметки к кошельку' : 'Защищенная заметка / Описание'}
            </label>
            <textarea
              rows={itemType === 'secureNote' ? 7 : 3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительные секретные данные, пин-коды, подсказки..."
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white text-sm font-mono resize-y"
            />
          </div>

          {/* Custom Fields */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-zinc-300">
                Дополнительные поля
              </label>
              <button
                type="button"
                onClick={handleAddField}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Добавить поле
              </button>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-2">
                {customFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800"
                  >
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                      placeholder="Название"
                      className="w-1/3 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700/70 rounded-lg text-xs text-white"
                    />
                    <input
                      type={field.isSecret ? 'password' : 'text'}
                      value={field.value}
                      onChange={(e) => handleUpdateField(idx, { value: e.target.value })}
                      placeholder="Значение"
                      className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700/70 rounded-lg text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateField(idx, { isSecret: !field.isSecret })}
                      className={`p-1.5 rounded-lg border text-xs ${
                        field.isSecret
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                      title={field.isSecret ? 'Скрытое поле' : 'Открытое поле'}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="p-1.5 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Теги (через запятую)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="работа, почта, крипта, ledger"
              className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-white"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            {!isNew && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Удалить?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-600 text-white rounded-lg text-xs hover:bg-zinc-800 font-medium"
                  >
                    Да, удалить
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="vault-item-form"
              disabled={isSaving || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all disabled:opacity-40"
            >
              {isSaving ? 'Сохранение...' : isNew ? 'Создать запись' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
