# Attention — Firestore Database Schema

> **Engine:** Cloud Firestore (Native mode) + Firebase Realtime Database (for live location only)
> **Convention:** camelCase fields, ISO 8601 timestamps, geohash-encoded GeoPoints

---

## Collection Map

```
Firestore
├── /users/{uid}
│   ├── /following/{targetUid}
│   ├── /followers/{followerUid}
│   ├── /locationHistory/{dateYMD}
│   └── /settings/{settingsDoc}
├── /incidents/{incidentId}
│   ├── /confirmations/{uid}
│   └── /comments/{commentId}
├── /families/{groupId}
│   ├── /members/{uid}
│   ├── /locations/{uid}
│   └── /messages/{messageId}
├── /kidProfiles/{kidId}
│   └── /safeZones/{zoneId}
├── /locationShares/{shareId}
├── /reputationEvents/{eventId}
├── /badges/{badgeId}
├── /reports/{reportId}
├── /notifications/{uid}
│   └── /items/{notificationId}
└── /feed/{uid}
    └── /items/{feedItemId}

Realtime Database
├── /liveLocations/{uid}
├── /families/{groupId}/locations/{uid}
└── /presence/{uid}
```

---

## 1. `/users/{uid}`

Primary user document. Created on first sign-up.

| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string` | Firebase Auth UID (matches document ID) |
| `displayName` | `string` | Public display name |
| `email` | `string` | Email address (private) |
| `photoURL` | `string \| null` | Avatar URL (Firebase Storage) |
| `phone` | `string \| null` | Phone number (private, optional) |
| `reputation` | `number` | Total reputation points (default: 0) |
| `level` | `number` | Current level 0–30 (computed from reputation) |
| `levelName` | `string` | Current badge name (e.g., "Observador Anônimo") |
| `levelIcon` | `string` | Current badge icon identifier |
| `isGuardian` | `boolean` | True when reputation >= 200,000 (separate from level) |
| `isProbationary` | `boolean` | True if user is in probationary mode (rep < 0 recovery) |
| `totalReports` | `number` | Lifetime incident reports created |
| `totalConfirmations` | `number` | Lifetime confirmations given |
| `totalDenials` | `number` | Lifetime denials given |
| `reportsToday` | `number` | Reports created today (reset at midnight UTC) |
| `lastReportDate` | `string` | ISO date of last report (for daily reset logic) |
| `dailyReportLimit` | `number` | Max reports allowed today (scales with level) |
| `isGhostMode` | `boolean` | When true, user hidden from public map |
| `isFamilyOnly` | `boolean` | Location visible only to family groups |
| `familyGroupIds` | `string[]` | Array of family group IDs user belongs to |
| `kidProfileIds` | `string[]` | Array of kid profile IDs linked as parent |
| `fcmTokens` | `string[]` | Device FCM tokens for push notifications |
| `locale` | `string` | Preferred language (en, pt-BR, es) |
| `createdAt` | `timestamp` | Account creation timestamp |
| `updatedAt` | `timestamp` | Last profile update |
| `lastActiveAt` | `timestamp` | Last app open / interaction |
| `isDeleted` | `boolean` | Soft delete flag |

### Subcollection: `/users/{uid}/following/{targetUid}`

| Field | Type | Description |
|-------|------|-------------|
| `followedAt` | `timestamp` | When the follow was created |

### Subcollection: `/users/{uid}/followers/{followerUid}`

| Field | Type | Description |
|-------|------|-------------|
| `followedAt` | `timestamp` | When the follower started following |

### Subcollection: `/users/{uid}/locationHistory/{dateYMD}`

Daily location summary. Document ID is date string like `2026-04-01`.

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | Date (YYYY-MM-DD) |
| `points` | `array<GeoPointEntry>` | Array of {lat, lng, timestamp} sampled every 5 min |
| `encryptedData` | `string \| null` | Optional client-side encrypted blob of detailed track |
| `totalDistance` | `number` | Estimated distance traveled in meters |

### Subcollection: `/users/{uid}/settings/{settingsDoc}`

Single document `preferences`.

| Field | Type | Description |
|-------|------|-------------|
| `pushEnabled` | `boolean` | Master push notification toggle |
| `pushCategories` | `string[]` | Incident categories to receive alerts for |
| `pushRadius` | `number` | Alert radius in meters (500–5000) |
| `pushQuietStart` | `string \| null` | Quiet hours start (HH:mm) |
| `pushQuietEnd` | `string \| null` | Quiet hours end (HH:mm) |
| `mapStyle` | `string` | Map style preference (dark, satellite, terrain) |
| `guardScanDefaultRadius` | `number` | Default GuardScan radius in meters |
| `language` | `string` | Override system language |
| `twoFactorEnabled` | `boolean` | MFA toggle |

---

## 2. `/incidents/{incidentId}`

Every reported incident.

| Field | Type | Description |
|-------|------|-------------|
| `incidentId` | `string` | Auto-generated document ID |
| `reporterUid` | `string` | UID of the user who created the report |
| `reporterLevel` | `number` | Reporter's level at time of creation (snapshot) |
| `reporterBadge` | `string` | Reporter's badge name at time of creation |
| `category` | `string` | Enum: `robbery`, `accident`, `suspicious`, `hazard`, `police`, `fire`, `medical`, `traffic`, `noise`, `other` |
| `severity` | `string` | Enum: `low`, `medium`, `high`, `critical` |
| `title` | `string` | Short description (max 120 chars) |
| `description` | `string` | Detailed description (max 1000 chars) |
| `location` | `GeoPoint` | Firestore GeoPoint (lat, lng) |
| `geohash` | `string` | Geohash of location (9 chars precision, powers radius queries) |
| `address` | `string \| null` | Reverse-geocoded address string |
| `photoURLs` | `string[]` | Array of Firebase Storage URLs (max 3 photos) |
| `confirmCount` | `number` | Number of users who confirmed |
| `denyCount` | `number` | Number of users who denied |
| `credibilityScore` | `number` | Weighted score: (confirms × reporter_level_weight) - denials |
| `status` | `string` | Enum: `active`, `resolved`, `expired`, `removed` |
| `isVerified` | `boolean` | True if verified by a Guardian |
| `verifiedByUid` | `string \| null` | Guardian who verified |
| `verifiedAt` | `timestamp \| null` | Verification timestamp |
| `reactions` | `map` | `{ useful: number, beCareful: number, watching: number }` |
| `commentCount` | `number` | Number of comments |
| `expiresAt` | `timestamp` | Auto-expire time (default: createdAt + 4 hours) |
| `createdAt` | `timestamp` | Report creation time |
| `updatedAt` | `timestamp` | Last update time |

### Subcollection: `/incidents/{incidentId}/confirmations/{uid}`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string` | User who confirmed/denied |
| `type` | `string` | `confirm` or `deny` |
| `userLevel` | `number` | User's level at time of action |
| `createdAt` | `timestamp` | Action timestamp |

