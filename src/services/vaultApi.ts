import { invoke } from '@tauri-apps/api/core';
import { DatabaseInfo, GeneratedSecret, GeneratorConfig, VaultItem, VaultSettings, VaultStatus } from '../types/vault';
import { localDb } from './localDb';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const PASSPHRASE_WORDS = [
  'anchor', 'beacon', 'citadel', 'delta', 'ember', 'falcon', 'glacier', 'harbor', 'island',
  'jungle', 'karma', 'lagoon', 'matrix', 'nexus', 'orbit', 'phoenix', 'quantum', 'radar',
  'shadow', 'timber', 'ultra', 'vortex', 'whisper', 'zenith', 'crystal', 'shield', 'cipher',
  'aurora', 'comet', 'nebula', 'pulsar', 'quasar', 'stellar', 'titan', 'voyage', 'zen',
  'albatross', 'breeze', 'cascade', 'dune', 'echo', 'frost', 'granite', 'horizon', 'infinity',
  'journey', 'keystone', 'lunar', 'mirage', 'nomad', 'oasis', 'pinnacle', 'quartz', 'rift',
  'summit', 'tundra', 'uranium', 'velocity', 'wave', 'apex', 'blizzard', 'canyon', 'drift',
  'element', 'forge', 'gravity', 'halo', 'iron', 'jupiter', 'kinetic', 'lightning', 'meteor',
  'neutron', 'obsidian', 'plasma', 'quest', 'radiant', 'strata', 'thunder', 'unity', 'vector'
];

