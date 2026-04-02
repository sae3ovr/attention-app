# Attention — User Workflows & Journeys

> Complete flow documentation for every major user journey in the app.

---

## 1. First Launch & Onboarding

```
App Launch
    │
    ▼
┌────────────────┐     ┌────────────────┐
│ Splash Screen  │────▶│ Auth Check     │
│ (Animated logo)│     │                │
└────────────────┘     └───────┬────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
           No Auth Token           Has Auth Token
                    │                     │
                    ▼                     ▼
           ┌────────────────┐    ┌────────────────┐
           │ Sign-In Screen │    │ Verify Token   │
           │ ─────────────  │    │ (Firebase SDK) │
           │ • Email/Pass   │    └───────┬────────┘
           │ • Google       │            │
           │ • Apple        │     ┌──────┴──────┐
           │ • Sign Up link │     │             │
           └───────┬────────┘   Valid       Expired
                   │              │             │
                   ▼              │             ▼
           ┌────────────────┐    │    Back to Sign-In
           │ Sign-Up Flow   │    │
           │ ─────────────  │    │
           │ 1. Email/Pass  │    │
           │ 2. Display Name│    │
           │ 3. Avatar      │    │
           │ (optional)     │    │
           └───────┬────────┘    │
                   │              │
                   ▼              │
           ┌────────────────┐    │
           │ Cloud Function:│    │
           │ onUserCreated  │    │
           │ • Create user  │    │
           │   doc          │    │
           │ • Set level 0  │    │
           │ • Init settings│    │
           └───────┬────────┘    │
                   │              │
                   ▼              ▼
           ┌──────────────────────────┐
           │ Onboarding Walkthrough   │
           │ (3 screens, skip-able)   │
           │ 1. "Report incidents"    │
           │ 2. "Build reputation"    │
           │ 3. "Protect your family" │
           └────────────┬─────────────┘
                        │
                        ▼
              ┌────────────────┐
              │ Location       │
              │ Permission     │
              │ Request        │
              │ (foreground)   │
              └───────┬────────┘
                      │
               ┌──────┴──────┐
               │             │
            Granted       Denied
               │             │
               ▼             ▼
          ┌──────────┐  ┌──────────────┐
          │ Map Home │  │ Map Home     │
          │ (full    │  │ (degraded:   │
          │ features)│  │ no GuardScan,│
          │          │  │ no live pin) │
          └──────────┘  └──────────────┘
```

---

## 2. Incident Reporting Flow

```
On Map Screen ──▶ Long-press map OR tap "+" FAB
                        │
                        ▼
              ┌────────────────────┐
              │ Report Bottom Sheet│
              │                    │
              │ Step 1: Category   │
              │ ┌──────┬─────────┐ │
              │ │Robbery│Accident│ │
              │ │Suspect│Hazard  │ │
              │ │Police │Fire    │ │
              │ │Medical│Traffic │ │
              │ │Noise  │Other   │ │
              │ └──────┴─────────┘ │
              └────────┬───────────┘
                       │ select
                       ▼
              ┌────────────────────┐
              │ Step 2: Details    │
              │ • Severity slider  │
              │   (low→critical)   │
              │ • Title (required) │
              │ • Description      │
              │   (optional)       │
              │ • Photo (optional) │
              │   camera or gallery│
              └────────┬───────────┘
                       │ next
                       ▼
              ┌────────────────────┐
              │ Step 3: Confirm    │
              │ Location           │
              │ • Map preview with │
              │   draggable pin    │
              │ • Address preview  │
              │ • "Submit Report"  │
              └────────┬───────────┘
                       │
                  ┌────┴────┐
                  │         │
              Daily     Under
              limit     limit
              reached       │
                  │         ▼
                  ▼    ┌──────────────┐
              Show     │ Upload photo │
              error    │ to Storage   │
              toast    │              │
                       │ Write to     │
                       │ /incidents   │
                       └──────┬───────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ Success!     │
                       │ "+10 pts"    │
                       │ animation    │
                       │              │
                       │ Marker       │
                       │ appears on   │
                       │ map with     │
                       │ neon glow    │
                       └──────────────┘
```

---

## 3. Incident Interaction Flow

