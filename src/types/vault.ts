export type VaultItemType = 'password' | 'secureNote' | 'paymentCard' | 'serverKey' | 'document';

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

export interface VaultStatus {
  isInitialized: boolean;
  isUnlocked: boolean;
  itemCount: number;
  categories: string[];
  autoLockMinutes: number;
  biometricsEnabled: boolean;
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
