# Attention — Reputation System & Badges

> Complete specification of the point economy, all 31 levels, Guardian tier, and moderation rules.

---

## Point Economy

### Earning Points

| Action | Points | Conditions |
|--------|--------|------------|
| Create incident report | +10 | Max daily limit applies |
| Your report gets confirmed | +5 | Per unique confirmation (capped at +100 per incident) |
| You confirm someone's report | +3 | Once per incident |
| Your report gets verified by Guardian | +25 | One-time per incident |
| Daily login | +2 | Once per calendar day |
| 7-day login streak | +20 | Bonus on 7th consecutive day |
| 30-day login streak | +100 | Bonus on 30th consecutive day |
| First report of the day | +5 | Bonus on top of base +10 |
| Report in under-reported area | +15 | Area with no reports in 24h within 1km |
| Photo attached to report | +3 | Per report (max 1 bonus) |
| Reach milestone follower count (10, 50, 100, 500) | +50 each | One-time per milestone |
| Invited user reaches Level 5 | +25 | Referral bonus, max 10 referrals |
| Community upvote ("Useful" reaction) on your report | +1 | Capped at +20 per incident |

### Losing Points

| Action | Points | Conditions |
|--------|--------|------------|
| Your report gets denied (majority) | -10 | When deny count > confirm count after 1 hour |
| Report removed by Guardian | -50 | False/malicious report |
| Report removed by system (auto-mod) | -30 | Spam detection |
| Warning from Guardian | -0 | Soft warning, no point loss (first offense) |
| Second Guardian warning | -25 | Repeat offender |
| Blocked by 3+ users | -15 | Per block event after the 3rd |
| Report flagged as duplicate | -5 | Duplicate of existing active incident |

---

## Special Rules

### Probationary Mode

Activated when a user's reputation drops below **0 points**.

| Restriction | Detail |
|-------------|--------|
| Daily report limit | Reduced to **3 per day** |
| Reports visibility | Reports only visible to users within 500m |
| Commenting | Disabled |
| Reactions | Disabled |
| Following | Cannot follow new users |
| Duration | Until reputation returns to **0 or above** |
| Badge display | Shows "Probationary" warning icon |
| Exit condition | Earn back points through confirmations from others |

### Bad Reputation Restrictions (Reputation < -50)

| Restriction | Detail |
|-------------|--------|
| Daily report limit | **1 per day** |
| Reports require Guardian verification | Reports hidden until a Guardian verifies |
| Social features | Fully disabled (no comments, reactions, follows) |
| Profile | Marked with low-trust indicator (visible to Guardians only) |

### Daily Report Limits by Level

| Level Range | Daily Limit |
|------------|-------------|
| 0–2 | 5 reports/day |
| 3–5 | 8 reports/day |
| 6–10 | 12 reports/day |
| 11–15 | 18 reports/day |
| 16–20 | 25 reports/day |
| 21–25 | 35 reports/day |
| 26–30 | 50 reports/day |
| Guardian | Unlimited |

### Confirmation Weighting

Not all confirmations/denials are equal. Higher-level users carry more weight.

| Confirmer Level | Weight Multiplier |
|----------------|-------------------|
| 0–5 | 1.0x |
| 6–10 | 1.5x |
| 11–15 | 2.0x |
| 16–20 | 2.5x |
| 21–25 | 3.0x |
| 26–30 | 4.0x |
| Guardian | 5.0x (instant verification option) |

**Credibility formula:**
```
credibilityScore = Σ(confirm_weight) - Σ(deny_weight)
```

An incident is considered "majority denied" when `credibilityScore < -5.0` after at least 3 total votes.

---

## All 31 Levels + Guardian

