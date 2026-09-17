import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Clipboard,
  Check,
  Globe,
  Key,
  Settings,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CryptoWalletData } from '../types/vault';
import { copyToClipboardSecurely } from '../utils/clipboard';

interface CryptoSeedGridProps {
  data: CryptoWalletData;
  onChange: (updated: CryptoWalletData) => void;
  isReadOnly?: boolean;
}

interface NetworkPreset {
  name: string;
  defaultPath: string;
  chainId: string;
  defaultRpc: string;
  defaultApp: string;
}

const NETWORK_PRESETS: Record<string, NetworkPreset> = {
  'Ethereum / EVM': {
    name: 'Ethereum / EVM',
    defaultPath: "m/44'/60'/0'/0/0",
    chainId: '1',
    defaultRpc: 'https://eth.llamarpc.com',
    defaultApp: 'MetaMask / Rabby',
  },
  'Solana (SOL)': {
    name: 'Solana (SOL)',
    defaultPath: "m/44'/501'/0'/0'",
    chainId: 'solana-mainnet',
    defaultRpc: 'https://api.mainnet-beta.solana.com',
    defaultApp: 'Phantom',
  },
  'Bitcoin (BTC SegWit)': {
    name: 'Bitcoin (BTC SegWit)',
    defaultPath: "m/84'/0'/0'/0/0",
    chainId: 'bitcoin',
    defaultRpc: 'https://mempool.space/api',
    defaultApp: 'Electrum / Ledger',
  },
  'TON Network': {
    name: 'TON Network',
    defaultPath: "m/44'/396'/0'/0/0",
    chainId: 'ton-mainnet',
    defaultRpc: 'https://toncenter.com/api/v2/jsonRPC',
    defaultApp: 'Tonkeeper',
  },
  'TRON (TRX)': {
    name: 'TRON (TRX)',
    defaultPath: "m/44'/195'/0'/0/0",
    chainId: 'tron-mainnet',
    defaultRpc: 'https://api.trongrid.io',
    defaultApp: 'TronLink',
  },
  'Arbitrum One': {
    name: 'Arbitrum One',
    defaultPath: "m/44'/60'/0'/0/0",
    chainId: '42161',
    defaultRpc: 'https://arb1.arbitrum.io/rpc',
    defaultApp: 'MetaMask / Rabby',
  },
  'BNB Smart Chain (BSC)': {
    name: 'BNB Smart Chain (BSC)',
    defaultPath: "m/44'/60'/0'/0/0",
    chainId: '56',
    defaultRpc: 'https://bsc-dataseed.binance.org',
    defaultApp: 'Trust Wallet',
  },
  'Custom / Другая сеть': {
    name: 'Custom / Другая сеть',
    defaultPath: "m/44'/60'/0'/0/0",
    chainId: '',
    defaultRpc: '',
    defaultApp: 'Hardware / Web3',
  }
};