### Subcollection: `/incidents/{incidentId}/comments/{commentId}`

| Field | Type | Description |
|-------|------|-------------|
| `commentId` | `string` | Auto-generated |
| `authorUid` | `string` | Comment author UID |
| `authorName` | `string` | Display name snapshot |
| `authorLevel` | `number` | Level snapshot |
| `text` | `string` | Comment text (max 500 chars) |
| `createdAt` | `timestamp` | Comment timestamp |
| `isHidden` | `boolean` | Hidden by moderator/Guardian |

---

## 3. `/families/{groupId}`

Family/private group for location sharing.

| Field | Type | Description |
|-------|------|-------------|
| `groupId` | `string` | Auto-generated document ID |
| `name` | `string` | Group name (e.g., "Silva Family") |
| `adminUid` | `string` | Group creator/admin UID |
| `adminUids` | `string[]` | Co-admins who can manage members |
| `inviteCode` | `string` | 8-char alphanumeric join code |
| `inviteCodeExpiresAt` | `timestamp` | Code expiry (regenerated by admin) |
| `memberCount` | `number` | Current member count |
| `maxMembers` | `number` | Max members allowed (default: 20) |
| `photoURL` | `string \| null` | Group avatar |
| `createdAt` | `timestamp` | Group creation time |
| `updatedAt` | `timestamp` | Last modification |