| Level | Name | Icon | Min Points | Max Points | Perks Unlocked |
|-------|------|------|-----------|------------|----------------|
| 0 | Observador Anônimo | 👁️ | 0 | 49 | Basic map view, create reports (5/day) |
| 1 | Cidadão Alerta | 🔔 | 50 | 99 | Confirm/deny incidents |
| 2 | Vigia Iniciante | 🔍 | 100 | 199 | Comment on incidents |
| 3 | Repórter de Rua | 📝 | 200 | 349 | 8 reports/day, add photos |
| 4 | Olheiro Comunitário | 👀 | 350 | 499 | View reporter profiles |
| 5 | Patrulheiro Local | 🛡️ | 500 | 749 | Reactions on incidents, public profile |
| 6 | Informante Confiável | 📡 | 750 | 999 | Reports show on wider radius |
| 7 | Vigia Dedicado | 🔦 | 1,000 | 1,499 | Follow users, activity feed |
| 8 | Sentinela de Bairro | 🏘️ | 1,500 | 1,999 | 12 reports/day |
| 9 | Guardião de Esquina | 🚦 | 2,000 | 2,999 | GuardScan extended to 3km |
| 10 | Sentinela Urbano | 🌃 | 3,000 | 3,999 | Appear in local leaderboard |
| 11 | Protetor de Zona | 🗺️ | 4,000 | 4,999 | 18 reports/day |
| 12 | Agente Comunitário | 🤝 | 5,000 | 6,499 | Community alert creation |
| 13 | Vigilante de Área | 🔭 | 6,500 | 7,999 | Highlighted report markers |
| 14 | Guardião da Vizinhança | 🏰 | 8,000 | 9,999 | GuardScan extended to 4km |
| 15 | Escudo Popular | ⚔️ | 10,000 | 12,499 | Reports auto-boosted in feed |
| 16 | Sentinela Avançado | 🎯 | 12,500 | 14,999 | 25 reports/day, area analytics |
| 17 | Defensor Regional | 🦅 | 15,000 | 17,999 | Incident heatmap access |
| 18 | Protetor Regional | 🌐 | 18,000 | 21,999 | Route safety scoring |
| 19 | Guardião de Elite | 💎 | 22,000 | 25,999 | Priority in confirmation weight |
| 20 | Sentinela de Ouro | 🏅 | 26,000 | 30,999 | GuardScan full 5km radius |
| 21 | Vigilante Supremo | ⭐ | 31,000 | 35,999 | 35 reports/day, mentor badge |
| 22 | Protetor Supremo | 🌟 | 36,000 | 41,999 | Can mentor new users |
| 23 | Guardião Máximo | 👑 | 42,000 | 49,999 | Reports pinned for 8 hours |
| 24 | Comandante de Alerta | 🎖️ | 50,000 | 57,999 | Area-wide push notifications |
| 25 | Sentinela Lendário | 🔱 | 58,000 | 65,999 | Custom marker style |
| 26 | Defensor Lendário | 🛡️✨ | 66,000 | 74,999 | 50 reports/day |
| 27 | Protetor Absoluto | ⚡ | 75,000 | 84,999 | Animated profile badge |
| 28 | Guardião Imortal | 🔥 | 85,000 | 92,999 | Custom alert sound |
| 29 | Mestre da Atenção | 💫 | 93,000 | 99,999 | All standard perks unlocked |
| 30 | **Attention Master** | 🏆 | 100,000 | 199,999 | Maximum standard level, elite marker, all features |
| — | **Guardian** | 🛡️👁️‍🗨️ | 200,000 | ∞ | Moderation powers (see below) |

---

## Guardian Tier (200,000 pts)

Guardian is **not** a level — it's a permanent status flag (`isGuardian: true`) that exists alongside the level system. A Guardian is always Level 30 + Guardian status.

### Guardian Powers

| Power | Description |
|-------|-------------|
| Verify incidents | Mark incidents as "Guardian Verified" (gold badge on marker) |
| Review reports | Access the moderation queue of user-filed reports |
| Remove incidents | Remove false/malicious incidents (triggers -50 pts penalty to reporter) |
| Warn users | Issue warnings (first = no penalty, second = -25 pts) |
| View flagged users | See users in probationary mode or with multiple reports |
| Area statistics | Access aggregated incident data for their region |
| Moderation dashboard | In-app admin panel with pending actions |
| Unlimited reports | No daily report cap |
| Instant verification | Their confirmation instantly verifies an incident (5.0x weight) |
| Distinct badge | Animated Guardian badge with special particle effects |

### Guardian Accountability

- Guardian actions are logged in `/reputationEvents` with `type: moderation_action`
- Other Guardians can review and reverse another Guardian's actions
- If a Guardian receives 3+ valid complaints, their Guardian status is reviewed (manual process)
- Guardian status can be revoked by system admins if abused

---

## Reputation Engine — Cloud Function Logic

### Atomic Transaction Flow

