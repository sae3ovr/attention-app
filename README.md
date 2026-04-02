# Attention — Community Safety App

A fully cross-platform community safety application built with React Native + Expo. Runs on **Windows, Linux, macOS** (via web browser), **Android**, and **iOS** with a real-time interactive dark-themed map on every platform.

## Supported Platforms

| Platform | Map Technology | How to Run |
|----------|---------------|------------|
| **Windows/Linux/macOS** (Browser) | Leaflet + CartoDB Dark tiles | `npx expo start --web` |
| **Android** | Google Maps (dark styled) | `npx expo start --android` or Expo Go |
| **iOS** | Google Maps (dark styled) | `npx expo start --ios` or Expo Go |

## Quick Start

### Prerequisites

1. **Node.js 20+** — Download from [nodejs.org](https://nodejs.org)
2. **Expo CLI** — Comes with `npx` (included with Node.js)
3. **Expo Go app** — Install on your phone from App Store / Google Play (for mobile testing)

### Installation

```bash
cd attention-app
npm install
```

If you get version conflicts, run:

```bash
npx expo install --fix
```

### Run the App

```bash
# Web (Windows/Linux/macOS) — opens in your browser with real-time Leaflet map
npx expo start --web

# Mobile — scan QR with Expo Go
npx expo start

# Platform-specific
npx expo start --android
npx expo start --ios
```

### PC / Desktop Experience

On desktop browsers (screen width >= 768px), the app renders a **split-panel layout**:
- **Left sidebar**: Incident list, report button, incident detail panel
- **Right panel**: Full interactive Leaflet map with dark CartoDB tiles, animated neon markers, hover tooltips, and glassmorphic popups

Custom scrollbar styling, keyboard navigation, hover states, and `prefers-reduced-motion` / `prefers-contrast` media queries are all supported.

## Features

### Core
- **Interactive Map** — View incidents in your area with category-colored animated markers
- **Incident Reporting** — 3-step guided flow: category → details → confirm
- **GuardScan Radar** — Visual radar sweep to discover nearby incidents (500m – 5km)
- **Confirm/Deny** — Community-powered incident verification
- **Reactions** — Quick feedback (Useful, Be Careful, Watching)

### Social
- **Activity Feed** — Real-time community activity timeline
- **Badge System** — 31 levels from "Observador Anônimo" (0 pts) to "Attention Master" (100K pts)
- **Guardian Tier** — At 200K pts: moderation powers, incident verification

### Family & Safety
- **Family Groups** — Private groups with invite codes, shared map, chat
- **Kid Mode** — Safe zone monitoring, SOS button, battery tracking, zone breach alerts
- **Location Sharing** — Generate temporary links (no account needed to view)
- **Ghost Mode** — Hide from public map while family can still see you

### Accessibility (Full Disability Support)

| Disability | Features |
|-----------|----------|
| **Visual (Blind/Low Vision)** | VoiceOver/TalkBack labels on every element, High Contrast mode, Large Text scaling, Voice Guidance mode, Screen Reader optimized layouts |
| **Motor** | 48px minimum touch targets (56px in Large Target mode), Haptic feedback on all interactions, Reduced Motion mode |
| **Hearing** | Visual alerts for all sounds, Haptic vibration as audio alternative, Text-based notifications only |
| **Cognitive** | Simplified UI mode, Step-by-step flows, Consistent navigation, Clear icons with text labels |

## Project Structure (57 source files)

```
attention-app/
├── app/                          # Expo Router screens
│   ├── +html.tsx                 # Web HTML shell (dark theme, scrollbar, a11y)
│   ├── _layout.tsx               # Root navigation
│   ├── (auth)/                   # Sign-in, Sign-up
│   ├── (tabs)/                   # Map, Feed, GuardScan, Family, Profile
│   │   └── index.tsx             # Responsive: sidebar on PC, bottom sheet on mobile
│   ├── incident/report.tsx       # 3-step report wizard
│   └── settings/                 # Settings + Full accessibility config
├── src/
│   ├── components/
│   │   ├── map/
│   │   │   ├── AttentionMap.tsx     # Native (react-native-maps + dark Google style)
│   │   │   ├── AttentionMap.web.tsx # Web (Leaflet + CartoDB dark tiles + CSS animations)
│   │   │   ├── mapStyles.ts        # Google Maps dark JSON style
│   │   │   └── types.ts            # Shared map types
│   │   ├── ui/                     # GlassCard, NeonButton, NeonText, BadgeIcon...
│   │   └── incident/              # IncidentCard
│   ├── stores/                     # Zustand (auth, incidents, family, accessibility)
│   ├── hooks/                      # useAccessibility, useHaptics, useResponsive
│   ├── theme/                      # Colors (+ high contrast), Typography, Spacing
│   ├── constants/                  # 31 Badges, 10 Categories
│   ├── services/                   # Mock data (swap for Firebase in production)
│   └── types/                      # TypeScript interfaces
├── docs/                           # Full documentation (5 files)
└── assets/                         # App icons
```

## Design System

- **Theme:** Dark background (#0A0A0F) with neon accents
- **Primary:** #00FFAA (neon green/teal)
- **Secondary:** #7B61FF (electric purple)
- **Accent:** #FF3B7A (hot pink)
- **Glass effect:** Semi-transparent cards with subtle borders
- **Typography:** System font with 10 size scales
- **Animations:** Pulsing markers, radar sweep, glow effects

## Firebase Setup (Production)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable: Authentication, Firestore, Realtime Database, Storage, Cloud Functions
3. Copy `.env.example` to `.env` and fill in your keys
4. See `docs/DATABASE.md` for the full Firestore schema

## License

MIT