```
User sees incident marker on map
              │
              │ tap
              ▼
    ┌────────────────────┐
    │ Incident Detail    │
    │ Bottom Sheet       │
    │                    │
    │ ┌────────────────┐ │
    │ │ Category icon  │ │
    │ │ Title          │ │
    │ │ Reporter badge │ │
    │ │ Time ago       │ │
    │ │ Photo (if any) │ │
    │ │ Description    │ │
    │ │                │ │
    │ │ Confirmations: │ │
    │ │ 12 ✓  3 ✗     │ │
    │ │                │ │
    │ │ [Confirm][Deny]│ │
    │ │                │ │
    │ │ Reactions:     │ │
    │ │ 🔥 45  ⚠️ 23  │ │
    │ │ 👀 67          │ │
    │ │                │ │
    │ │ Comments (8)   │ │
    │ └────────────────┘ │
    └────────┬───────────┘
             │
    ┌────────┼────────┬──────────┐
    │        │        │          │
    ▼        ▼        ▼          ▼
 Confirm   Deny    React     Comment
    │        │        │          │
    ▼        ▼        ▼          ▼
 +5 pts   Record  Increment  Post comment
 to       denial  reaction   (level >= 2
 reporter          counter    required)
 +3 pts            on doc
 to self
```

---

## 4. GuardScan Radar Flow

```
User taps "Scan" tab
        │
        ▼
┌─────────────────────┐
│ GuardScan Screen     │
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │   Radar Circle   │ │
│ │   (animated      │ │
│ │    sweep line)   │ │
│ │                  │ │
│ │   User dot at    │ │
│ │   center         │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
│ Radius: [====●===]  │
│         500m    5km  │
│                      │
│ [Start Scan]         │
└────────┬─────────────┘
         │ tap start
         ▼
┌─────────────────────┐
│ Scanning...          │
│                      │
│ 1. Get user location │
│ 2. Calculate geohash │
│    range for radius  │
│ 3. Query /incidents  │
│    where geohash in  │
│    range AND status  │
│    == active         │
│ 4. Filter by actual  │
│    distance (not     │
│    just geohash box) │
│ 5. Sort by distance  │
└────────┬─────────────┘
         │
         ▼
┌─────────────────────┐
│ Scan Results         │
│                      │
│ Radar shows dots at  │
│ relative positions   │
│ colored by severity  │
│ (green/yellow/red)   │
│                      │
│ ┌──────────────────┐ │
│ │ 🔴 Robbery       │ │
│ │    350m NW       │ │
│ │    12 min ago    │ │
│ ├──────────────────┤ │
│ │ 🟡 Suspicious   │ │
│ │    1.2km E       │ │
│ │    45 min ago    │ │
│ ├──────────────────┤ │
│ │ 🟢 Traffic      │ │
│ │    2.8km S       │ │
│ │    2h ago        │ │
│ └──────────────────┘ │
│                      │
│ Tap any → Incident   │
│ Detail Sheet         │
└──────────────────────┘
```

---

## 5. Family Mode Flow

### 5a. Create Family Group

```
Profile Tab → "Family" → "Create Group"
              │
              ▼
    ┌────────────────────┐
    │ Create Family Group│
    │                    │
    │ Name: [________]   │
    │ Photo: [+]         │
    │                    │
    │ [Create]           │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Cloud Function     │
    │ creates:           │
    │ • /families/{gid}  │
    │ • /families/{gid}/ │
    │   members/{uid}    │
    │   (role: admin)    │
    │ • Generates invite │
    │   code (8 chars)   │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Invite Members     │
    │                    │
    │ Code: ABC12XYZ     │
    │ [Copy] [Share]     │
    │ [QR Code]          │
    │                    │
    │ Or share link:     │
    │ attention.app/     │
    │ join/ABC12XYZ      │
    └────────────────────┘
```

### 5b. Join Family Group

```
Received invite code/link
        │
        ▼
┌─────────────────────┐
│ Join Group Screen    │
│                     │
│ Enter code:         │
│ [________]          │
│                     │
│ OR scan QR          │
│                     │
│ [Join]              │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Verify code exists  │
│ and not expired     │
│                     │
│ Check member count  │
│ < maxMembers        │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
  Valid    Invalid
    │         │
    ▼         ▼
 Add to    Error:
 members   "Code expired"
 subcoll   or "Group full"
    │
    ▼
 ┌────────────────────┐
 │ Welcome to         │
 │ "Silva Family"!    │
 │                    │
 │ Enable location    │
 │ sharing with       │
 │ this group?        │
 │ [Yes] [Not now]    │
 └────────────────────┘
```