```
Trigger: reputationEvents/{id} onCreate
        │
        ▼
┌─────────────────────────────┐
│ Firestore Transaction       │
│                             │
│ 1. Read /users/{targetUid}  │
│    (get current reputation  │
│     and level)              │
│                             │
│ 2. Calculate new reputation │
│    newRep = current + event │
│    .points                  │
│                             │
│ 3. Look up new level from   │
│    badge table              │
│                             │
│ 4. Check Guardian threshold │
│    (newRep >= 200,000?)     │
│                             │
│ 5. Atomic write to user doc:│
│    { reputation: newRep,    │
│      level: newLevel,       │
│      levelName: "...",      │
│      levelIcon: "...",      │
│      isGuardian: true/false,│
│      isProbationary:        │
│        newRep < 0 }         │
│                             │
│ 6. If level changed:        │
│    write notification to    │
│    /notifications/{uid}/    │
│    items/{id}               │
│    "You reached Level X!"   │
│                             │
│ 7. If Guardian unlocked:    │
│    write special notif +    │
│    fan-out to feed          │
└─────────────────────────────┘
```

### Anti-Abuse Measures

| Measure | Implementation |
|---------|---------------|
| Self-confirmation prevention | Security rules: cannot confirm own incidents |
| Confirmation cooldown | Max 1 confirm/deny per incident per user |
| Report spam detection | Cloud Function: flag if >3 reports in 5 min from same user |
| Coordinated boosting detection | Cloud Function: flag if same group of users always confirm each other |
| Daily cap on earnable points | Soft cap of 500 pts/day from confirmations (reports uncapped) |
| IP-based duplicate detection | Cloud Function: flag multiple accounts from same device (FCM token match) |
| Geolocation verification | Reporter must be within 2km of incident location |

---

## Seed Data — Badge Collection

This JSON structure should be seeded into `/badges/{badgeId}` on project initialization.

