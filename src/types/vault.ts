export type VaultItemType =
  | 'password'
  | 'secureNote'
  | 'paymentCard'
  | 'serverKey'
  | 'document'
  | 'cryptoWallet';

export interface CryptoWalletData {
  network: string; // e.g. "Bitcoin", "Ethereum (EVM)", "Solana", "TON", "Tron", "Cosmos"
  wordCount: 12 | 18 | 24;
  words: string[];
  privateKey?: string; // Hex, Base58 or raw secret key
  address?: string;
  derivationPath?: string;
  passphrase?: string; // 25th word / secret passphrase
  rpcUrl?: string; // Custom RPC Endpoint
  chainId?: string; // Network Chain ID
  walletApp?: string; // MetaMask, Phantom, Ledger, etc.
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret: boolean;
}

export interface VaultItem {
  id: string;
  title: string;
  itemType: VaultItemType;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  category: string;
  tags: string[];
  favorite: boolean;
  customFields: CustomField[];
  cryptoData?: CryptoWalletData;
  createdAt: number;
  updatedAt: number;
}

export interface VaultSettings {
  autoLockMinutes: number;
  lockOnBackground: boolean;
  biometricsEnabled: boolean;
  clipboardClearSeconds: number;
  theme: string;
}

export interface DatabaseInfo {
  name: string;
  filename: string;
  sizeBytes: number;
  isCurrent: boolean;
  updatedAt: number;
}

export interface VaultStatus {
  isInitialized: boolean;
  isUnlocked: boolean;
  itemCount: number;
  categories: string[];
  autoLockMinutes: number;
  biometricsEnabled: boolean;
  currentDatabase: string;
  lastModified?: number;
}

export interface GeneratorConfig {
  mode: 'password' | 'passphrase' | 'pin';
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
  wordCount: number;
  separator: string;
}

export interface GeneratedSecret {
  value: string;
  entropy: number;
  strengthLevel: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  score: number;
}
