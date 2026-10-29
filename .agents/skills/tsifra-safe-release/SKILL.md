---
name: tsifra-safe-release
description: Регламент проверки и запуска релизной сборки Tsifra Safe (Android APK/AAB и iOS Archive), включая аудит GitHub Actions workflow (.github/workflows/android-build.yml), обфускацию ProGuard/R8 и подпись.
---

# Tsifra Safe Release & CI/CD Runbook

Пошаговый регламент подготовки и проверки релизных сборок приложения Tsifra Safe.

## 1. Проверка Android Сборки
- Проверить файл `.github/workflows/android-build.yml`:
  - Кэширование Gradle (`actions/cache@v4` или `gradle/actions/setup-gradle`).
  - Версия JDK (Java 17 для современных React Native / Android Gradle Plugin).
  - Секреты для подписи: `KEYSTORE_BASE64`, `KEY_ALIAS`, `KEYSTORE_PASSWORD`.
- Проверить `proguard-rules.pro` / R8:
  - Убедиться, что нативные классы и криптографические библиотеки не повреждены минификацией:
    `-keep class com.tsifrasafe.** { *; }`

## 2. Проверка iOS Сборки
- Проверить наличие `Podfile.lock` и актуальность подов.
- Проверить сертификаты (Distribution Certificate) и Provisioning Profiles.
- Убедиться, что `ENABLE_BITCODE` отключен (депрекейтнут в Xcode 14+), а архитектура оптимизирована под arm64.

## 3. Финальный чеклист перед релизом
- [ ] Отключены все `console.log` и debug-логи в релизном бандле (babel-plugin-transform-remove-console).
- [ ] Проверено отсутствие hardcoded ключей в репозитории (`git diff`).
- [ ] Увеличена версия `versionCode` / `CFBundleVersion`.
