# LISTA — Offline-First Vessel Tracking App

A production-quality React Native (Expo) mobile app for tracking broker records and vessel arrivals, built offline-first with a sync-ready architecture.

---

## Open Questions

> [!IMPORTANT]
> **Platform target**: Are you targeting Android only, or both Android + iOS? This affects expo-speech recognition module choices.

> [!IMPORTANT]
> **Expo vs Bare React Native**: The plan uses **Expo (managed workflow with Expo Go / EAS Build)** since it simplifies SQLite, speech, and connectivity APIs. If you need bare RN, let me know and the plan will adjust.

> [!IMPORTANT]
> **Specie list**: Should the `specie` field be a free-text input, a dropdown/picker with predefined values (e.g., Tamban, Galunggong, Bangus), or both? The voice-fill approach works for either.

---

## Proposed Tech Stack

| Concern | Library |
|---|---|
| Framework | Expo SDK 51+ (managed workflow) |
| Navigation | `@react-navigation/native` + `react-native-pager-view` (swipeable tabs) |
| Database | `expo-sqlite` (v13+, async API) |
| Connectivity | `@react-native-community/netinfo` |
| Speech-to-text | `expo-speech-recognition` (on-device, no network) |
| Theming | React Context + global stylesheet |
| Toast/Snackbar | `react-native-toast-message` |
| Icons | `@expo/vector-icons` (MaterialCommunityIcons) |
| Date picker | `@react-native-community/datetimepicker` |

---

## Proposed Changes

### Project Root

#### [NEW] `package.json` — Expo project with all dependencies
#### [NEW] `app.json` — Expo config (permissions for microphone, SQLite)
#### [NEW] `babel.config.js`

---

### Database Layer (`src/db/`)

#### [NEW] `src/db/database.ts`
Core SQLite initialization. Opens the database, runs the migration engine on startup, and exports the `db` singleton.

#### [NEW] `src/db/migrations.ts`
Migration engine: reads `schema_version` table on app start. If the stored version is less than `CURRENT_VERSION`, applies incremental SQL migrations in order (v1 → v2 → ...). Each version is a list of SQL statements.

**Schema (v1):**
```sql
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS broker_records (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  broker_name TEXT    NOT NULL,
  date        TEXT    NOT NULL,   -- ISO-8601 date string
  synced      INTEGER NOT NULL DEFAULT 0,  -- 0=unsynced, 1=synced
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vessel_entries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  broker_record_id INTEGER NOT NULL REFERENCES broker_records(id) ON DELETE CASCADE,
  vessel_name     TEXT    NOT NULL,
  num_tubs        INTEGER NOT NULL,
  specie          TEXT    NOT NULL,
  synced          INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vessel_broker ON vessel_entries(broker_record_id);
```

#### [NEW] `src/db/brokerRepository.ts`
All CRUD for broker_records: `createBrokerRecord`, `getAllBrokerRecords`, `getBrokerRecordById`, `searchBrokerRecords`, `markSynced`.

#### [NEW] `src/db/vesselRepository.ts`
All CRUD for vessel_entries: `addVesselEntry`, `getVesselEntriesForBroker`, `getVesselSummary` (GROUP BY broker + specie).

---

### Cache Layer (`src/cache/`)

#### [NEW] `src/cache/queryCache.ts`
Lightweight in-memory LRU-like cache for recent query results. Keyed by query identifier (e.g., `"broker_list"`, `"broker_detail_${id}"`). Invalidated on writes. Prevents redundant SQLite reads on navigation back/forth.

---

### Theme System (`src/theme/`)

#### [NEW] `src/theme/colors.ts`
All palette tokens:
```ts
export const palette = {
  charcoal:    '#272727',
  amber:       '#FED766',
  teal:        '#009FB7',
  slate:       '#696773',
  offWhite:    '#EFF1F3',
};

export const darkTheme = {
  background:     palette.charcoal,
  surface:        '#1a1a1a',
  card:           '#333333',
  primary:        palette.amber,
  accent:         palette.teal,
  textPrimary:    palette.offWhite,
  textSecondary:  palette.slate,
  border:         palette.slate,
  tabBar:         palette.charcoal,
};

export const lightTheme = {
  background:     palette.offWhite,
  surface:        '#ffffff',
  card:           '#f5f5f5',
  primary:        palette.teal,
  accent:         palette.amber,
  textPrimary:    palette.charcoal,
  textSecondary:  palette.slate,
  border:         '#d0d0d0',
  tabBar:         palette.charcoal,
};
```

