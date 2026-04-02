# Attention — Development Roadmap

> **Stack:** React Native + Expo (SDK 51+) · Firebase (Firestore, Auth, RTDB, Functions, FCM, Storage) · Google Maps Platform
> **Timeline:** 9 months across 4 phases

---

## Phase 1 — Foundation (Months 1–2)

### Sprint 1 (Weeks 1–2): Project Scaffolding & Auth

| Task | Details |
|------|---------|
| Expo init | `expo-router` file-based navigation, TypeScript strict mode |
| Firebase project | Create project, enable Auth (Email + Google + Apple), Firestore, RTDB |
| Auth flow | Sign-up / Sign-in / Forgot password screens |
| User profile | `/users/{uid}` document creation on first sign-up |
| Firestore security rules | Base rules: authenticated read/write on own documents |
| CI/CD | EAS Build + EAS Submit pipeline, preview builds on PR |

**Milestone:** User can register, log in, and see an empty home screen.

### Sprint 2 (Weeks 3–4): Core Map & Location

| Task | Details |
|------|---------|
| Google Maps integration | `react-native-maps` with Google provider, 3D-style map with custom styling (dark theme) |
| Location permissions | Foreground + background permission flow with graceful degradation |
| Real-time user location | Expo `Location.watchPositionAsync()`, write to RTDB `/liveLocations/{uid}` |
| Map markers | Animated custom markers for user position (pulsing neon dot) |
| Geohash utility | Generate geohash from lat/lng for all GeoPoint writes (powers radius queries) |

**Milestone:** User sees a styled dark map with their live position marker.

### Sprint 3 (Weeks 5–6): Incident Reporting (MVP)

| Task | Details |
|------|---------|
| Report modal | Bottom-sheet UI: category picker (Robbery, Accident, Suspicious Activity, Hazard, Police, Fire, Medical, Other), description, optional photo |
| Incident creation | Write to `/incidents/{id}` with geohash, category, timestamp, reporter UID |
| Map incident markers | Category-specific animated markers with neon glow, clustered at far zoom |
| Incident detail sheet | Tap marker → see details, reporter reputation badge, timestamp |
| Photo upload | Firebase Storage `/incidents/{id}/photos/`, compressed to 800px max width |

**Milestone:** Users can report incidents and see them on the map.

### Sprint 4 (Weeks 7–8): Reputation System v1

| Task | Details |
|------|---------|
| Reputation engine | Cloud Function: atomic transactions for point changes on `/users/{uid}` |
| Confirmation mechanic | Other users tap "Confirm" or "Deny" on incidents; each triggers reputation event |
| Reputation events log | Every point change → `/reputationEvents/{id}` (audit trail) |
| Level calculation | Cloud Function computes level (0–30) from total points, updates user doc |
| Badge display | Badge icon + name shown on profile and next to reports |
| Daily report limit | Max 10 reports/day for levels 0–5, scaling up with reputation |

**Milestone:** Full reputation loop — report → confirm → earn points → level up.

---

## Phase 2 — Social & Safety (Months 3–5)

### Sprint 5 (Weeks 9–10): GuardScan Radar

| Task | Details |
|------|---------|
| GuardScan UI | Circular radar overlay centered on user, animated sweep line |
| Radius config | Slider: 500m → 1km → 2km → 3km → 5km |
| Geohash range query | Query `/incidents` where geohash within calculated range, filter by distance |
| Scan results | List of nearby active incidents sorted by distance, with severity indicator |
| Push on new nearby | Cloud Function: when new incident created, check nearby users via geohash, send FCM |

**Milestone:** User activates GuardScan and sees a radar sweep revealing nearby incidents.

### Sprint 6 (Weeks 11–12): Micro Social Network

| Task | Details |
|------|---------|
| User profiles (public) | Display name, avatar, level badge, stats (reports, confirmations, reputation) |
| Follow system | `/users/{uid}/following/{targetUid}` subcollection |
| Activity feed | `/feed/{uid}/items/{id}` — fan-out on write from Cloud Functions |
| Comments on incidents | `/incidents/{id}/comments/{commentId}` with reputation-gated posting |
| Reactions | Quick reactions (🔥 Useful, ⚠️ Be Careful, 👀 Watching) on incidents |

**Milestone:** Users can follow each other, comment on incidents, and see a personalized feed.

### Sprint 7 (Weeks 13–14): Location Sharing

| Task | Details |
|------|---------|
| Share creation | Generate UUID token → write `/locationShares/{id}` with expiry (1h/4h/8h/24h/indefinite) |
| Shareable link | `attention.app/live/{token}` — web viewer (no account needed) |
| Live tracking | RTDB listener on `/liveLocations/{uid}`, relay to share viewers |
| Revoke control | Owner sets `isActive: false` → immediate stop |
| Privacy controls | Fuzzy mode (±200m random offset), scheduled sharing windows |

**Milestone:** User can share a live location link that anyone can view in a browser.

### Sprint 8 (Weeks 15–18): Family Mode

| Task | Details |
|------|---------|
| Family group creation | `/families/{groupId}` with admin UID, invite code generation |
| Member management | Invite via code/link/QR, accept/decline flow |
| Family map view | Dedicated map showing all family members' live positions |
| Family location sync | RTDB `/families/{groupId}/locations/{uid}` updated every 30s via Cloud Function bridge |
| Family chat | `/families/{groupId}/messages/{id}` — simple text + location messages |
| Check-in mechanic | Quick "I'm safe" button → notifies all family members |

