// ─────────────────────────────────────────────
//  LISTA · App Entry Point
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSyncBanner, toastConfig } from './src/components/SyncBanner';
import { getDatabase } from './src/db/database';

// ── Inner app (needs ThemeContext) ───────────────────────────────
function Inner() {
  const { theme, isDark } = useTheme();
  const [dbReady, setDbReady] = useState(false);

  // Wire sync banner connectivity detection
  useSyncBanner();

  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[LISTA] DB init failed:', err);
        // Still set ready to avoid blank screen; migrations log to console
        setDbReady(true);
      });
  }, []);

  if (!dbReady) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
        translucent={false}
      />
      <AppNavigator />
      <Toast config={toastConfig} />
    </View>
  );
}

// ── Root export ──────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <Inner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