### 5c. Family Map View

```
Family Tab → Select Group
        │
        ▼
┌─────────────────────────────────┐
│  Family Map                      │
│  ┌─────────────────────────────┐ │
│  │                             │ │
│  │    👩 Mom (2 min ago)       │ │
│  │         ●                   │ │
│  │                             │ │
│  │              ● 👨 Dad       │ │
│  │              (live)         │ │
│  │                             │ │
│  │    👦 Lucas (Kid Mode)      │ │
│  │    ●  ⬡ Safe Zone: School  │ │
│  │    [In Zone ✓]              │ │
│  │                             │ │
│  └─────────────────────────────┘ │
│                                  │
│  Members (3/20)                  │
│  ┌─────────────────┐            │
│  │ 👩 Mom    Live  │            │
│  │ 👨 Dad    Live  │            │
│  │ 👦 Lucas  Safe ✓│            │
│  └─────────────────┘            │
│                                  │
│  [Chat] [Check-In: I'm Safe]    │
└──────────────────────────────────┘
```

---

## 6. Kid Mode Flow

### 6a. Parent Sets Up Kid Mode

```
Family Group → "Add Kid Profile"
        │
        ▼
┌─────────────────────────┐
│ Kid Profile Setup        │
│                          │
│ Step 1: Kid's Info       │
│ Name: [________]         │
│ Photo: [+]               │
│                          │
│ Step 2: Link Device      │
│ "Sign in on kid's device │
│  with these credentials" │
│ Email: kid-lucas@...     │
│ Temp Password: xxxxxxxx  │
│                          │
│ Step 3: Safe Zones       │
│ [+ Add Safe Zone]        │
│ ┌─────────────────┐      │
│ │ 🏠 Home         │      │
│ │ Circle, r=200m  │      │
│ │ Always active    │      │
│ ├─────────────────┤      │
│ │ 🏫 School       │      │
│ │ Polygon (drawn) │      │
│ │ Mon-Fri 7am-4pm │      │
│ └─────────────────┘      │
│                          │
│ Step 4: Alert Settings   │
│ ☑ Alert on zone exit     │
│ ☑ Alert on low battery   │
│ ☑ Alert on SOS           │
│ ☐ SMS backup alerts      │
│   Phone: [+1________]    │
│                          │
│ [Activate Kid Mode]      │
└──────────────────────────┘
```

### 6b. Safe Zone Drawing

```
Parent taps [+ Add Safe Zone]
        │
        ▼
┌─────────────────────────┐
│ Safe Zone Editor         │
│                          │
│ Name: [________]         │
│                          │
│ Type: (●) Circle         │
│       ( ) Polygon        │
│                          │
│ ┌─────────────────────┐  │
│ │                     │  │
│ │    Map View         │  │
│ │                     │  │
│ │   Tap to place      │  │
│ │   center point      │  │
│ │                     │  │
│ │     ◯──── 200m      │  │
│ │   (drag to resize)  │  │
│ │                     │  │
│ └─────────────────────┘  │
│                          │
│ Schedule (optional):     │
│ Days: [M][T][W][T][F][][]│
│ Time: 07:00 to 16:00    │
│                          │
│ [Save Zone]              │
└──────────────────────────┘
```

### 6c. Kid's Device Experience