### Subcollection: `/families/{groupId}/members/{uid}`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string` | Member UID |
| `displayName` | `string` | Name snapshot |
| `role` | `string` | Enum: `admin`, `member`, `kid` |
| `locationSharingEnabled` | `boolean` | Whether this member shares location with group |
| `joinedAt` | `timestamp` | When member joined |

### Subcollection: `/families/{groupId}/locations/{uid}`

Bridged from RTDB every 30 seconds by Cloud Function.

| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string` | Member UID |
| `location` | `GeoPoint` | Current position |
| `geohash` | `string` | Geohash of position |
| `heading` | `number` | Compass heading in degrees |
| `speed` | `number` | Speed in m/s |
| `batteryLevel` | `number \| null` | Device battery percentage (kid mode) |
| `isInSafeZone` | `boolean \| null` | Whether kid is inside their safe zone |
| `updatedAt` | `timestamp` | Last update time |

### Subcollection: `/families/{groupId}/messages/{messageId}`

| Field | Type | Description |
|-------|------|-------------|
| `messageId` | `string` | Auto-generated |
| `senderUid` | `string` | Sender UID |
| `senderName` | `string` | Display name snapshot |
| `type` | `string` | Enum: `text`, `location`, `checkIn`, `alert` |
| `text` | `string \| null` | Message text |
| `location` | `GeoPoint \| null` | Shared location (for type=location) |
| `createdAt` | `timestamp` | Sent timestamp |

---

## 4. `/kidProfiles/{kidId}`

Kid mode configuration. Linked to a user account on the kid's device.

| Field | Type | Description |
|-------|------|-------------|
| `kidId` | `string` | Auto-generated document ID |
| `kidUid` | `string` | Firebase Auth UID of kid's device account |
| `kidName` | `string` | Kid's display name |
| `kidPhotoURL` | `string \| null` | Kid's avatar |
| `parentUids` | `string[]` | Array of parent UIDs who receive alerts |
| `familyGroupId` | `string` | Family group this kid belongs to |
| `isActive` | `boolean` | Whether kid mode is currently active |
| `backgroundTrackingEnabled` | `boolean` | Whether background location is active |
| `trackingIntervalMs` | `number` | Location update interval (default: 15000 = 15s) |
| `alertOnZoneExit` | `boolean` | Push alert when kid leaves any safe zone |
| `alertOnLowBattery` | `boolean` | Alert when kid's device < 15% battery |
| `alertOnSOSPress` | `boolean` | Alert on SOS button press |
| `sosContactNumbers` | `string[]` | Phone numbers to SMS on SOS (in addition to push) |
| `restrictedUI` | `boolean` | If true, kid sees simplified UI (no social, no incident details) |
| `createdAt` | `timestamp` | Profile creation time |
| `updatedAt` | `timestamp` | Last config update |

### Subcollection: `/kidProfiles/{kidId}/safeZones/{zoneId}`

| Field | Type | Description |
|-------|------|-------------|
| `zoneId` | `string` | Auto-generated |
| `name` | `string` | Zone name (e.g., "School", "Home", "Grandma's") |
| `type` | `string` | Enum: `circle`, `polygon` |
| `center` | `GeoPoint \| null` | Center point (for circle type) |
| `radiusMeters` | `number \| null` | Radius in meters (for circle type) |
| `polygon` | `array<GeoPoint> \| null` | Array of vertices (for polygon type) |
| `isActive` | `boolean` | Whether this zone is actively monitored |
| `schedule` | `map \| null` | Optional: `{ days: string[], startTime: "HH:mm", endTime: "HH:mm" }` |
| `createdAt` | `timestamp` | Zone creation time |

---

## 5. `/locationShares/{shareId}`

Temporary location sharing tokens.

| Field | Type | Description |
|-------|------|-------------|
| `shareId` | `string` | Auto-generated document ID |
| `shareToken` | `string` | UUID v4 token (used in public URL) |
| `ownerUid` | `string` | UID of the sharing user |
| `ownerName` | `string` | Display name snapshot |
| `isActive` | `boolean` | Owner can revoke by setting false |
| `isFuzzy` | `boolean` | If true, add ±200m random offset to shared location |
| `expiresAt` | `timestamp` | Auto-expiry time |
| `duration` | `string` | Enum: `1h`, `4h`, `8h`, `24h`, `indefinite` |
| `viewCount` | `number` | Number of times the link was opened |
| `lastViewedAt` | `timestamp \| null` | Last time someone viewed the link |
| `createdAt` | `timestamp` | Share creation time |

---

## 6. `/reputationEvents/{eventId}`

Immutable audit trail for every reputation point change.

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | `string` | Auto-generated |
| `targetUid` | `string` | User whose reputation changed |
| `triggerUid` | `string \| null` | User who caused the change (null for system) |
| `type` | `string` | Enum: `report_created`, `report_confirmed`, `report_denied`, `confirmation_given`, `confirmation_received`, `denial_received`, `false_report_penalty`, `daily_bonus`, `streak_bonus`, `guardian_verification`, `moderation_action`, `system_adjustment` |
| `points` | `number` | Points added (positive) or removed (negative) |
| `previousReputation` | `number` | Rep before this event |
| `newReputation` | `number` | Rep after this event |
| `previousLevel` | `number` | Level before |
| `newLevel` | `number` | Level after |
| `relatedIncidentId` | `string \| null` | If event relates to an incident |
| `reason` | `string` | Human-readable reason |
| `metadata` | `map` | Extra context (varies by type) |
| `createdAt` | `timestamp` | Event timestamp |

---

## 7. `/badges/{badgeId}`

Badge/level definitions (seeded once, rarely changes).

| Field | Type | Description |
|-------|------|-------------|
| `badgeId` | `string` | Level number as string: "0" through "30", plus "guardian" |
| `level` | `number` | Numeric level (0–30, 31 for Guardian) |
| `name` | `string` | Badge name (e.g., "Observador Anônimo") |
| `nameEN` | `string` | English name |
| `icon` | `string` | Icon identifier / emoji |
| `minReputation` | `number` | Minimum reputation to reach this level |
| `maxReputation` | `number \| null` | Max reputation for this level (null = no cap) |
| `dailyReportLimit` | `number` | Max reports per day at this level |
| `perks` | `string[]` | List of unlocked features |
| `color` | `string` | Hex color for badge display |
| `glowColor` | `string` | Neon glow color for badge |

---

## 8. `/reports/{reportId}`

User-generated reports (abuse, spam, false information).

| Field | Type | Description |
|-------|------|-------------|
| `reportId` | `string` | Auto-generated |
| `reporterUid` | `string` | Who filed the report |
| `targetType` | `string` | Enum: `user`, `incident`, `comment` |
| `targetId` | `string` | UID or document ID of reported entity |
| `reason` | `string` | Enum: `spam`, `harassment`, `false_info`, `inappropriate`, `other` |
| `description` | `string` | Reporter's explanation |
| `status` | `string` | Enum: `pending`, `reviewing`, `resolved`, `dismissed` |
| `reviewedByUid` | `string \| null` | Guardian or admin who reviewed |
| `resolution` | `string \| null` | Action taken |
| `createdAt` | `timestamp` | Report creation time |
| `resolvedAt` | `timestamp \| null` | Resolution time |

---

## 9. `/notifications/{uid}/items/{notificationId}`

Per-user notification inbox.

| Field | Type | Description |
|-------|------|-------------|
| `notificationId` | `string` | Auto-generated |
| `type` | `string` | Enum: `nearby_incident`, `confirmation_received`, `level_up`, `zone_breach`, `sos_alert`, `family_checkin`, `follow`, `comment`, `guardian_promo`, `system` |
| `title` | `string` | Notification title |
| `body` | `string` | Notification body text |
| `data` | `map` | Payload: `{ incidentId?, familyGroupId?, kidId?, targetScreen? }` |
| `isRead` | `boolean` | Read status |
| `createdAt` | `timestamp` | Notification timestamp |

---

## 10. `/feed/{uid}/items/{feedItemId}`

Personalized activity feed (fan-out on write).

| Field | Type | Description |
|-------|------|-------------|
| `feedItemId` | `string` | Auto-generated |
| `type` | `string` | Enum: `new_incident`, `incident_verified`, `user_leveled_up`, `user_became_guardian`, `follow_report` |
| `actorUid` | `string` | User who performed the action |
| `actorName` | `string` | Display name snapshot |
| `actorLevel` | `number` | Level snapshot |
| `targetId` | `string \| null` | Related document ID |
| `summary` | `string` | Human-readable summary |
| `createdAt` | `timestamp` | Event timestamp |

---

## Realtime Database Structure

Used exclusively for high-frequency location updates where Firestore write costs would be prohibitive.

### `/liveLocations/{uid}`

```json
{
  "lat": 40.7128,
  "lng": -74.0060,
  "geohash": "dr5regw3p",
  "heading": 180.5,
  "speed": 1.2,
  "accuracy": 10.0,
  "timestamp": 1711929600000,
  "isOnline": true
}
```

### `/families/{groupId}/locations/{uid}`

Same structure as `/liveLocations/{uid}`, plus:

```json
{
  "lat": 40.7128,
  "lng": -74.0060,
  "geohash": "dr5regw3p",
  "heading": 180.5,
  "speed": 1.2,
  "batteryLevel": 85,
  "isInSafeZone": true,
  "timestamp": 1711929600000
}
```

### `/presence/{uid}`

```json
{
  "isOnline": true,
  "lastSeen": 1711929600000,
  "device": "iPhone 15 Pro"
}
```

---

## Composite Indexes

These must be created in Firestore for the app's queries to work.

| Collection | Fields | Query Purpose |
|-----------|--------|---------------|
| `incidents` | `geohash ASC, createdAt DESC` | GuardScan: nearby incidents sorted by recency |
| `incidents` | `category ASC, geohash ASC, createdAt DESC` | Category-filtered nearby incidents |
| `incidents` | `status ASC, geohash ASC, createdAt DESC` | Active incidents in area |
| `incidents` | `reporterUid ASC, createdAt DESC` | User's own reports |
| `reputationEvents` | `targetUid ASC, createdAt DESC` | User's reputation history |
| `reputationEvents` | `type ASC, createdAt DESC` | Events by type |
| `locationShares` | `shareToken ASC, isActive ASC` | Token lookup for live share |
| `reports` | `status ASC, createdAt ASC` | Moderation queue (oldest first) |
| `notifications.items` | `isRead ASC, createdAt DESC` | Unread notifications first |
| `feed.items` | `createdAt DESC` | Feed timeline |

---

## Security Rules Summary

```
users/{uid}:        read: auth; write: auth && uid == request.auth.uid
incidents:          read: auth; create: auth && validated; update: auth (owner or Guardian)
families/{gid}:     read: auth && isMember; write: auth && isAdmin
kidProfiles:        read: auth && isParent; write: auth && isParent
locationShares:     read: hasToken || isOwner; write: auth && isOwner
reputationEvents:   read: auth && isTarget; write: DENY (Cloud Functions only)
badges:             read: auth; write: DENY (admin seeded)
reports:            create: auth; read: auth && (isReporter || isGuardian)
notifications:      read: auth && uid match; write: DENY (Cloud Functions only)
```
