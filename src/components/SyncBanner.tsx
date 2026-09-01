// ─────────────────────────────────────────────
//  LISTA · Component · SyncBanner
//  Appears as a toast when connectivity is
//  restored from offline state.
// ─────────────────────────────────────────────

import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useConnectivity } from '../hooks/useConnectivity';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';
import { textStyles } from '../theme/typography';

export function useSyncBanner() {
  const { theme } = useTheme();

  const showSyncToast = useCallback(() => {
    Toast.show({
      type: 'syncAvailable',
      position: 'bottom',
      bottomOffset: 80,
      visibilityTime: 8000,
      autoHide: true,
    });
  }, []);

  useConnectivity({ onCameOnline: showSyncToast });
}

// ─── Custom Toast Config ─────────────────────────────────────────

export const toastConfig = {
  syncAvailable: () => <SyncToast />,
};

const SyncToast: React.FC = () => {
  const { theme } = useTheme();

  const handleSync = () => {
    Toast.hide();
    console.log('[LISTA] Sync triggered — stub. Wire to Turso/Supabase when ready.');
    Toast.show({
      type: 'success',
      text1: 'Sync Queued',
      text2: 'Data will sync once the connection is confirmed.',
      position: 'bottom',
      bottomOffset: 80,
      visibilityTime: 3000,
    });
  };

  return (
    <View
      style={[
        styles.toast,
        {
          backgroundColor: theme.surface,
          borderColor: theme.accent,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={[styles.iconBg, { backgroundColor: theme.accent + '22' }]}>
        <MaterialCommunityIcons name="cloud-sync-outline" size={22} color={theme.accent} />
      </View>
      <View style={styles.textArea}>
        <Text style={[textStyles.bodyMedium, { color: theme.textPrimary }]}>
          Online — sync available
        </Text>
        <Text style={[textStyles.bodySm, { color: theme.textSecondary }]}>
          Your data can be synced to the cloud
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleSync}
        style={[styles.syncBtn, { backgroundColor: theme.accent }]}
        activeOpacity={0.8}
      >
        <Text style={[textStyles.button, { color: '#fff', fontSize: 12 }]}>SYNC{'\n'}NOW!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.md,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    flex: 1,
    gap: 2,
  },
  syncBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
});
