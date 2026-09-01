// ─────────────────────────────────────────────
//  LISTA · Hook · useBrokerRecords
//  Cache-first broker record list management
// ─────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { BrokerRecord, getAllBrokerRecords, searchBrokerRecords } from '../db/brokerRepository';
import { CACHE_KEYS, queryCache } from '../cache/queryCache';

export function useBrokerRecords(searchQuery: string = '') {
  const [records, setRecords] = useState<BrokerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = searchQuery.trim()
        ? CACHE_KEYS.brokerSearch(searchQuery)
        : CACHE_KEYS.brokerList;

      if (!forceRefresh) {
        const cached = queryCache.get<BrokerRecord[]>(cacheKey);
        if (cached) {
          setRecords(cached);
          setLoading(false);
          return;
        }
      }

      const data = searchQuery.trim()
        ? await searchBrokerRecords(searchQuery)
        : await getAllBrokerRecords();

      queryCache.set(cacheKey, data);
      setRecords(data);
    } catch (e) {
      setError('Failed to load records');
      console.error('[useBrokerRecords]', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { records, loading, error, refresh };
}
