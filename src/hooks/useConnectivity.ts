// ─────────────────────────────────────────────
//  LISTA · Hook · useConnectivity
//  Detects offline → online transitions and
//  fires a callback to show the sync banner.
// ─────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type Options = {
  onCameOnline?: () => void;
};

export function useConnectivity(options: Options = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const prevConnected = useRef<boolean | null>(null);
  const { onCameOnline } = options;

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      prevConnected.current = connected;
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);

      // Detect offline → online transition
      if (prevConnected.current === false && connected === true) {
        onCameOnline?.();
      }
      prevConnected.current = connected;
    });

    return unsubscribe;
  }, [onCameOnline]);

  return { isConnected };
}