export const CryptoSeedGrid: React.FC<CryptoSeedGridProps> = ({
  data,
  onChange,
  isReadOnly = false,
}) => {
  const [activeSection, setActiveSection] = useState<'seed' | 'privateKey' | 'settings'>('seed');
  const [showWords, setShowWords] = useState(!isReadOnly);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawPasteInput, setRawPasteInput] = useState('');

  const wordCount = data.wordCount || 12;

  // Ensure words array matches wordCount
  const words = [...(data.words || [])];
  while (words.length < wordCount) {
    words.push('');
  }
  const currentWords = words.slice(0, wordCount);

  const handleWordChange = (index: number, val: string) => {
    const next = [...currentWords];
    next[index] = val.trim().toLowerCase();
    onChange({ ...data, words: next });
  };

  const handleWordCountChange = (count: 12 | 18 | 24) => {
    let nextWords = [...currentWords];
    if (count > nextWords.length) {
      while (nextWords.length < count) nextWords.push('');
    } else {
      nextWords = nextWords.slice(0, count);
    }
    onChange({ ...data, wordCount: count, words: nextWords });
  };

  const handleApplyRawPaste = () => {
    const parsed = rawPasteInput
      .trim()
      .split(/[\s,\n]+/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    if (parsed.length > 0) {
      const targetCount: 12 | 18 | 24 = parsed.length >= 24 ? 24 : parsed.length >= 18 ? 18 : 12;
      const filled = [...parsed];
      while (filled.length < targetCount) filled.push('');
      onChange({
        ...data,
        wordCount: targetCount,
        words: filled.slice(0, targetCount),
      });
    }
    setShowPasteModal(false);
    setRawPasteInput('');
  };

  const handleCopy = async (text: string, keyName: string) => {
    if (!text) return;
    await copyToClipboardSecurely(text, 30);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePastePrivateKeyFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange({ ...data, privateKey: text.trim() });
      }
    } catch (e) {
      console.warn('Clipboard read permission denied or unavailable:', e);
    }
  };

  const handleNetworkSelect = (networkName: string) => {
    const preset = NETWORK_PRESETS[networkName];
    if (preset) {
      onChange({
        ...data,
        network: preset.name,
        derivationPath: data.derivationPath || preset.defaultPath,
        chainId: data.chainId || preset.chainId,
        rpcUrl: data.rpcUrl || preset.defaultRpc,
        walletApp: data.walletApp || preset.defaultApp,
      });
    } else {
      onChange({ ...data, network: networkName });
    }
  };

  // Inspect private key format
  const detectKeyType = (key?: string) => {
    if (!key) return null;
    const clean = key.trim();
    if (/^0x[a-fA-F0-9]{64}$/.test(clean)) return 'EVM / Hex 64 (0x...)';
    if (/^[a-fA-F0-9]{64}$/.test(clean)) return 'Hex Raw 64';
    if (clean.length >= 80 && clean.length <= 90) return 'Solana Base58';
    if (clean.startsWith('5') || clean.startsWith('K') || clean.startsWith('L')) return 'Bitcoin WIF';
    return 'Секретный ключ';
  };

  return (
    <div className="space-y-4">
      {/* Top Sub-tabs for Crypto Section */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSection('seed')}
          className={`py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSection === 'seed'
              ? 'bg-white text-black font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Seed-фраза ({wordCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('privateKey')}
          className={`py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSection === 'privateKey'
              ? 'bg-white text-black font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Private Key {data.privateKey ? '✓' : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          className={`py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSection === 'settings'
              ? 'bg-white text-black font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Параметры сети</span>
        </button>
      </div>

      {/* SECTION 1: SEED PHRASE */}
      {activeSection === 'seed' && (
        <div className="space-y-4 animate-scale-in">
          {/* Network & Word Count Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">Блокчейн:</span>
              <select
                disabled={isReadOnly}
                value={data.network || 'Ethereum / EVM'}
                onChange={(e) => handleNetworkSelect(e.target.value)}
                className="bg-black border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-white focus:outline-none cursor-pointer"
              >
                {Object.keys(NETWORK_PRESETS).map((net) => (
                  <option key={net} value={net}>
                    {net}
                  </option>
                ))}
              </select>
            </div>

            {/* 12 / 18 / 24 words switch */}
            <div className="flex items-center gap-1.5 bg-black p-1 rounded-lg border border-zinc-800">
              {[12, 18, 24].map((count) => (
                <button
                  key={count}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleWordCountChange(count as 12 | 18 | 24)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                    wordCount === count
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {count} слов
                </button>
              ))}
            </div>
          </div>

          {/* Grid Toolbar Actions */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWords(!showWords)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5"
              >
                {showWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showWords ? 'Скрыть слова' : 'Показать слова'}</span>
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setShowPasteModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Вставить всю строку</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(currentWords.filter(Boolean).join(' '), 'full_seed')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5"
              title="Скопировать все слова в буфер"
            >
              {copiedKey === 'full_seed' ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Clipboard className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === 'full_seed' ? 'Скопировано!' : 'Копировать сид'}</span>
            </button>
          </div>

          {/* Numbered 12/18/24 Seed Words Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
            {currentWords.map((word, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-white transition-all"
              >
                <span className="text-[10px] font-mono font-semibold text-zinc-500 w-5 select-none text-right">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                {isReadOnly ? (
                  <span className="text-xs font-mono font-medium text-white select-all">
                    {showWords ? word || '—' : '••••••'}
                  </span>
                ) : (
                  <input
                    type={showWords ? 'text' : 'password'}
                    value={word}
                    onChange={(e) => handleWordChange(idx, e.target.value)}
                    placeholder="слово..."
                    className="w-full bg-transparent text-xs font-mono text-white focus:outline-none placeholder-zinc-600"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Passphrase (25th word) */}
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>25-е слово / Секретная фраза BIP-39 (Passphrase)</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">Опционально</span>
            </div>
            <input
              type="password"
              disabled={isReadOnly}
              value={data.passphrase || ''}
              onChange={(e) => onChange({ ...data, passphrase: e.target.value })}
              placeholder="Дополнительное кодовое слово защиты"
              className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white"
            />
          </div>
        </div>
      )}

      {/* SECTION 2: PRIVATE KEY */}
      {activeSection === 'privateKey' && (
        <div className="space-y-4 animate-scale-in">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-white" />
                <h4 className="text-xs font-semibold text-white">Приватный ключ (Private Key)</h4>
              </div>
              {detectKeyType(data.privateKey) && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
                  {detectKeyType(data.privateKey)}
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Вставьте закрытый приватный ключ кошелька (raw hex 64 символа, WIF или Base58). Ключ хранится в локальной базе в зашифрованном виде.
            </p>

            <div className="relative">
              <input
                type={showPrivateKey ? 'text' : 'password'}
                disabled={isReadOnly}
                value={data.privateKey || ''}
                onChange={(e) => onChange({ ...data, privateKey: e.target.value.trim() })}
                placeholder="0x4f3e... или 5J3m..."
                className="w-full px-3.5 py-3 bg-black border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white pr-24 tracking-wide"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="p-1.5 text-zinc-400 hover:text-white"
                  title={showPrivateKey ? 'Скрыть ключ' : 'Показать ключ'}
                >
                  {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {data.privateKey && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.privateKey!, 'private_key')}
                    className="p-1.5 text-zinc-400 hover:text-white"
                    title="Скопировать приватный ключ"
                  >
                    {copiedKey === 'private_key' ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Clipboard className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePastePrivateKeyFromClipboard}
                  className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Вставить из буфера обмена</span>
                </button>
                {data.privateKey && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...data, privateKey: '' })}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Очистить
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: WALLET & NETWORK SETTINGS */}
      {activeSection === 'settings' && (
        <div className="space-y-4 animate-scale-in">
          {/* Quick Preset selector */}
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Быстрые настройки сети
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Автозаполнение параметров</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              {['Ethereum / EVM', 'Solana (SOL)', 'Bitcoin (BTC SegWit)', 'TON Network'].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => handleNetworkSelect(net)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                    data.network === net
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {net.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Public Address */}
            <div className="sm:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-zinc-300">
                  Публичный адрес кошелька
                </label>
                {data.address && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.address!, 'address')}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedKey === 'address' ? <Check className="w-3 h-3 text-white" /> : <Clipboard className="w-3 h-3" />}
                    <span>{copiedKey === 'address' ? 'Скопировано' : 'Копировать'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                value={data.address || ''}
                onChange={(e) => onChange({ ...data, address: e.target.value.trim() })}
                placeholder="0x... или bc1q... или solana..."
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Derivation Path */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Путь деривации (Derivation Path)
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={data.derivationPath || ''}
                onChange={(e) => onChange({ ...data, derivationPath: e.target.value.trim() })}
                placeholder="m/44'/60'/0'/0/0"
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Chain ID */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                ID сети (Chain ID)
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={data.chainId || ''}
                onChange={(e) => onChange({ ...data, chainId: e.target.value.trim() })}
                placeholder="1 (ETH), 56 (BSC), 42161 (Arb)..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Custom RPC Endpoint */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                RPC Эндпоинт (RPC URL)
              </label>
              <input
                type="url"
                disabled={isReadOnly}
                value={data.rpcUrl || ''}
                onChange={(e) => onChange({ ...data, rpcUrl: e.target.value.trim() })}
                placeholder="https://..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Wallet Client / App */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Приложение / Устройство
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={data.walletApp || ''}
                onChange={(e) => onChange({ ...data, walletApp: e.target.value.trim() })}
                placeholder="MetaMask, Ledger, Phantom..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Raw Paste Full Phrase Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 animate-scale-in">
            <h4 className="text-sm font-semibold text-white">Вставка Seed-фразы одной строкой</h4>
            <p className="text-xs text-zinc-400">
              Вставьте все 12, 18 или 24 слова, разделенные пробелами или переносами строк:
            </p>
            <textarea
              rows={4}
              value={rawPasteInput}
              onChange={(e) => setRawPasteInput(e.target.value)}
              placeholder="word1 word2 word3 word4 word5 ..."
              className="w-full p-3 bg-black border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-white"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasteModal(false);
                  setRawPasteInput('');
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleApplyRawPaste}
                disabled={!rawPasteInput.trim()}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold disabled:opacity-50"
              >
                Разбить по ячейкам
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
