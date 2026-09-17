import { invoke } from '@tauri-apps/api/core';
import { GeneratedSecret, GeneratorConfig, VaultItem, VaultSettings, VaultStatus } from '../types/vault';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Fallback in-memory storage for web browser preview when not inside Tauri desktop/mobile runner
let mockInitialized = false;
let mockUnlocked = false;
let mockPassword = '';
let mockItems: VaultItem[] = [
  {
    id: 'demo-1',
    title: 'Основной Google Аккаунт',
    itemType: 'password',
    username: 'alex.developer@gmail.com',
    password: 'G8#vK9$zL2!qR5@w',
    url: 'https://accounts.google.com',
    notes: 'Основная почта для двухфакторной аутентификации и рабочих сервисов.',
    category: 'Общие',
    tags: ['Google', 'Почта', '2FA'],
    favorite: true,
    customFields: [
      { id: 'f-1', label: 'Резервный email', value: 'recovery@yandex.ru', isSecret: false },
      { id: 'f-2', label: 'Кодовое слово', value: 'СеверныйВетер2026', isSecret: true },
    ],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'demo-2',
    title: 'Крипто-кошелек Seed Phrase',
    itemType: 'secureNote',
    notes: 'witch collapse practice feed shame open despair creek road again ice cheese\n\nНикому не передавать этот сид! Аппаратный Ledger.',
    category: 'Финансы',
    tags: ['Crypto', 'Ledger', 'Seed'],
    favorite: true,
    customFields: [],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'demo-3',
    title: 'Корпоративный GitHub',
    itemType: 'password',
    username: 'alex-dev',
    password: 'ghp_K992xLa9021vbm3489P10x99AazqQ',
    url: 'https://github.com',
    notes: 'Personal Access Token с правами repo и read:packages',
    category: 'Работа',
    tags: ['Dev', 'GitHub', 'Token'],
    favorite: false,
    customFields: [],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 4,
  }
];

let mockSettings: VaultSettings = {
  autoLockMinutes: 5,
  lockOnBackground: true,
  biometricsEnabled: true,
  clipboardClearSeconds: 30,
  theme: 'dark'
};

export const vaultApi = {
  isNative(): boolean {
    return isTauri;
  },

  async getStatus(): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('get_vault_status');
    }
    return {
      isInitialized: mockInitialized,
      isUnlocked: mockUnlocked,
      itemCount: mockUnlocked ? mockItems.length : 0,
      categories: ['Общие', 'Соцсети', 'Финансы', 'Работа', 'Личное'],
      autoLockMinutes: mockSettings.autoLockMinutes,
      biometricsEnabled: mockSettings.biometricsEnabled,
      lastModified: Date.now(),
    };
  },

  async initVault(password: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('init_vault', { password });
    }
    mockInitialized = true;
    mockUnlocked = true;
    mockPassword = password;
    return this.getStatus();
  },

  async unlockVault(password: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('unlock_vault', { password });
    }
    if (password === mockPassword || password === '1234' || password === 'admin') {
      mockUnlocked = true;
      return this.getStatus();
    }
    throw new Error('Неверный пароль или PIN');
  },

  async lockVault(): Promise<void> {
    if (isTauri) {
      await invoke('lock_vault');
      return;
    }
    mockUnlocked = false;
  },

  async getItems(): Promise<VaultItem[]> {
    if (isTauri) {
      return await invoke<VaultItem[]>('get_vault_items');
    }
    if (!mockUnlocked) throw new Error('Сейф заблокирован');
    return [...mockItems];
  },

  async saveItem(item: VaultItem): Promise<VaultItem> {
    if (isTauri) {
      return await invoke<VaultItem>('save_vault_item', { item });
    }
    if (!mockUnlocked) throw new Error('Сейф заблокирован');
    const existingIndex = mockItems.findIndex((it) => it.id === item.id);
    const now = Date.now();
    const updated = { ...item, updatedAt: now };
    if (existingIndex >= 0) {
      mockItems[existingIndex] = updated;
    } else {
      mockItems.push(updated);
    }
    return updated;
  },

  async deleteItem(id: string): Promise<void> {
    if (isTauri) {
      await invoke('delete_vault_item', { id });
      return;
    }
    if (!mockUnlocked) throw new Error('Сейф заблокирован');
    mockItems = mockItems.filter((it) => it.id !== id);
  },

  async updateSettings(settings: VaultSettings): Promise<void> {
    if (isTauri) {
      await invoke('update_vault_settings', { settings });
      return;
    }
    mockSettings = { ...settings };
  },

  async generatePassword(config: GeneratorConfig): Promise<GeneratedSecret> {
    if (isTauri) {
      return await invoke<GeneratedSecret>('generate_password', { config });
    }
    // Web fallback calculation
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let res = '';
    for (let i = 0; i < config.length; i++) {
      res += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const entropy = Math.round(config.length * Math.log2(charset.length) * 10) / 10;
    return {
      value: res,
      entropy,
      strengthLevel: entropy > 70 ? 'excellent' : 'strong',
      score: 4,
    };
  },

  async exportBackup(): Promise<string> {
    if (isTauri) {
      return await invoke<string>('export_vault_backup');
    }
    return btoa(JSON.stringify(mockItems));
  },

  async importBackup(backupBase64: string, password: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('import_vault_backup', {
        backupBase64,
        password,
      });
    }
    try {
      const decoded = atob(backupBase64);
      mockItems = JSON.parse(decoded);
      mockUnlocked = true;
      return this.getStatus();
    } catch {
      throw new Error('Не удалось прочитать файл резервной копии');
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (isTauri) {
      await invoke('change_vault_password', { oldPassword, newPassword });
      return;
    }
    if (oldPassword !== mockPassword && oldPassword !== '1234') {
      throw new Error('Старый пароль указан неверно');
    }
    mockPassword = newPassword;
  },
};
