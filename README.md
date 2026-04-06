# Alert.io — Community Safety Platform

A cross-platform community safety application built with **React Native + Expo**, featuring real-time incident mapping, public camera integration, family protection, and AI-powered credibility analysis. Runs on **Web**, **iOS**, and **Android**.

## Supported Platforms

| Platform | Map Engine | How to Run |
|----------|-----------|------------|
| **Web** (Desktop / Mobile) | MapLibre GL JS + OpenFreeMap | `npx expo start --web` |
| **Android** | MapLibre GL JS (web view) | Expo Go / `npx expo start --android` |
| **iOS** | MapLibre GL JS (web view) | Expo Go / `npx expo start --ios` |

## Quick Start

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Expo Go** — Install on your phone from App Store / Google Play (for mobile testing)

### Installation

```bash
cd attention-app
npm install
```

If you get version conflicts:

```bash
npx expo install --fix
```

### Run the App

```bash
# Web — opens in browser at http://localhost:8081
npx expo start --web --port 8081

# Mobile (LAN mode — scan QR with Expo Go)
npx expo start --lan --port 8081

# Landing page (separate)
npx serve -s -l 8080 ../alert-io
```

### Desktop Experience

On screens ≥ 768px, the app renders a **split-panel layout**:

- **Left sidebar** — App branding, navigation buttons (Chain, Family, Profile, Drive Mode, alert.io link), live activity feed (5 incidents cycling every 8s), nearby incident list with hover-to-highlight on the map
- **Right panel** — Full interactive MapLibre GL map with dark tiles, animated category markers, hover tooltips, glassmorphic popups, and public camera overlays

## Features

### Real-Time Incident Map
- Interactive dark-theme map powered by MapLibre GL JS + OpenFreeMap tiles
- Category-colored animated markers with emoji icons and severity indicators
- Hover tooltips showing incident details (category, severity, title, stats)
- Click popups with full incident information, voting, and comments
- Smart viewport culling and grid-based decluttering for performance
- User location marker with glow animation (always on top)

### Incident Reporting & Verification
- 3-step guided reporting flow: category → details → confirm
- Community-powered confirm/deny voting system
- AI credibility engine scoring reports on text quality, geographic plausibility, cross-reference density, reporter history, photo evidence, time recency, and source authority
- Verified / Fake Report badges with visual indicators

### Public Data Integration
- Real-time data from public security APIs (UK Police, DC Open Data, Portugal dados.gov.pt)
- Auto-refreshing feed every 30 seconds with fresh data from public sources
- Heuristic credibility scoring for each incoming report

### Public Cameras
- 5,000+ live cameras from open sources (Live Environment Streams, Iowa Mesonet)
- No API keys required — 100% free and open data
- Hover tooltips with camera info (name, type, country, quality)
- Click to open real-time stream viewer
- Camera type classification: traffic, urban, coastal, nature

### Navigation & Drive Mode
- Full turn-by-turn navigation powered by OSRM
- Speed camera detection via Overpass API (OpenStreetMap)
- Drive Mode HUD: speedometer, speed limit alerts, nearby incident warnings
- Address search with Nominatim geocoding

### GuardScan Radar
- Visual radar sweep discovering incidents within configurable radius (500m – 25km)
- Animated scan results with distance/bearing information

### Chain System
- Link members with direct map location access
- Real-time member tracking on the map

### Family & Safety
- Private family groups with invite codes and shared map
- Kid Mode: safe zone monitoring, SOS button, battery tracking, zone breach alerts
- Location sharing via temporary links (no account needed to view)
- Ghost Mode: hide from public map while family can still see you

### Social & Gamification
- Real-time activity feed with live cycling (5 items, 8-second intervals)
- Badge system: 31 levels from "Observador Anônimo" (0 pts) to "Attention Master" (100K pts)
- Guardian Tier at 200K pts: moderation powers, incident verification

### Accessibility

| Disability | Features |
|-----------|----------|
| **Visual** | VoiceOver/TalkBack labels, High Contrast mode, Large Text, Voice Guidance |
| **Motor** | 48px+ touch targets, haptic feedback, Reduced Motion mode |
| **Hearing** | Visual alerts, haptic vibration, text-only notifications |
| **Cognitive** | Simplified UI mode, step-by-step flows, consistent navigation |

### In-App Tutorial
- 5-step interactive overlay guide with spotlight highlights
- Points to key UI elements and explains functionality
- Dismissible, persists completion state via localStorage

## Architecture

