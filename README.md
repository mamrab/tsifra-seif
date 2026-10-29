# Цифра-Сейф для iPhone 📱

Автономное офлайн Zero-Knowledge хранилище паролей, Seed-фраз и приватных ключей для iOS с дизайном **Liquid Glass**.

## Особенности

- 🔒 **100% Офлайн и Zero-Knowledge**: Данные шифруются на устройстве с использованием Apple CryptoKit (AES-256-GCM + HKDF-SHA256).
- 🧬 **Поддержка Web3 & Crypto**:
  - Хранение мнемонических фраз BIP-39 (12, 18, 24 слова).
  - Безопасное хранение приватных ключей, адресов, RPC и сетей.
- 💎 **Apple iOS 27 Liquid Glass**:
  - Аппаратное размытие `.ultraThinMaterial`.
  - Тактильные стеклянные клавиши PIN-пада (`LiquidGlassKeypadButton`).
  - Многослойная рефракция света, световые фаски (Specular Bevels) и кромка свечения.
- ⚡ **Face ID / Touch ID**: Быстрая разблокировка через LocalAuthentication с безопасным сохранением в Keychain.
- 💡 **Ассистент забытых данных**: Автоматический аудит пустых полей, неполных Seed-фраз и слабых паролей.
- 🛠 **Встроенный генератор паролей**: Настраиваемый генератор паролей, фраз и PIN-кодов с расчетом энтропии.

## Структура проекта

```
ios/
├── TsifraSafe/
│   ├── Components/       # Компоненты жидкого стекла (LiquidGlass.swift)
│   ├── Models/           # Модели данных (VaultItem.swift)
│   ├── Services/         # Криптография (CryptoVaultService), биометрия, генератор
│   ├── Views/            # SwiftUI-экраны (LockView, DashboardView, ItemDetailView, etc.)
│   ├── Info.plist
│   └── TsifraSafeApp.swift
└── TsifraSafe.xcodeproj/ # Проект Xcode для iPhone
```

## Сборка и запуск

1. Откройте `ios/TsifraSafe.xcodeproj` в Xcode 15 или 16.
2. Выберите целевое устройство: **Любой iPhone** или симулятор iPhone 15/16 Pro.
3. Нажмите `Cmd + R` для запуска.

Сборка `.ipa` артефакта автоматизирована через GitHub Actions workflow [`.github/workflows/apple-build.yml`](.github/workflows/apple-build.yml).
