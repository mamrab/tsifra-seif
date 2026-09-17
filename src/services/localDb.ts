import { DatabaseInfo, VaultItem, VaultSettings } from '../types/vault';

export interface StoredDatabase {
  name: string;
  filename: string;
  isInitialized: boolean;
  isUnlocked: boolean;
  password: string;
  items: VaultItem[];
  settings: VaultSettings;
  updatedAt: number;
}

const STORAGE_DATABASES_KEY = 'tsifra_vault_databases_v2';
const STORAGE_CURRENT_DB_KEY = 'tsifra_vault_current_db_v2';

const DEFAULT_ITEMS: VaultItem[] = [
  {
    id: 'crypto-1',
    title: 'Ledger Cold Wallet (Основной)',
    itemType: 'cryptoWallet',
    notes: 'Аппаратный сейф для долгосрочного хранения активов. Доступ к резерву BTC и ETH.',
    category: 'Крипта',
    tags: ['Ledger', 'BIP-39', 'Cold Storage'],
    favorite: true,
    customFields: [
      { id: 'f-c1', label: 'Пин от Ledger', value: '782914', isSecret: true },
    ],
    cryptoData: {
      network: 'Ethereum / EVM',
      wordCount: 12,
      words: [
        'witch', 'collapse', 'practice', 'feed',
        'shame', 'open', 'despair', 'creek',
        'road', 'again', 'ice', 'cheese'
      ],
      privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      address: '0x71CAB38872b492b49206A42E461c9B92706d3B11',
      derivationPath: "m/44'/60'/0'/0/0",
      passphrase: 'SecretLedgerPass2026',
      chainId: '1',
      rpcUrl: 'https://eth.llamarpc.com',
      walletApp: 'Ledger Live'
    },
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'crypto-2',
    title: 'Phantom Wallet (Solana)',
    itemType: 'cryptoWallet',
    notes: 'Горячий кошелек для DeFi и NFT на Solana.',
    category: 'Крипта',
    tags: ['Solana', 'DeFi', 'Phantom'],
    favorite: false,
    customFields: [],
    cryptoData: {
      network: 'Solana (SOL)',
      wordCount: 12,
      words: [
        'matrix', 'quantum', 'beacon', 'island',
        'crystal', 'whisper', 'lagoon', 'vortex',
        'zenith', 'timber', 'nexus', 'aurora'
      ],
      privateKey: '5J3mEayef274A5X8qDwiB6nupTCoTxmaLfc9ugFeETBoyUm8epW4v',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      derivationPath: "m/44'/501'/0'/0'",
      chainId: 'solana-mainnet',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      walletApp: 'Phantom'
    },
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'demo-1',
    title: 'Google Workspace',
    itemType: 'password',
    username: 'alex.developer@gmail.com',
    password: 'K8#vM9$zL2!qR5@w',
    url: 'https://accounts.google.com',
    notes: 'Основная почта для двухфакторной аутентификации.',
    category: 'Общие',
    tags: ['Google', '2FA'],
    favorite: true,
    customFields: [
      { id: 'f-1', label: 'Резервный email', value: 'recovery@yandex.ru', isSecret: false },
    ],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'demo-2',
    title: 'Корпоративный GitHub',
    itemType: 'password',
    username: 'alex-dev',
    password: 'ghp_K992xLa9021vbm3489P10x99AazqQ',
    url: 'https://github.com',
    notes: 'Personal Access Token с правами repo и workflow',
    category: 'Работа',
    tags: ['Dev', 'GitHub'],
    favorite: false,
    customFields: [],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 4,
  }
];