```
attention-app/
├── app/                              # Expo Router screens
│   ├── +html.tsx                     # Web HTML shell (dark theme, animations)
│   ├── _layout.tsx                   # Root navigation + AuthGate (auto-login)
│   ├── (auth)/                       # Sign-in, Sign-up (bypassed via auto-login)
│   ├── (tabs)/                       # Main tabs
│   │   ├── index.tsx                 # Map screen (responsive sidebar/mobile)
│   │   ├── chain.tsx                 # Chain member management
│   │   ├── family.tsx                # Family groups & Kid Mode
│   │   ├── feed.tsx                  # Activity feed
│   │   ├── profile.tsx               # User profile & badges
│   │   └── scan.tsx                  # GuardScan
│   ├── incident/report.tsx           # 3-step report wizard
│   └── settings/                     # Settings + accessibility config
├── src/
│   ├── components/
│   │   ├── map/
│   │   │   ├── AttentionMap.tsx       # Native map placeholder
│   │   │   ├── AttentionMap.web.tsx   # MapLibre GL JS (markers, popups, cameras)
│   │   │   ├── mapStyles.ts          # Map style configuration
│   │   │   └── types.ts              # Map component types
│   │   ├── camera/
│   │   │   └── CameraViewer.tsx       # Live camera stream viewer
│   │   ├── ui/
│   │   │   ├── GlassCard.tsx          # Glassmorphic card component
│   │   │   ├── NeonButton.tsx         # Neon-styled button
│   │   │   ├── NeonText.tsx           # Glowing text component
│   │   │   ├── BadgeIcon.tsx          # Badge/level icon
│   │   │   ├── LogoMark.tsx           # Animated Alert.io logomark
│   │   │   ├── TutorialOverlay.tsx    # Interactive tutorial overlay
│   │   │   └── LoadingRadar.tsx       # Loading animation
│   │   └── incident/
│   │       └── IncidentCard.tsx       # Incident list card
│   ├── services/
│   │   ├── publicDataService.ts       # UK Police, DC, Portugal data APIs
│   │   ├── cameraService.ts           # Public camera aggregation (5000+)
│   │   ├── credibilityEngine.ts       # AI heuristic fake/real scoring
│   │   ├── authService.ts             # Authentication service
│   │   ├── database.ts                # Local database service
│   │   └── mockData.ts                # Mock data & utilities
│   ├── stores/                        # Zustand state management
│   │   ├── authStore.ts               # Authentication state
│   │   ├── incidentStore.ts           # Incident CRUD + public data
│   │   ├── familyStore.ts             # Family groups state
│   │   └── accessibilityStore.ts      # Accessibility preferences
│   ├── data/
│   │   ├── worldIncidents.ts          # Global incident seed data
│   │   ├── portugalIncidents.ts       # Portugal-specific incidents
│   │   └── portugalCrimeStats.json    # Crime statistics dataset
│   ├── hooks/                         # useAccessibility, useHaptics, useResponsive
│   ├── theme/                         # Colors, Typography, Spacing
│   ├── constants/                     # 31 Badges, 10+ Categories
│   ├── i18n/                          # Multilingual (pt-BR, en, es, de)
│   ├── sdk/                           # AttentionSDK + SafetyButton widget
│   └── types/                         # TypeScript interfaces
├── scripts/                           # Build & utility scripts
├── docs/                              # Architecture documentation
└── assets/                            # App icons & images
```

## Design System

| Token | Value |
|-------|-------|
| **Background** | `#0A0A0F` (deep dark) |
| **Primary** | `#00FFAA` (neon green) |
| **Secondary** | `#7B61FF` (electric purple) |
| **Accent** | `#FF3B7A` (hot pink) |
| **Warning** | `#FFB800` (amber) |
| **Glass effect** | `backdrop-filter: blur(24px)` with semi-transparent borders |
| **Typography** | Courier New (monospace) + system sans-serif |
| **Animations** | Pulsing markers, radar sweep, glow effects, CSS keyframes |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native + Expo (SDK 52) |
| **Routing** | Expo Router |
| **State** | Zustand |
| **Map** | MapLibre GL JS + OpenFreeMap.org |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **Routing Engine** | OSRM |
| **Speed Cameras** | Overpass API (OSM) |
| **Public Data** | UK Police API, DC Open Data, dados.gov.pt |
| **Camera Streams** | Live Environment Streams, Iowa Mesonet |
| **Auth** | Firebase Authentication (configurable) |
| **Languages** | Portuguese (BR), English, Spanish, German |

## Premium Plan

**€4.99/month** — Unlocks:
- Chain system (member location linking)
- Full navigation with speed alerts
- Family system (groups, Kid Mode, safe zones)

## Landing Page

The Alert.io landing page is served separately from `../alert-io/`:

```bash
npx serve -s -l 8080 ../alert-io
```

Features: animated hero, live incident map demo, feature showcase, pricing section, login form that redirects directly to the app.

## License

MIT