```
Kid opens app (Kid Mode active)
        │
        ▼
┌─────────────────────────┐
│ Simplified Map           │
│ (no incident details,    │
│  no social features)     │
│                          │
│ ┌─────────────────────┐  │
│ │                     │  │
│ │  Map with only:     │  │
│ │  • Kid's position   │  │
│ │  • Safe zone        │  │
│ │    boundaries       │  │
│ │  • Family members   │  │
│ │                     │  │
│ └─────────────────────┘  │
│                          │
│  ┌─────────────────────┐ │
│  │                     │ │
│  │   🆘 SOS BUTTON    │ │
│  │   (large, centered) │ │
│  │                     │ │
│  └─────────────────────┘ │
│                          │
│  [I'm at School ✓]       │
│  (quick check-in)        │
└──────────────────────────┘

Kid presses SOS:
        │
        ▼
┌─────────────────────────┐
│ 3-second countdown       │
│ (cancel window)          │
│                          │
│ "Sending SOS in 3..."   │
└────────┬────────────────┘
         │ (not cancelled)
         ▼
┌─────────────────────────┐
│ Cloud Function:          │
│ processSOSAlert          │
│                          │
│ 1. Get kid's exact       │
│    location              │
│ 2. Write notification to │
│    ALL parent UIDs       │
│ 3. Send FCM HIGH         │
│    PRIORITY push         │
│ 4. Optional: send SMS    │
│    to sosContactNumbers  │
│ 5. Log event             │
└─────────────────────────┘
```

### 6d. Zone Breach Alert (Parent View)

```
Cloud Function detects kid left safe zone
        │
        ▼
Parent receives push notification:
┌─────────────────────────┐
│ ⚠️ ZONE ALERT            │
│ Lucas left "School" zone │
│ 2 seconds ago            │
│ Tap to view location     │
└────────┬────────────────┘
         │ tap
         ▼
┌─────────────────────────┐
│ Kid Dashboard            │
│                          │
│ ⚠️ Lucas is OUTSIDE      │
│    safe zone "School"    │
│                          │
│ ┌─────────────────────┐  │
│ │ Map showing:        │  │
│ │ • Kid's position    │  │
│ │   (red marker)      │  │
│ │ • Safe zone boundary│  │
│ │   (red outline)     │  │
│ │ • Distance from     │  │
│ │   zone: 150m        │  │
│ └─────────────────────┘  │
│                          │
│ 📍 Current: Rua X, 123  │
│ 🔋 Battery: 67%         │
│ ⏱️ Left zone: 2 min ago │
│                          │
│ [Call Lucas] [Navigate]  │
│ [Dismiss Alert]          │
└──────────────────────────┘
```

---

## 7. Location Sharing Flow

```
Profile → "Share My Location"
        │
        ▼
┌─────────────────────────┐
│ Share Location            │
│                          │
│ Duration:                │
│ (●) 1 hour              │
│ ( ) 4 hours             │
│ ( ) 8 hours             │
│ ( ) 24 hours            │
│ ( ) Until I stop        │
│                          │
│ Privacy:                 │
│ ☐ Fuzzy mode (±200m)    │
│                          │
│ [Generate Link]          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Your live link:          │
│                          │
│ attention.app/live/      │
│ a7f3-b2c1-d4e5          │
│                          │
│ [Copy Link]              │
│ [Share via...]           │
│                          │
│ Active shares (1):       │
│ ┌─────────────────────┐  │
│ │ Created: just now   │  │
│ │ Expires: in 1 hour  │  │
│ │ Views: 0            │  │
│ │ [Revoke]            │  │
│ └─────────────────────┘  │
└──────────────────────────┘

Viewer (no account needed):
┌─────────────────────────┐
│ attention.app/live/token │
│                          │
│ ┌─────────────────────┐  │
│ │                     │  │
│ │  Map with live pin  │  │
│ │  updating in        │  │
│ │  real-time           │  │
│ │                     │  │
│ │  "John's Location"  │  │
│ │  Last updated:      │  │
│ │  5 seconds ago      │  │
│ │                     │  │
│ └─────────────────────┘  │
│                          │
│ [Get Attention App]      │
│ (download CTA)           │
└──────────────────────────┘
```

---

## 8. Reputation Progression Journey