#### [NEW] `src/theme/typography.ts`
Font sizes, weights, line heights as a typed system.

#### [NEW] `src/theme/spacing.ts`
Named spacing scale (xs, sm, md, lg, xl).

#### [NEW] `src/theme/ThemeContext.tsx`
React context providing `theme`, `isDark`, `toggleTheme`. Persisted with `AsyncStorage`.

---

### Navigation (`src/navigation/`)

#### [NEW] `src/navigation/AppNavigator.tsx`
Uses `react-native-pager-view` wrapped in a custom swipeable tab bar. Four tabs in order: LIST, ADD RECORD, SUMMARY, SYNC. Tab labels styled with the active/inactive color from theme. Also includes a Stack navigator inside LIST tab for the broker detail screen.

---

### Screens (`src/screens/`)

#### [NEW] `src/screens/ListScreen.tsx`
- Search bar (filters broker records by name or date)
- FlatList of broker record cards (broker name + formatted date)
- Tapping a card navigates to `BrokerDetailScreen`
- Pull-to-refresh forces cache invalidation

#### [NEW] `src/screens/BrokerDetailScreen.tsx`
- Shows broker name + date header
- FlatList of vessel entries (vessel name, tubs, specie)
- FAB or "+" button at bottom to open `AddVesselModal`

#### [NEW] `src/screens/AddRecordScreen.tsx`
- Date picker (defaults to today)
- Broker name text input
- Microphone button — starts speech recognition, parses utterances like "vessel name: alvin", "no of tubs: 10", "specie: tamban" and populates vessel entry fields
- Vessel entry form (vessel name, num tubs, specie) with "+" to add more entries
- Save button — writes to DB, invalidates cache, navigates to LIST

#### [NEW] `src/screens/SummaryScreen.tsx`
- Groups all vessel_entries by broker → specie
- Shows per-broker totals: total vessels count, tubs per specie breakdown
- Uses cached query result, refreshed only when data changes

#### [NEW] `src/screens/SyncScreen.tsx`
- Placeholder UI explaining future Turso/Supabase integration
- Shows count of unsynced records
- "Sync Now" button (stub — logs to console, shows success toast)
- Lists recently synced records

---

### Components (`src/components/`)

#### [NEW] `src/components/VoiceInput.tsx`
Mic button using `expo-speech-recognition`. Parses spoken text with a regex/keyword parser for fields: vessel name, no of tubs, specie. Calls `onFieldsParsed(fields)` callback.

#### [NEW] `src/components/AddVesselModal.tsx`
Bottom sheet modal with vessel name, num tubs, specie inputs + voice button.

#### [NEW] `src/components/BrokerCard.tsx`
Styled card for broker record list items.

#### [NEW] `src/components/VesselEntryRow.tsx`
Row component for vessel entry display.

#### [NEW] `src/components/TabBar.tsx`
Custom swipeable tab bar with animated indicator.

#### [NEW] `src/components/SyncBanner.tsx`
Connectivity-aware banner/snackbar: listens to NetInfo, shows "Data sync available" toast with "SYNC now!" button when connectivity is restored.

---

### Hooks (`src/hooks/`)

#### [NEW] `src/hooks/useConnectivity.ts`
Wraps `@react-native-community/netinfo`. Exposes `isConnected: boolean`. Triggers callback when transitioning from offline → online.

#### [NEW] `src/hooks/useBrokerRecords.ts`
Manages broker record list state with cache-first loading.

#### [NEW] `src/hooks/useVoiceInput.ts`
Encapsulates speech recognition lifecycle and field parsing logic.

---

### Entry Point

#### [NEW] `App.tsx`
Wraps everything in `ThemeProvider`, initializes DB on mount, renders `AppNavigator` + `SyncBanner`.

---

## Verification Plan

### Automated Tests
- No automated tests in scope for this initial build (can add Jest + Testing Library in a follow-up).

### Manual Verification
1. Run `npx expo start` and test on Android emulator or physical device via Expo Go.
2. Enable airplane mode → verify all 4 screens are fully functional.
3. Dictate "vessel name: Maria, no of tubs: 25, specie: tamban" → verify field auto-population.
4. Re-enable network → verify sync toast appears.
5. Toggle dark/light mode → verify palette applies correctly across all screens.
6. Add multiple vessel entries to one broker record → verify SUMMARY aggregates correctly.
