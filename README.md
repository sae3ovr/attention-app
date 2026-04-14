# Alert.io — Community Safety Platform

> Real-time incident reporting, family safety, and community vigilance. A full-stack monorepo with **Web App**, **Flutter Mobile App**, **REST API**, **Landing Page**, and **Dev Tooling**.

[![Tests](https://img.shields.io/badge/tests-55%20passed-brightgreen)](#testing)
[![Platform](https://img.shields.io/badge/platform-web%20%7C%20iOS%20%7C%20android-blue)](#platforms)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

## Repository Structure

```
attention-app/                    # Monorepo root
├── app/                          # Expo Router screens (web + mobile)
├── src/                          # Shared source (components, services, stores, theme)
├── __tests__/                    # Jest test suite (55 tests)
├── alert-backend/                # Express + TypeScript REST API
│   ├── src/                      # API routes, middleware, database
│   ├── migrations/               # PostgreSQL schema
│   └── Dockerfile                # Multi-stage production build
├── alert-flutter/                # Flutter mobile app (Android/iOS/Web)
│   ├── lib/                      # Dart source (screens, providers, services)
│   ├── android/                  # Android platform config
│   ├── ios/                      # iOS platform config
│   └── web/                      # Flutter web config
├── alert-io/                     # Static landing page (HTML + CSS + JS)
├── tile-proxy/                   # Map tile proxy for dev environments
├── docker-compose.yml            # PostgreSQL + API orchestration
├── .env.example                  # All environment variables documented
└── docs/                         # Architecture, database, reputation docs
```

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/sae3ovr/attention-app.git
cd attention-app
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env — Firebase keys are optional (app works in demo mode)
# Docker vars (POSTGRES_PASSWORD, JWT_SECRET) are required for backend
```

### 3. Start the Backend (Docker)

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432` (localhost only)
- **REST API** on `localhost:3000`

### 4. Run the Web App

```bash
npx expo start --web --port 8081
```

### 5. Run on Mobile

```bash
# Android / iOS via Expo Go
npx expo start --lan --port 8081

# Flutter mobile app (separate)
cd alert-flutter
flutter pub get
flutter run
```

### 6. Serve the Landing Page

```bash
npx serve -s -l 8080 alert-io
```

## All Platforms

| Component | Technology | Run Command | Port |
|-----------|-----------|-------------|------|
| **Web App** | Expo + React Native Web | `npx expo start --web` | 8081 |
| **Mobile App** | Expo + React Native | `npx expo start --lan` | 8081 |
| **Flutter App** | Flutter 3.16+ | `cd alert-flutter && flutter run` | — |
| **REST API** | Express + TypeScript | `docker-compose up -d` | 3000 |
| **Landing Page** | Static HTML/JS | `npx serve -s -l 8080 alert-io` | 8080 |
| **Tile Proxy** | Node.js | `node tile-proxy/server.js` | 8888 |

## Features

### Web + Mobile App (Expo)
- **Real-time incident mapping** with MapLibre GL JS + animated markers
- **AI credibility engine** scoring reports by text quality, geography, history
- **22+ live public cameras** (YouTube, MJPG streams) — no API keys needed
- **Drive mode** with OSRM navigation + speed camera alerts via Overpass API
- **GuardScan radar** — visual sweep discovering incidents in configurable radius
- **Chain system** — link friends, pets, vehicles, devices with real-time location
- **Family safety** — groups, Kid Mode, safe zones, SOS, battery monitoring
- **32-level badge system** from Observador Iniciante to Guardião Supremo
- **ErrorBoundary** — graceful crash recovery
- **Accessibility** — VoiceOver/TalkBack labels, high contrast, reduced motion

### Flutter App
- Native Android/iOS/Web with Riverpod state management
- Encrypted token storage via `flutter_secure_storage`
- Configurable API URL via `--dart-define`
- 9 screens: map, feed, chain, family, profile, login, register, boot, home

### Backend API
- JWT auth with pinned HS256, 7-day expiry
- Parameterized SQL (no injection)
- bcrypt password hashing
- CORS restricted to configured origins
- Ownership verification on family/chain operations
- Multi-stage Docker build (non-root, healthcheck)

### Landing Page
- Animated hero, live MapLibre demo, pricing, login/register
- Open Graph + Twitter Card SEO
- Configurable app URL via `window.ALERT_APP_URL`

## Environment Variables

```bash
# === Firebase (optional — demo mode works without these) ===
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# === App behavior ===
EXPO_PUBLIC_ENABLE_AUTO_DEMO=false

# === Docker / Backend (required for API) ===
POSTGRES_DB=alertio
POSTGRES_USER=alertio
POSTGRES_PASSWORD=<strong-random-password>
JWT_SECRET=<64-char-random-string>
NODE_ENV=development
CORS_ORIGINS=http://localhost:8081,http://localhost:8080
```

## Testing

```bash
# Expo app tests (55 tests)
npm test

# Backend type check
cd alert-backend && npx tsc --noEmit

# Flutter analysis
cd alert-flutter && flutter analyze

# Expo lint
npx expo lint

# Web build
npx expo export --platform web
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Landing     │     │  Web/Mobile  │     │  Flutter App  │
│  (alert-io)  │────▶│  (Expo)      │     │  (alert-      │
│  Port 8080   │     │  Port 8081   │     │   flutter)    │
└─────────────┘     └──────┬───────┘     └───────┬───────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  REST API    │     │  Tile Proxy  │
                    │  (alert-     │     │  (tile-proxy)│
                    │   backend)   │     │  Port 8888   │
                    │  Port 3000   │     └──────────────┘
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  Port 5432   │
                    └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web/Mobile Framework** | React Native + Expo (SDK 52) |
| **Flutter Framework** | Flutter 3.16+ with Riverpod |
| **Backend** | Express 4.21 + TypeScript |
| **Database** | PostgreSQL 16 |
| **Auth** | Firebase Authentication / JWT |
| **Map** | MapLibre GL JS + OpenFreeMap |
| **State** | Zustand (Expo) / Riverpod (Flutter) |
| **Testing** | Jest + ts-jest |
| **Deployment** | Vercel (web), EAS Build (mobile), Docker (API) |

## Security

- No hardcoded secrets — all env-driven with fail-fast in production
- JWT with pinned HS256 algorithm, 7-day expiry
- CORS restricted to configured origins
- CSP + HSTS + Permissions-Policy headers (Vercel)
- Multi-stage Docker build with non-root user
- Encrypted token storage on mobile
- No cleartext HTTP traffic in production

## Detailed Documentation

| Doc | Location |
|-----|----------|
| Backend API docs | [`alert-backend/README.md`](alert-backend/README.md) |
| Flutter app docs | [`alert-flutter/README.md`](alert-flutter/README.md) |
| Landing page docs | [`alert-io/README.md`](alert-io/README.md) |
| Tile proxy docs | [`tile-proxy/README.md`](tile-proxy/README.md) |
| Architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Database schema | [`docs/DATABASE.md`](docs/DATABASE.md) |
| Reputation system | [`docs/REPUTATION.md`](docs/REPUTATION.md) |
| SDK documentation | [`docs/SDK.md`](docs/SDK.md) |

## License

MIT
