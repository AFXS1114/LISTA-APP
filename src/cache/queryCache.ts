// ─────────────────────────────────────────────
//  LISTA · Cache · In-Memory Query Cache
//  Simple TTL-based cache to avoid redundant
//  SQLite reads across screen navigations.
// ─────────────────────────────────────────────

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 30_000; // 30 seconds

const store = new Map<string, CacheEntry<unknown>>();

export const queryCache = {
  get<T>(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.data as T;
  },

  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
  },

  invalidate(keyPrefix: string): void {
    store.forEach((_, key) => {
      if (key.startsWith(keyPrefix)) {
        store.delete(key);
      }
    });
  },

  invalidateAll(): void {
    store.clear();
  },
};

// ─── Cache Keys (constants to avoid typos) ───
export const CACHE_KEYS = {
  brokerList: 'broker_list',
  brokerSearch: (q: string) => `broker_search_${q}`,
  brokerDetail: (id: number) => `broker_detail_${id}`,
  vesselList: (brokerId: number) => `vessel_list_${brokerId}`,
  summary: 'summary',
  unsyncedCount: 'unsynced_count',
} as const;