function generateSecretLocal(config: GeneratorConfig): GeneratedSecret {
  const getRandom = (max: number) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return arr[0] % max;
    }
    return Math.floor(Math.random() * max);
  };

  if (config.mode === 'pin') {
    const len = Math.max(4, Math.min(16, config.length || 6));
    const digits = '0123456789';
    let val = '';
    for (let i = 0; i < len; i++) {
      val += digits[getRandom(digits.length)];
    }
    const entropy = Math.round(len * Math.log2(10) * 10) / 10;
    const score = entropy < 25 ? 1 : entropy < 40 ? 2 : 3;
    const strengthLevel = entropy < 25 ? 'weak' : entropy < 40 ? 'fair' : 'good';
    return { value: val, entropy, strengthLevel, score };
  }

  if (config.mode === 'passphrase') {
    const count = Math.max(3, Math.min(10, config.wordCount || 4));
    const sep = config.separator !== undefined ? config.separator : '-';
    const chosen: string[] = [];
    for (let i = 0; i < count; i++) {
      chosen.push(PASSPHRASE_WORDS[getRandom(PASSPHRASE_WORDS.length)]);
    }
    const val = chosen.join(sep);
    const entropy = Math.round(count * Math.log2(PASSPHRASE_WORDS.length) * 10) / 10;
    let score = 3;
    let strengthLevel: GeneratedSecret['strengthLevel'] = 'strong';
    if (entropy < 40) { score = 2; strengthLevel = 'fair'; }
    else if (entropy >= 80) { score = 4; strengthLevel = 'excellent'; }
    return { value: val, entropy, strengthLevel, score };
  }

  // Password mode
  const len = Math.max(6, Math.min(64, config.length || 16));
  const upperPool = config.excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerPool = config.excludeAmbiguous ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  const digitPool = config.excludeAmbiguous ? '23456789' : '0123456789';
  const symbolPool = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  let pool = '';
  const requiredChars: string[] = [];

  if (config.includeLowercase) {
    pool += lowerPool;
    requiredChars.push(lowerPool[getRandom(lowerPool.length)]);
  }
  if (config.includeUppercase) {
    pool += upperPool;
    requiredChars.push(upperPool[getRandom(upperPool.length)]);
  }
  if (config.includeDigits) {
    pool += digitPool;
    requiredChars.push(digitPool[getRandom(digitPool.length)]);
  }
  if (config.includeSymbols) {
    pool += symbolPool;
    requiredChars.push(symbolPool[getRandom(symbolPool.length)]);
  }

  // Fallback if none selected
  if (!pool) {
    pool = lowerPool + digitPool;
    requiredChars.push(lowerPool[getRandom(lowerPool.length)]);
    requiredChars.push(digitPool[getRandom(digitPool.length)]);
  }

  const chars: string[] = [...requiredChars];
  while (chars.length < len) {
    chars.push(pool[getRandom(pool.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getRandom(i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  const val = chars.join('');
  const poolSize = pool.length;
  const entropy = Math.round(len * Math.log2(poolSize) * 10) / 10;

  let score = 3;
  let strengthLevel: GeneratedSecret['strengthLevel'] = 'strong';
  if (entropy < 30) {
    score = 0;
    strengthLevel = 'weak';
  } else if (entropy < 50) {
    score = 1;
    strengthLevel = 'fair';
  } else if (entropy < 70) {
    score = 2;
    strengthLevel = 'good';
  } else if (entropy < 90) {
    score = 3;
    strengthLevel = 'strong';
  } else {
    score = 4;
    strengthLevel = 'excellent';
  }

  return { value: val, entropy, strengthLevel, score };
}

export const vaultApi = {
  isNative(): boolean {
    return isTauri;
  },

  async getStatus(): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('get_vault_status');
    }
    const current = localDb.getActiveDb();
    return {
      isInitialized: current.isInitialized,
      isUnlocked: current.isUnlocked,
      itemCount: current.isUnlocked ? current.items.length : 0,
      categories: ['Общие', 'Крипта', 'Финансы', 'Работа', 'Соцсети', 'Личное'],
      autoLockMinutes: current.settings.autoLockMinutes,
      biometricsEnabled: current.settings.biometricsEnabled,
      currentDatabase: current.name,
      lastModified: current.updatedAt,
    };
  },

  async initVault(password: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('init_vault', { password });
    }
    localDb.initVault(password);
    return this.getStatus();
  },

  async unlockVault(password: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('unlock_vault', { password });
    }
    const success = localDb.unlock(password);
    if (!success) {
      throw new Error('Неверный пароль или PIN');
    }
    return this.getStatus();
  },

  async lockVault(): Promise<void> {
    if (isTauri) {
      await invoke('lock_vault');
      return;
    }
    localDb.lock();
  },

  async resetVault(newPassword?: string): Promise<void> {
    if (!isTauri) {
      localDb.resetActiveDb(newPassword);
    }
  },

  async getItems(): Promise<VaultItem[]> {
    if (isTauri) {
      return await invoke<VaultItem[]>('get_vault_items');
    }
    return localDb.getItems();
  },

  async saveItem(item: VaultItem): Promise<VaultItem> {
    if (isTauri) {
      return await invoke<VaultItem>('save_vault_item', { item });
    }
    return localDb.saveItem(item);
  },

  async deleteItem(id: string): Promise<void> {
    if (isTauri) {
      await invoke('delete_vault_item', { id });
      return;
    }
    localDb.deleteItem(id);
  },

  async updateSettings(settings: VaultSettings): Promise<void> {
    if (isTauri) {
      await invoke('update_vault_settings', { settings });
      return;
    }
    localDb.updateSettings(settings);
  },

  async generatePassword(config: GeneratorConfig): Promise<GeneratedSecret> {
    if (isTauri) {
      try {
        return await invoke<GeneratedSecret>('generate_password', { config });
      } catch (err) {
        console.warn('Native generate_password failed, using client fallback:', err);
      }
    }
    return generateSecretLocal(config);
  },

  async exportBackup(): Promise<string> {
    if (isTauri) {
      return await invoke<string>('export_vault_backup');
    }
    return localDb.exportBackup();
  },

  async importBackup(backupBase64: string, password: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('import_vault_backup', {
        backupBase64,
        password,
      });
    }
    localDb.importBackup(backupBase64, password);
    return this.getStatus();
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (isTauri) {
      await invoke('change_vault_password', { oldPassword, newPassword });
      return;
    }
    localDb.changePassword(oldPassword, newPassword);
  },

  async listDatabases(): Promise<DatabaseInfo[]> {
    if (isTauri) {
      return await invoke<DatabaseInfo[]>('list_local_databases');
    }
    return localDb.listDatabases();
  },

  async switchDatabase(name: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('switch_local_database', { name });
    }
    localDb.switchDatabase(name);
    return this.getStatus();
  },

  async createDatabase(name: string, password: string): Promise<VaultStatus> {
    if (isTauri) {
      return await invoke<VaultStatus>('create_local_database', { name, password });
    }
    localDb.createDatabase(name, password);
    return this.getStatus();
  }
};
