# Attention — System Architecture

> **Pattern:** Serverless event-driven architecture
> **Mobile:** React Native + Expo (managed workflow)
> **Backend:** Firebase (BaaS) + Cloud Functions (Node.js 20)
> **Maps:** Google Maps Platform (Maps SDK, Geocoding, Directions)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │  Expo App     │  │  Web Viewer   │  │  Guardian Admin Panel   │ │
│  │  (iOS/Android)│  │  (React SPA)  │  │  (React Web)            │ │
│  │               │  │  Live share   │  │  Moderation dashboard   │ │
│  └──────┬────────┘  └──────┬────────┘  └───────────┬─────────────┘ │
└─────────┼──────────────────┼───────────────────────┼───────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FIREBASE SERVICES                               │
│                                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐ │
│  │  Firebase     │  │  Cloud        │  │  Realtime Database       │ │
│  │  Auth         │  │  Firestore    │  │  (Live locations only)   │ │
│  │  ─────────── │  │  ────────────│  │  ────────────────────── │ │
│  │  Email/Pass   │  │  All app data │  │  /liveLocations/{uid}    │ │
│  │  Google OAuth │  │  10 root      │  │  /families/*/locations/* │ │
│  │  Apple Sign-In│  │  collections  │  │  /presence/{uid}         │ │
│  └──────────────┘  └───────────────┘  └──────────────────────────┘ │
│                                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐ │
│  │  Cloud        │  │  Firebase     │  │  Firebase                │ │
│  │  Functions    │  │  Storage      │  │  Cloud Messaging (FCM)   │ │
│  │  ─────────── │  │  ────────────│  │  ────────────────────── │ │
│  │  Event-driven │  │  Photos       │  │  Push notifications      │ │
│  │  business     │  │  Avatars      │  │  iOS + Android           │ │
│  │  logic        │  │  Assets       │  │  Topic-based + targeted  │ │
│  └──────────────┘  └───────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                 │
│                                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐ │
│  │  Google Maps  │  │  Google Maps  │  │  Google Maps             │ │
│  │  SDK          │  │  Geocoding    │  │  Directions API          │ │
│  │  (Map tiles)  │  │  (Addresses)  │  │  (Route safety)          │ │
│  └──────────────┘  └───────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cloud Functions Architecture

All backend logic runs as event-driven Cloud Functions triggered by Firestore writes, RTDB changes, Auth events, or scheduled timers.

### Function Catalog

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onUserCreated` | Auth: `onCreate` | Initialize `/users/{uid}` with defaults, create settings subcollection |
| `onUserDeleted` | Auth: `onDelete` | GDPR cleanup: delete all user data across collections |
| `onIncidentCreated` | Firestore: `incidents/{id}` `onCreate` | Calculate geohash, notify nearby users, award reporter points |
| `onIncidentConfirmed` | Firestore: `incidents/{id}/confirmations/{uid}` `onCreate` | Update confirm/deny counts, adjust credibility score, award points |
| `onReputationChange` | Firestore: `reputationEvents/{id}` `onCreate` | Recalculate user level, check Guardian threshold, update user doc |
| `onLocationUpdate` | RTDB: `/liveLocations/{uid}` `onWrite` | Bridge to family group locations (every 30s), check kid safe zones |
| `onKidLocationChange` | RTDB: `/families/{gid}/locations/{uid}` `onWrite` | Point-in-polygon safe zone check, trigger breach alerts |
| `onFamilyMemberJoin` | Firestore: `families/{gid}/members/{uid}` `onCreate` | Update member count, send welcome notification |
| `expireIncidents` | Scheduled: every 15 min | Set `status: expired` on incidents past `expiresAt` |
| `expireLocationShares` | Scheduled: every 5 min | Set `isActive: false` on shares past `expiresAt` |
| `resetDailyReportCounts` | Scheduled: daily midnight UTC | Reset `reportsToday` to 0 for all users |
| `fanOutFeedItem` | Firestore: `incidents/{id}` `onCreate` | Write feed items to followers of the reporter |
| `sendNearbyAlert` | Callable / internal | Geohash range query → find users within radius → send FCM |
| `generateShareToken` | Callable | Create `/locationShares` doc with UUID token |
| `processSOSAlert` | RTDB: custom SOS node | Notify all parents + optional SMS via Twilio |

---

## Mobile App Architecture

### Expo Project Structure

```
attention-app/
├── app/                          # Expo Router file-based routing
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── index.tsx             # Map screen (home)
│   │   ├── feed.tsx              # Activity feed
│   │   ├── scan.tsx              # GuardScan radar
│   │   ├── family.tsx            # Family mode
│   │   └── profile.tsx           # Profile & settings
│   ├── incident/
│   │   ├── [id].tsx              # Incident detail screen
│   │   └── report.tsx            # Report incident modal
│   ├── family/
│   │   ├── [groupId].tsx         # Family group detail
│   │   ├── create.tsx            # Create family group
│   │   ├── kid/
│   │   │   ├── [kidId].tsx       # Kid dashboard
│   │   │   └── setup.tsx         # Kid profile setup
│   │   └── chat/
│   │       └── [groupId].tsx     # Family chat
│   ├── share/
│   │   └── create.tsx            # Create location share
│   ├── user/
│   │   ├── [uid].tsx             # Public profile
│   │   └── settings.tsx          # Full settings
│   └── _layout.tsx               # Root layout
├── components/
│   ├── map/
│   │   ├── AttentionMap.tsx       # Main map component
│   │   ├── IncidentMarker.tsx     # Animated incident marker
│   │   ├── UserMarker.tsx         # Pulsing user position
│   │   ├── FamilyMarker.tsx       # Family member marker
│   │   ├── HeatmapLayer.tsx       # Incident density heatmap
│   │   ├── SafeZoneOverlay.tsx    # Kid safe zone polygons
│   │   └── GuardScanOverlay.tsx   # Radar sweep animation
│   ├── incident/
│   │   ├── IncidentCard.tsx       # Incident list card
│   │   ├── ReportSheet.tsx        # Bottom sheet report form
│   │   ├── ConfirmDenyBar.tsx     # Confirm/deny action bar
│   │   └── CategoryPicker.tsx     # Incident category selector
│   ├── reputation/
│   │   ├── BadgeIcon.tsx          # Badge display component
│   │   ├── LevelProgress.tsx      # XP progress bar
│   │   └── ReputationHistory.tsx  # Point change timeline
│   ├── family/
│   │   ├── FamilyMap.tsx          # Family-only map view
│   │   ├── MemberList.tsx         # Family member list
│   │   ├── KidTracker.tsx         # Kid location tracker
│   │   ├── SafeZoneEditor.tsx     # Draw safe zones on map
│   │   └── SOSButton.tsx          # Emergency SOS button
│   ├── social/
│   │   ├── FeedItem.tsx           # Feed item renderer
│   │   ├── CommentThread.tsx      # Comment list
│   │   └── FollowButton.tsx       # Follow/unfollow
│   └── ui/
│       ├── GlassCard.tsx          # Frosted glass card
│       ├── NeonButton.tsx         # Neon-glow button
│       ├── NeonText.tsx           # Glow text
│       ├── BottomSheet.tsx        # Reusable bottom sheet
│       └── LoadingRadar.tsx       # Radar-style loading spinner
├── hooks/
│   ├── useAuth.ts                 # Auth state hook
│   ├── useLocation.ts            # Live location hook
│   ├── useNearbyIncidents.ts     # Geohash-based incident query
│   ├── useReputation.ts          # User reputation hook
│   ├── useFamily.ts              # Family group data
│   ├── useKidTracker.ts          # Kid mode tracking
│   └── useGuardScan.ts           # GuardScan radius query
├── services/
│   ├── firebase.ts               # Firebase app initialization
│   ├── auth.ts                   # Auth service
│   ├── incidents.ts              # Incident CRUD
│   ├── reputation.ts             # Reputation helpers
│   ├── families.ts               # Family group service
│   ├── kidMode.ts                # Kid mode service
│   ├── locationSharing.ts        # Share token management
│   ├── notifications.ts          # FCM registration + in-app
│   └── geohash.ts                # Geohash encode/decode/range
├── stores/                       # Zustand state management
│   ├── authStore.ts
│   ├── mapStore.ts
│   ├── incidentStore.ts
│   └── familyStore.ts
├── utils/
│   ├── geofence.ts               # Point-in-polygon algorithms
│   ├── formatters.ts             # Date, distance, reputation formatters
│   ├── validators.ts             # Input validation
│   └── constants.ts              # App-wide constants
├── theme/
│   ├── colors.ts                 # Neon/dark palette
│   ├── typography.ts             # Inter font scales
│   ├── glass.ts                  # Glassy/frosted CSS effects
│   └── animations.ts             # Shared animation configs
├── tasks/
│   └── backgroundLocation.ts     # Expo TaskManager background task
├── assets/
│   ├── badges/                   # Badge icon assets
│   ├── markers/                  # Map marker assets
│   └── animations/               # Lottie animation files
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Composite index definitions
├── firebase.json                 # Firebase project config
└── functions/                    # Cloud Functions source
    ├── src/
    │   ├── index.ts              # Function exports
    │   ├── auth/                 # Auth triggers
    │   ├── incidents/            # Incident triggers
    │   ├── reputation/           # Reputation engine
    │   ├── families/             # Family triggers
    │   ├── kidMode/              # Kid safety triggers
    │   ├── notifications/        # FCM sender
    │   ├── scheduled/            # Cron functions
    │   └── utils/                # Shared utilities
    ├── package.json
    └── tsconfig.json
```

---

## Data Flow Diagrams

### Flow 1: Incident Reporting

```
User taps "Report" on map
        │
        ▼
┌─────────────────┐
│  ReportSheet     │ ── collects: category, description, photo, location
│  (Bottom Sheet)  │
└────────┬────────┘
         │ submit
         ▼
┌─────────────────┐
│  incidents.ts    │ ── write to Firestore /incidents/{id}
│  createIncident()│ ── upload photos to Storage
└────────┬────────┘
         │ Firestore onCreate trigger
         ▼
┌─────────────────┐
│  Cloud Function: │
│  onIncidentCreated│
└────────┬────────┘
         │
    ┌────┼────────────────────┐
    │    │                    │
    ▼    ▼                    ▼
Award    Find nearby      Fan-out
reporter users via        feed items
+10 pts  geohash range    to reporter's
         query             followers
    │    │
    │    ▼
    │  Send FCM push
    │  to nearby users
    │
    ▼
Write /reputationEvents/{id}
    │
    ▼ Firestore onCreate trigger
┌─────────────────┐
│  onReputation    │ ── recalculate level
│  Change          │ ── check Guardian threshold
│                  │ ── update /users/{uid}
└─────────────────┘
```

### Flow 2: Kid Safe Zone Monitoring

```
Kid's device (background task)
        │
        │ Location update every 15s
        ▼
┌─────────────────┐
│  RTDB write      │ ── /families/{gid}/locations/{kidUid}
│  { lat, lng,     │
│    batteryLevel } │
└────────┬────────┘
         │ RTDB onWrite trigger
         ▼
┌─────────────────────────┐
│  Cloud Function:         │
│  onKidLocationChange     │
│                          │
│  1. Load safe zones from │
│     /kidProfiles/{id}/   │
│     safeZones/*          │
│                          │
│  2. Point-in-polygon     │
│     check for each zone  │
│                          │
│  3. Update isInSafeZone  │
│     on location doc      │
└────────┬────────────────┘
         │
    ┌────┴─────────────┐
    │                  │
    ▼                  ▼
  IN ZONE           OUT OF ZONE
  (no action)           │
                        ▼
              ┌─────────────────┐
              │ Write to         │
              │ /notifications/  │
              │ {parentUid}/     │
              │ items/{id}       │
              │                  │
              │ Send FCM push    │
              │ to all parent    │
              │ UIDs             │
              └─────────────────┘
```

### Flow 3: Location Sharing

```
User taps "Share Location"
        │
        ▼
┌─────────────────┐
│  Select duration │ ── 1h / 4h / 8h / 24h / indefinite
│  Select fuzzy?   │ ── ±200m offset toggle
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloud Function: │ ── generates UUID shareToken
│  generateShare   │ ── writes /locationShares/{id}
│  Token           │ ── returns URL: attention.app/live/{token}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User shares     │ ── via system share sheet (SMS, WhatsApp, etc.)
│  the link        │
└─────────────────┘
         
Viewer opens link:
         │
         ▼
┌─────────────────┐
│  Web Viewer      │ ── React SPA (no auth needed)
│  (React app)     │ ── query /locationShares where shareToken == token
│                  │ ── if active: listen to /liveLocations/{ownerUid}
│                  │ ── if fuzzy: apply ±200m offset before rendering
│                  │ ── show map with live pin
└─────────────────┘

Scheduled Function (every 5 min):
  └── Query /locationShares where expiresAt < now && isActive == true
      └── Set isActive: false
```

---

## State Management

Using **Zustand** for lightweight, TypeScript-friendly state management.

| Store | Responsibility |
|-------|---------------|
| `authStore` | Current user, auth state, login/logout actions |
| `mapStore` | Map camera position, visible region, selected marker |
| `incidentStore` | Nearby incidents cache, filters, selected incident |
| `familyStore` | Active family group, member locations, kid profiles |

Firestore listeners (real-time) feed directly into Zustand stores via `onSnapshot` subscriptions managed in hooks.

---

## Security Layers

```
Layer 1: Firebase Auth
├── Email/password + Google + Apple providers
├── Optional MFA (TOTP)
└── Custom claims for Guardian status

Layer 2: Firestore Security Rules
├── Users can only write their own documents
├── Reputation events are write-protected (Cloud Functions only)
├── Family data accessible only to members
├── Kid profiles accessible only to linked parents
└── Badge definitions are read-only

Layer 3: Cloud Functions Validation
├── Input sanitization on all callable functions
├── Rate limiting (daily report cap enforced server-side)
├── Reputation transactions are atomic
└── Geohash validation on incident creation

Layer 4: Client-Side Privacy
├── Ghost mode (hide from public map)
├── Fuzzy location sharing (±200m offset)
├── Encrypted location history
├── Scheduled sharing windows
└── Full account deletion (GDPR)
```

---

## Scaling Strategy

| Component | Strategy | Threshold |
|-----------|----------|-----------|
| Firestore reads | Geohash-based queries limit scan range | <1000 docs per query |
| RTDB live locations | Shard by geohash prefix (`/liveLocations/{geohash2}/{uid}`) | >50k concurrent users |
| Cloud Functions | Regional deployment, min instances for cold start | >100 invocations/sec |
| FCM | Topic-based for area alerts, targeted for personal | N/A (Google-managed) |
| Storage (photos) | Compressed to 800px, CDN via Firebase Hosting | >1TB |
| Map markers | Client-side clustering, viewport-based loading | >500 visible markers |