```json
[
  { "badgeId": "0", "level": 0, "name": "Observador Anônimo", "nameEN": "Anonymous Observer", "icon": "👁️", "minReputation": 0, "maxReputation": 49, "dailyReportLimit": 5, "color": "#6B7280", "glowColor": "#374151", "perks": ["basic_map", "create_reports"] },
  { "badgeId": "1", "level": 1, "name": "Cidadão Alerta", "nameEN": "Alert Citizen", "icon": "🔔", "minReputation": 50, "maxReputation": 99, "dailyReportLimit": 5, "color": "#9CA3AF", "glowColor": "#4B5563", "perks": ["confirm_deny"] },
  { "badgeId": "2", "level": 2, "name": "Vigia Iniciante", "nameEN": "Beginner Watchman", "icon": "🔍", "minReputation": 100, "maxReputation": 199, "dailyReportLimit": 5, "color": "#60A5FA", "glowColor": "#2563EB", "perks": ["comments"] },
  { "badgeId": "3", "level": 3, "name": "Repórter de Rua", "nameEN": "Street Reporter", "icon": "📝", "minReputation": 200, "maxReputation": 349, "dailyReportLimit": 8, "color": "#34D399", "glowColor": "#059669", "perks": ["photos", "8_reports"] },
  { "badgeId": "4", "level": 4, "name": "Olheiro Comunitário", "nameEN": "Community Scout", "icon": "👀", "minReputation": 350, "maxReputation": 499, "dailyReportLimit": 8, "color": "#A78BFA", "glowColor": "#7C3AED", "perks": ["view_profiles"] },
  { "badgeId": "5", "level": 5, "name": "Patrulheiro Local", "nameEN": "Local Patroller", "icon": "🛡️", "minReputation": 500, "maxReputation": 749, "dailyReportLimit": 8, "color": "#F59E0B", "glowColor": "#D97706", "perks": ["reactions", "public_profile"] },
  { "badgeId": "6", "level": 6, "name": "Informante Confiável", "nameEN": "Trusted Informant", "icon": "📡", "minReputation": 750, "maxReputation": 999, "dailyReportLimit": 12, "color": "#10B981", "glowColor": "#047857", "perks": ["wider_radius"] },
  { "badgeId": "7", "level": 7, "name": "Vigia Dedicado", "nameEN": "Dedicated Watchman", "icon": "🔦", "minReputation": 1000, "maxReputation": 1499, "dailyReportLimit": 12, "color": "#3B82F6", "glowColor": "#1D4ED8", "perks": ["follow_users", "feed"] },
  { "badgeId": "8", "level": 8, "name": "Sentinela de Bairro", "nameEN": "Neighborhood Sentinel", "icon": "🏘️", "minReputation": 1500, "maxReputation": 1999, "dailyReportLimit": 12, "color": "#8B5CF6", "glowColor": "#6D28D9", "perks": ["12_reports"] },
  { "badgeId": "9", "level": 9, "name": "Guardião de Esquina", "nameEN": "Corner Guardian", "icon": "🚦", "minReputation": 2000, "maxReputation": 2999, "dailyReportLimit": 12, "color": "#EC4899", "glowColor": "#BE185D", "perks": ["guardscan_3km"] },
  { "badgeId": "10", "level": 10, "name": "Sentinela Urbano", "nameEN": "Urban Sentinel", "icon": "🌃", "minReputation": 3000, "maxReputation": 3999, "dailyReportLimit": 12, "color": "#14B8A6", "glowColor": "#0D9488", "perks": ["leaderboard"] },
  { "badgeId": "11", "level": 11, "name": "Protetor de Zona", "nameEN": "Zone Protector", "icon": "🗺️", "minReputation": 4000, "maxReputation": 4999, "dailyReportLimit": 18, "color": "#F97316", "glowColor": "#EA580C", "perks": ["18_reports"] },
  { "badgeId": "12", "level": 12, "name": "Agente Comunitário", "nameEN": "Community Agent", "icon": "🤝", "minReputation": 5000, "maxReputation": 6499, "dailyReportLimit": 18, "color": "#06B6D4", "glowColor": "#0891B2", "perks": ["community_alerts"] },
  { "badgeId": "13", "level": 13, "name": "Vigilante de Área", "nameEN": "Area Vigilante", "icon": "🔭", "minReputation": 6500, "maxReputation": 7999, "dailyReportLimit": 18, "color": "#84CC16", "glowColor": "#65A30D", "perks": ["highlighted_markers"] },
  { "badgeId": "14", "level": 14, "name": "Guardião da Vizinhança", "nameEN": "Neighborhood Guardian", "icon": "🏰", "minReputation": 8000, "maxReputation": 9999, "dailyReportLimit": 18, "color": "#EAB308", "glowColor": "#CA8A04", "perks": ["guardscan_4km"] },
  { "badgeId": "15", "level": 15, "name": "Escudo Popular", "nameEN": "People's Shield", "icon": "⚔️", "minReputation": 10000, "maxReputation": 12499, "dailyReportLimit": 18, "color": "#EF4444", "glowColor": "#DC2626", "perks": ["auto_boost_feed"] },
  { "badgeId": "16", "level": 16, "name": "Sentinela Avançado", "nameEN": "Advanced Sentinel", "icon": "🎯", "minReputation": 12500, "maxReputation": 14999, "dailyReportLimit": 25, "color": "#8B5CF6", "glowColor": "#7C3AED", "perks": ["25_reports", "area_analytics"] },
  { "badgeId": "17", "level": 17, "name": "Defensor Regional", "nameEN": "Regional Defender", "icon": "🦅", "minReputation": 15000, "maxReputation": 17999, "dailyReportLimit": 25, "color": "#0EA5E9", "glowColor": "#0284C7", "perks": ["heatmap"] },
  { "badgeId": "18", "level": 18, "name": "Protetor Regional", "nameEN": "Regional Protector", "icon": "🌐", "minReputation": 18000, "maxReputation": 21999, "dailyReportLimit": 25, "color": "#22D3EE", "glowColor": "#06B6D4", "perks": ["route_safety"] },
  { "badgeId": "19", "level": 19, "name": "Guardião de Elite", "nameEN": "Elite Guardian", "icon": "💎", "minReputation": 22000, "maxReputation": 25999, "dailyReportLimit": 25, "color": "#A855F7", "glowColor": "#9333EA", "perks": ["priority_weight"] },
  { "badgeId": "20", "level": 20, "name": "Sentinela de Ouro", "nameEN": "Gold Sentinel", "icon": "🏅", "minReputation": 26000, "maxReputation": 30999, "dailyReportLimit": 25, "color": "#FBBF24", "glowColor": "#F59E0B", "perks": ["guardscan_5km"] },
  { "badgeId": "21", "level": 21, "name": "Vigilante Supremo", "nameEN": "Supreme Vigilante", "icon": "⭐", "minReputation": 31000, "maxReputation": 35999, "dailyReportLimit": 35, "color": "#FCD34D", "glowColor": "#FBBF24", "perks": ["35_reports", "mentor_badge"] },
  { "badgeId": "22", "level": 22, "name": "Protetor Supremo", "nameEN": "Supreme Protector", "icon": "🌟", "minReputation": 36000, "maxReputation": 41999, "dailyReportLimit": 35, "color": "#FB923C", "glowColor": "#F97316", "perks": ["mentor_users"] },
  { "badgeId": "23", "level": 23, "name": "Guardião Máximo", "nameEN": "Maximum Guardian", "icon": "👑", "minReputation": 42000, "maxReputation": 49999, "dailyReportLimit": 35, "color": "#F472B6", "glowColor": "#EC4899", "perks": ["pinned_reports_8h"] },
  { "badgeId": "24", "level": 24, "name": "Comandante de Alerta", "nameEN": "Alert Commander", "icon": "🎖️", "minReputation": 50000, "maxReputation": 57999, "dailyReportLimit": 35, "color": "#E879F9", "glowColor": "#D946EF", "perks": ["area_push_notifs"] },
  { "badgeId": "25", "level": 25, "name": "Sentinela Lendário", "nameEN": "Legendary Sentinel", "icon": "🔱", "minReputation": 58000, "maxReputation": 65999, "dailyReportLimit": 35, "color": "#C084FC", "glowColor": "#A855F7", "perks": ["custom_marker"] },
  { "badgeId": "26", "level": 26, "name": "Defensor Lendário", "nameEN": "Legendary Defender", "icon": "🛡️✨", "minReputation": 66000, "maxReputation": 74999, "dailyReportLimit": 50, "color": "#818CF8", "glowColor": "#6366F1", "perks": ["50_reports"] },
  { "badgeId": "27", "level": 27, "name": "Protetor Absoluto", "nameEN": "Absolute Protector", "icon": "⚡", "minReputation": 75000, "maxReputation": 84999, "dailyReportLimit": 50, "color": "#38BDF8", "glowColor": "#0EA5E9", "perks": ["animated_badge"] },
  { "badgeId": "28", "level": 28, "name": "Guardião Imortal", "nameEN": "Immortal Guardian", "icon": "🔥", "minReputation": 85000, "maxReputation": 92999, "dailyReportLimit": 50, "color": "#FB7185", "glowColor": "#F43F5E", "perks": ["custom_alert_sound"] },
  { "badgeId": "29", "level": 29, "name": "Mestre da Atenção", "nameEN": "Attention Expert", "icon": "💫", "minReputation": 93000, "maxReputation": 99999, "dailyReportLimit": 50, "color": "#FACC15", "glowColor": "#EAB308", "perks": ["all_standard_perks"] },
  { "badgeId": "30", "level": 30, "name": "Attention Master", "nameEN": "Attention Master", "icon": "🏆", "minReputation": 100000, "maxReputation": 199999, "dailyReportLimit": 50, "color": "#FFD700", "glowColor": "#FFA500", "perks": ["elite_marker", "all_features", "max_standard_level"] },
  { "badgeId": "guardian", "level": 31, "name": "Guardian", "nameEN": "Guardian", "icon": "🛡️👁️‍🗨️", "minReputation": 200000, "maxReputation": null, "dailyReportLimit": -1, "color": "#00FFAA", "glowColor": "#00FF88", "perks": ["verify_incidents", "review_reports", "remove_incidents", "moderation_dashboard", "unlimited_reports", "instant_verification", "animated_guardian_badge", "area_statistics"] }
]
```

---

## Level Progression Curves

Estimated time to reach each milestone (assuming active daily use):

| Level | Points | Estimated Time |
|-------|--------|---------------|
| Level 5 (500 pts) | ~2 weeks | 3 reports/day + confirmations |
| Level 10 (3,000 pts) | ~1.5 months | Active community participation |
| Level 15 (10,000 pts) | ~3 months | Consistent daily engagement |
| Level 20 (26,000 pts) | ~6 months | Highly active user |
| Level 25 (58,000 pts) | ~10 months | Power user |
| Level 30 (100,000 pts) | ~15 months | Elite dedication |
| Guardian (200,000 pts) | ~2.5 years | Exceptional long-term commitment |

These estimates assume:
- ~5 reports/day averaging 3 confirmations each
- Daily login streaks maintained
- Active confirmation of others' reports
- No significant point losses