```
New User (Level 0: "Observador Anônimo")
        │
        │ Creates first report (+10 pts)
        ▼
Level 1: "Cidadão Alerta" (50 pts)
        │
        │ Reports confirmed by others
        │ Confirms others' reports
        │ Daily login streaks
        ▼
Level 5: "Patrulheiro Local" (500 pts)
        │
        │ Daily report limit increases
        │ Can comment on incidents
        ▼
Level 10: "Sentinela Urbano" (2,000 pts)
        │
        │ Unlocks incident reactions
        │ Profile visible in leaderboard
        ▼
Level 15: "Guardião da Vizinhança" (5,000 pts)
        │
        │ Can create community alerts
        │ Highlighted reports on map
        ▼
Level 20: "Protetor Regional" (15,000 pts)
        │
        │ Reports auto-boosted in feed
        │ Access to area analytics
        ▼
Level 25: "Vigilante Supremo" (40,000 pts)
        │
        │ Priority report visibility
        │ Can mentor new users
        ▼
Level 30: "Attention Master" (100,000 pts)
        │
        │ Maximum regular level
        │ All features unlocked
        │
        │ Continue earning points...
        ▼
"Guardian" (200,000 pts)
        │
        │ isGuardian: true (permanent flag)
        │
        ▼
┌─────────────────────────┐
│ Guardian Powers:         │
│ • Verify incidents       │
│ • Review user reports    │
│ • Access moderation      │
│   dashboard              │
│ • Area-wide statistics   │
│ • Distinct animated      │
│   badge with effects     │
│ • "Verified by Guardian" │
│   stamp on incidents     │
└──────────────────────────┘
```

---

## 9. Ghost Mode / Privacy Flow

```
Settings → Privacy → Ghost Mode
        │
        ▼
┌─────────────────────────┐
│ Privacy Controls         │
│                          │
│ Ghost Mode          [ON] │
│ "You're invisible on the │
│  public map. Family can  │
│  still see you."         │
│                          │
│ Family-Only Mode    [OFF]│
│ "Only family group       │
│  members see your        │
│  location."              │
│                          │
│ Location History    [ON] │
│ "Encrypted daily         │
│  summaries stored on     │
│  your device."           │
│                          │
│ Active Shares:           │
│ • Link #1 (expires 2h)  │
│   [Revoke]               │
│                          │
│ [Delete All My Data]     │
│ (GDPR full deletion)     │
└──────────────────────────┘

Ghost Mode ON:
┌─────────────────────────┐
│ Other users' map:        │
│ • Your marker: HIDDEN    │
│ • Your incidents: still  │
│   visible (anonymous if  │
│   level < 5)             │
│                          │
│ Family map:              │
│ • Your marker: VISIBLE   │
│ • Normal family features │
│                          │
│ Your map:                │
│ • All features work      │
│ • Ghost icon on your     │
│   marker (self only)     │
└──────────────────────────┘
```

---

## 10. Guardian Moderation Flow

```
Guardian opens "Moderation" tab
        │
        ▼
┌─────────────────────────┐
│ Moderation Dashboard     │
│                          │
│ Pending Reports (12)     │
│ ┌─────────────────────┐  │
│ │ 🚩 User Report      │  │
│ │ "Spam incident"     │  │
│ │ Reporter: @maria     │  │
│ │ Target: Incident #42 │  │
│ │ Filed: 2h ago        │  │
│ │ [Review]             │  │
│ ├─────────────────────┤  │
│ │ 🚩 User Report      │  │
│ │ "False information"  │  │
│ │ ...                  │  │
│ └─────────────────────┘  │
│                          │
│ Unverified Incidents (8) │
│ (high-confirm incidents  │
│  awaiting Guardian stamp)│
│                          │
│ Flagged Users (3)        │
│ (probationary or         │
│  multiple reports)       │
└────────┬────────────────┘
         │ tap "Review"
         ▼
┌─────────────────────────┐
│ Review Report            │
│                          │
│ Reported Incident:       │
│ • "Robbery on Av. X"    │
│ • 15 confirms, 2 denials│
│ • Posted by @joao (L12) │
│ • Photo attached         │
│                          │
│ Report Reason:           │
│ "This is false info,     │
│  I was at this location" │
│ - @maria (Level 8)       │
│                          │
│ Actions:                 │
│ [Dismiss Report]         │
│   (report was unfounded) │
│                          │
│ [Remove Incident]        │
│   (incident was fake,    │
│    -50 pts to reporter)  │
│                          │
│ [Warn Reporter]          │
│   (soft warning, no      │
│    point penalty)        │
│                          │
│ [Verify Incident ✓]      │
│   (incident is real,     │
│    gold "Verified" badge) │
└──────────────────────────┘
```