**Milestone:** Family members see each other on a private map and can chat.

---

## Phase 3 — Protection & Intelligence (Months 5–7)

### Sprint 9 (Weeks 19–21): Kid Mode

| Task | Details |
|------|---------|
| Kid profile setup | Parent creates `/kidProfiles/{kidId}` with child's device UID |
| Safe zones | Polygon drawing tool on map → stored as array of coordinates |
| Background tracking | `expo-task-manager` background location task on kid's device (screen-off capable) |
| Geofence monitoring | Cloud Function watches `/families/{groupId}/locations/{kidUid}`, point-in-polygon check |
| Breach alerts | Instant FCM + in-app notification to parent when kid leaves safe zone |
| SOS button | Kid presses SOS → immediate alert to all linked parents with exact location |
| Kid dashboard | Parent sees: current location, location history (last 24h), safe zone status, battery level |
| Restricted UI | Kid's app: no social features, no incident details, simplified map |

**Milestone:** Parent can track kid in real-time, get alerts on safe zone breaches, and kid can send SOS.

### Sprint 10 (Weeks 22–24): Advanced Privacy & Security

| Task | Details |
|------|---------|
| Full privacy mode | Ghost mode: user invisible on public map, only visible to family |
| Location history | `/users/{uid}/locationHistory/{date}` — encrypted daily summaries |
| Data encryption | Sensitive fields encrypted at rest with user-specific key |
| Account deletion | Full GDPR-compliant deletion flow (all subcollections, storage, RTDB) |
| Block/Report users | `/reports/{id}` collection, moderation queue for Guardians |
| Two-factor auth | Optional TOTP via Firebase MFA |

**Milestone:** Users have full control over their privacy and data.

### Sprint 11 (Weeks 25–27): Smart Alerts & Analytics

| Task | Details |
|------|---------|
| Incident heatmap | Aggregate incident density → heatmap layer on map |
| Trend detection | Cloud Function: analyze incident frequency by area/time → "High Activity Zone" alerts |
| Route safety scoring | Given A→B route, score based on incident density along path |
| Personal analytics | Dashboard: your reports, confirmations, reputation graph over time |
| Push notification preferences | Granular controls: by category, radius, time window |

**Milestone:** Users see smart insights about area safety and their own activity.

---

## Phase 4 — Scale & Guardian Tier (Months 7–9)

### Sprint 12 (Weeks 28–30): Guardian Tier (200,000 pts)

| Task | Details |
|------|---------|
| Guardian unlock | `isGuardian: true` flag, separate from level system |
| Incident verification | Guardians can mark incidents as "Verified" (gold badge on marker) |
| Report review | Guardians review flagged content, can dismiss or escalate |
| Moderation dashboard | In-app admin panel: pending reports, flagged users, incident quality |
| Guardian analytics | Access to area-wide statistics, incident resolution rates |
| Guardian badge | Distinct animated badge with special effects |

**Milestone:** Top users become distributed moderators with verification powers.

### Sprint 13 (Weeks 31–33): Performance & Scale

| Task | Details |
|------|---------|
| Firestore composite indexes | Optimize all geohash + timestamp + category queries |
| RTDB sharding | Shard `/liveLocations` by geohash prefix for horizontal scale |
| Cloud Function optimization | Cold start reduction, regional deployment, memory tuning |
| Offline support | Firestore persistence, queue reports when offline |
| Map performance | Marker virtualization, progressive loading by viewport |
| CDN for assets | Firebase Hosting CDN for incident photos |

**Milestone:** App handles 100k+ concurrent users with <200ms response times.

### Sprint 14 (Weeks 34–36): Launch Preparation

| Task | Details |
|------|---------|
| App Store assets | Screenshots, preview video, description in EN/PT-BR |
| Landing page | `attention.app` marketing site + live share viewer |
| Beta program | TestFlight + Google Play internal testing, 500 users |
| Monitoring | Firebase Crashlytics, Performance Monitoring, Analytics dashboards |
| Legal | Terms of service, privacy policy, data processing agreements |
| Localization | EN, PT-BR, ES initial languages |

**Milestone:** App submitted to App Store and Google Play.

---

## Timeline Summary

```
Month 1  ██████ Phase 1: Foundation
Month 2  ██████ Phase 1: Foundation
Month 3  ██████ Phase 2: Social & Safety
Month 4  ██████ Phase 2: Social & Safety
Month 5  ██████ Phase 2 → Phase 3 transition
Month 6  ██████ Phase 3: Protection & Intelligence
Month 7  ██████ Phase 3 → Phase 4 transition
Month 8  ██████ Phase 4: Scale & Guardian
Month 9  ██████ Phase 4: Launch
```

## Key Dependencies

| Dependency | Required By | Notes |
|-----------|-------------|-------|
| Google Maps API Key | Sprint 2 | Maps, Geocoding, Directions APIs enabled |
| Firebase Blaze Plan | Sprint 5 | Cloud Functions, outbound networking |
| Apple Developer Account | Sprint 14 | App Store submission |
| Google Play Console | Sprint 14 | Play Store submission |
| Domain (attention.app) | Sprint 7 | Location sharing links |
| FCM Setup | Sprint 5 | Push notifications (iOS + Android) |