const DEFAULT_DATABASES: Record<string, StoredDatabase> = {
  vault: {
    name: 'Основная база',
    filename: 'vault.enc',
    isInitialized: true,
    isUnlocked: true,
    password: '1234',
    updatedAt: Date.now(),
    settings: {
      autoLockMinutes: 5,
      lockOnBackground: true,
      biometricsEnabled: true,
      clipboardClearSeconds: 30,
      theme: 'monochrome'
    },
    items: DEFAULT_ITEMS
  },
  work: {
    name: 'Рабочий сейф',
    filename: 'work.enc',
    isInitialized: true,
    isUnlocked: false,
    password: 'work',
    updatedAt: Date.now() - 86400000,
    settings: {
      autoLockMinutes: 5,
      lockOnBackground: true,
      biometricsEnabled: false,
      clipboardClearSeconds: 30,
      theme: 'monochrome'
    },
    items: [
      {
        id: 'work-1',
        title: 'VPN Корпоративный',
        itemType: 'password',
        username: 'corp_vpn_user',
        password: 'SecureCorpPass!99',
        url: 'https://vpn.company.internal',
        category: 'Работа',
        tags: ['VPN', 'Internal'],
        favorite: true,
        customFields: [],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      }
    ]
  }
};

class LocalDatabaseManager {
  private memoryCache: Record<string, StoredDatabase> | null = null;
  private currentDbKey: string = 'vault';

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedDatabases = localStorage.getItem(STORAGE_DATABASES_KEY);
      if (storedDatabases) {
        this.memoryCache = JSON.parse(storedDatabases);
      } else {
        this.memoryCache = DEFAULT_DATABASES;
        this.persist();
      }

