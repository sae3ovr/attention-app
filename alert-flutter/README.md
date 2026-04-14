# Alert.io — Flutter Mobile App

Cross-platform mobile app for the Alert.io community safety platform. Built with **Flutter 3.16+**, uses **Riverpod** for state management, **Dio** for API communication, and **flutter_map** for mapping.

## Prerequisites

- **Flutter 3.16+** — [flutter.dev/docs/get-started/install](https://flutter.dev/docs/get-started/install)
- **Android Studio** with Android SDK (for Android emulator)
- **Xcode 15+** (macOS only, for iOS)
- **Docker** — for the PostgreSQL + API backend

## Setup

### 1. Start the Backend

```bash
# From the monorepo root (attention-app/)
cp .env.example .env
# Edit .env with strong passwords

docker-compose up -d
```

This starts:
- PostgreSQL 16 on `localhost:5432` (bound to localhost only)
- REST API on `localhost:3000`

### 2. Install Flutter Dependencies

```bash
cd alert-flutter
flutter pub get
```

### 3. Run on Android Emulator

```bash
# Default (uses http://10.0.2.2:3000 for emulator)
flutter run

# With custom API URL
flutter run --dart-define=API_BASE_URL=https://api.alert.io
```

### 4. Build APK

```bash
# Release build with production API
flutter build apk --release --dart-define=API_BASE_URL=https://api.alert.io
```

### 5. Run on iOS

```bash
cd ios && pod install && cd ..
flutter run --device-id=<your-device>

# Or build for iOS
flutter build ios --dart-define=API_BASE_URL=https://api.alert.io
```

## API Connection

The API URL is configured via `--dart-define`:

| Environment | URL | How to set |
|------------|-----|-----------|
| **Android Emulator** | `http://10.0.2.2:3000` | Default (no flag needed) |
| **iOS Simulator** | `http://localhost:3000` | `--dart-define=API_BASE_URL=http://localhost:3000` |
| **Physical Device** | Your LAN IP | `--dart-define=API_BASE_URL=http://192.168.x.x:3000` |
| **Production** | Your API domain | `--dart-define=API_BASE_URL=https://api.alert.io` |

## Code Quality

```bash
# Run static analysis (target: 0 errors, 0 warnings)
flutter analyze

# Run tests
flutter test

# Check outdated dependencies
flutter pub outdated
```

## Project Structure

```
lib/
├── main.dart                  # App entry with FlutterError.onError handler
├── theme/
│   └── app_theme.dart         # Light + dark theme, colors, ThemeMode provider
├── models/
│   ├── user.dart              # UserProfile model
│   └── incident.dart          # Incident + TrackedItem models
├── services/
│   └── api_service.dart       # Dio HTTP client (configurable baseUrl via dart-define)
├── providers/
│   ├── auth_provider.dart     # Riverpod auth state (no demo fallback on error)
│   ├── incidents_provider.dart # Riverpod incidents state
│   └── tracking_provider.dart # Riverpod tracked items state
├── data/
│   └── badges.dart            # 32-level badge definitions
├── screens/
│   ├── security_boot_screen.dart  # Animated boot sequence
│   ├── login_screen.dart          # Login (no pre-filled credentials)
│   ├── register_screen.dart       # Registration
│   ├── home_screen.dart           # Bottom nav (Map, Feed, Chain, Family, Profile)
│   ├── map_screen.dart            # flutter_map with markers, location tracking
│   ├── feed_screen.dart           # Live incident feed with auto-refresh
│   ├── chain_screen.dart          # Chain member management
│   ├── family_screen.dart         # Family groups + location sharing
│   └── profile_screen.dart        # Profile, badges, SOS, emergency services
└── widgets/
    ├── glass_card.dart            # Glassmorphic card with backdrop blur
    └── logo_mark.dart             # Animated radar logo
```

## Security Notes

- **No cleartext HTTP in production** — `usesCleartextTraffic="false"` in AndroidManifest
- **Tokens stored in flutter_secure_storage** (encrypted keychain/keystore)
- **No demo user fallback** on connection errors — shows proper error message
- **No pre-filled credentials** in login screen
- **Background location permission removed** (was unused)
- **API URL configurable** via `--dart-define` (no hardcoded URLs)

## Dependencies

| Package | Purpose |
|---------|---------|
| `flutter_riverpod` | State management |
| `dio` | HTTP client with interceptors |
| `flutter_map` | OpenStreetMap-based mapping |
| `latlong2` | Geographic coordinates |
| `geolocator` | Device location |
| `flutter_secure_storage` | Encrypted token storage |

## License

MIT