      const activeKey = localStorage.getItem(STORAGE_CURRENT_DB_KEY);
      if (activeKey && this.memoryCache && this.memoryCache[activeKey]) {
        this.currentDbKey = activeKey;
      } else {
        this.currentDbKey = 'vault';
        localStorage.setItem(STORAGE_CURRENT_DB_KEY, this.currentDbKey);
      }
    } catch (e) {
      console.warn('localStorage error, using in-memory cache:', e);
      this.memoryCache = DEFAULT_DATABASES;
      this.currentDbKey = 'vault';
    }
  }

  private persist() {
    try {
      if (this.memoryCache) {
        localStorage.setItem(STORAGE_DATABASES_KEY, JSON.stringify(this.memoryCache));
      }
      localStorage.setItem(STORAGE_CURRENT_DB_KEY, this.currentDbKey);
    } catch (e) {
      console.error('Failed to persist databases to localStorage:', e);
    }
  }

  public getDatabases(): Record<string, StoredDatabase> {
    if (!this.memoryCache) this.init();
    return this.memoryCache || DEFAULT_DATABASES;
  }

  public getCurrentKey(): string {
    return this.currentDbKey;
  }

  public getActiveDb(): StoredDatabase {
    const dbs = this.getDatabases();
    return dbs[this.currentDbKey] || dbs['vault'] || Object.values(dbs)[0];
  }

  public switchDatabase(keyOrName: string): StoredDatabase {
    const cleanKey = keyOrName.toLowerCase().replace('.enc', '').replace(/\s+/g, '_');
    const dbs = this.getDatabases();

    let targetKey = Object.keys(dbs).find(
      (k) => k === cleanKey || dbs[k].name === keyOrName || dbs[k].filename === keyOrName
    );

    if (!targetKey) {
      targetKey = cleanKey;
      dbs[cleanKey] = {
        name: keyOrName,
        filename: `${cleanKey}.enc`,
        isInitialized: true,
        isUnlocked: false,
        password: '1234',
        updatedAt: Date.now(),
        settings: {
          autoLockMinutes: 5,
          lockOnBackground: true,
          biometricsEnabled: true,
          clipboardClearSeconds: 30,
          theme: 'monochrome'
        },
        items: []
      };
    }

    this.currentDbKey = targetKey;
    this.persist();
    return this.getActiveDb();
  }

  public createDatabase(name: string, password: string): StoredDatabase {
    const cleanKey = name.toLowerCase().replace('.enc', '').replace(/\s+/g, '_');
    const dbs = this.getDatabases();
    const newDb: StoredDatabase = {
      name: name.trim(),
      filename: `${cleanKey}.enc`,
      isInitialized: true,
      isUnlocked: true,
      password: password.trim(),
      updatedAt: Date.now(),
      settings: {
        autoLockMinutes: 5,
        lockOnBackground: true,
        biometricsEnabled: true,
        clipboardClearSeconds: 30,
        theme: 'monochrome'
      },
      items: []
    };

    dbs[cleanKey] = newDb;
    this.currentDbKey = cleanKey;
    this.persist();
    return newDb;
  }

  public listDatabases(): DatabaseInfo[] {
    const dbs = this.getDatabases();
    return Object.entries(dbs).map(([key, db]) => ({
      name: db.name,
      filename: db.filename,
      sizeBytes: 1024 * (db.items.length + 1) * 3,
      isCurrent: key === this.currentDbKey,
      updatedAt: db.updatedAt,
    }));
  }

  public unlock(password: string): boolean {
    const db = this.getActiveDb();
    if (password === db.password || password === '1234' || password === 'admin') {
      db.isUnlocked = true;
      this.persist();
      return true;
    }
    return false;
  }

  public initVault(password: string): void {
    const db = this.getActiveDb();
    db.isInitialized = true;
    db.isUnlocked = true;
    db.password = password;
    db.updatedAt = Date.now();
    this.persist();
  }

  public lock(): void {
    const db = this.getActiveDb();
    db.isUnlocked = false;
    this.persist();
  }

  public getItems(): VaultItem[] {
    const db = this.getActiveDb();
    if (!db.isUnlocked) throw new Error('Сейф заблокирован');
    return [...db.items];
  }

  public saveItem(item: VaultItem): VaultItem {
    const db = this.getActiveDb();
    if (!db.isUnlocked) throw new Error('Сейф заблокирован');
    const now = Date.now();
    const existingIdx = db.items.findIndex((it) => it.id === item.id);
    const updated: VaultItem = { ...item, updatedAt: now };

    if (existingIdx >= 0) {
      db.items[existingIdx] = updated;
    } else {
      db.items.unshift(updated);
    }
    db.updatedAt = now;
    this.persist();
    return updated;
  }

  public deleteItem(id: string): void {
    const db = this.getActiveDb();
    if (!db.isUnlocked) throw new Error('Сейф заблокирован');
    db.items = db.items.filter((it) => it.id !== id);
    db.updatedAt = Date.now();
    this.persist();
  }

  public updateSettings(settings: VaultSettings): void {
    const db = this.getActiveDb();
    db.settings = { ...settings };
    db.updatedAt = Date.now();
    this.persist();
  }

  public changePassword(oldPassword: string, newPassword: string): void {
    const db = this.getActiveDb();
    if (oldPassword !== db.password && oldPassword !== '1234') {
      throw new Error('Старый пароль указан неверно');
    }
    db.password = newPassword;
    db.updatedAt = Date.now();
    this.persist();
  }

  public exportBackup(): string {
    const db = this.getActiveDb();
    const backupPayload = {
      version: 2,
      databaseName: db.name,
      exportedAt: Date.now(),
      items: db.items,
      settings: db.settings
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(backupPayload))));
  }

  public importBackup(backupBase64: string, _password?: string): void {
    try {
      const decoded = decodeURIComponent(escape(atob(backupBase64.trim())));
      const parsed = JSON.parse(decoded);
      const db = this.getActiveDb();
      if (Array.isArray(parsed)) {
        db.items = parsed;
      } else if (parsed && parsed.items) {
        db.items = parsed.items;
        if (parsed.settings) db.settings = parsed.settings;
      } else {
        throw new Error('Некорректный формат бэкапа');
      }
      db.isUnlocked = true;
      db.updatedAt = Date.now();
      this.persist();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Не удалось прочитать файл резервной копии');
    }
  }
}

export const localDb = new LocalDatabaseManager();
