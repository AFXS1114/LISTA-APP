// ─────────────────────────────────────────────
//  LISTA · Screen · SyncScreen
//  Placeholder for future Turso/Supabase sync.
//  Tracks sync state locally.
// ─────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, shadow } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { useConnectivity } from '../hooks/useConnectivity';
import { getUnsyncedBrokerCount } from '../db/brokerRepository';
import { CACHE_KEYS, queryCache } from '../cache/queryCache';

export const SyncScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isConnected } = useConnectivity();
  const [unsyncedCount, setUnsyncedCount] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadCount = useCallback(async (force = false) => {
    if (!force) {
      const cached = queryCache.get<number>(CACHE_KEYS.unsyncedCount);
      if (cached !== undefined) {
        setUnsyncedCount(cached);
        return;
      }
    }
    const count = await getUnsyncedBrokerCount();
    queryCache.set(CACHE_KEYS.unsyncedCount, count, 15_000);
    setUnsyncedCount(count);
  }, []);

  useEffect(() => { loadCount(); }, [loadCount]);

  const handleSyncNow = async () => {
    setSyncing(true);
    // TODO: Replace with actual Turso/Supabase sync call
    await new Promise((res) => setTimeout(res, 1500)); // Simulate stub delay
    console.log('[LISTA] Sync stub executed. Connect to Turso/Supabase when ready.');
    setSyncing(false);
    queryCache.invalidate(CACHE_KEYS.unsyncedCount);
    await loadCount(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name="cloud-sync-outline" size={26} color={theme.primary} />
        <Text style={[textStyles.h2, { color: theme.textPrimary, marginLeft: spacing.sm }]}>
          Sync
        </Text>
      </View>

      {/* Status Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* Connectivity */}
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isConnected ? theme.success : theme.danger }
          ]} />
          <Text style={[textStyles.bodyMedium, { color: theme.textPrimary }]}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
          <Text style={[textStyles.bodySm, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>
            {isConnected ? 'Ready to sync' : 'Connect to sync'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        {/* Unsynced count */}
        <View style={styles.countRow}>
          <MaterialCommunityIcons name="database-clock-outline" size={20} color={theme.accent} />
          <View style={styles.countText}>
            <Text style={[textStyles.bodyMedium, { color: theme.textPrimary }]}>
              Unsynced Records
            </Text>
            <Text style={[textStyles.bodySm, { color: theme.textSecondary }]}>
              Waiting to be pushed to cloud
            </Text>
          </View>
          <Text style={[textStyles.h2, { color: theme.accent }]}>
            {unsyncedCount ?? '—'}
          </Text>
        </View>
      </View>

      {/* Sync Button */}
      <TouchableOpacity
        style={[
          styles.syncBtn,
          {
            backgroundColor: isConnected ? theme.primary : theme.inputBackground,
            borderColor: isConnected ? theme.primary : theme.border,
          },
        ]}
        onPress={handleSyncNow}
        disabled={!isConnected || syncing}
        activeOpacity={0.8}
      >
        {syncing ? (
          <ActivityIndicator color={isConnected ? theme.textOnPrimary : theme.textDisabled} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="cloud-upload-outline"
              size={22}
              color={isConnected ? theme.textOnPrimary : theme.textDisabled}
            />
            <Text style={[
              textStyles.button,
              { color: isConnected ? theme.textOnPrimary : theme.textDisabled }
            ]}>
              {isConnected ? 'Sync Now' : 'No Connection'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info cards */}
      <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <MaterialCommunityIcons name="information-outline" size={18} color={theme.accent} />
        <Text style={[textStyles.bodySm, { color: theme.textSecondary, flex: 1 }]}>
          Sync is fully offline-safe. All data is stored locally in SQLite.
          Online sync with Turso or Supabase will be wired here in a future release.
        </Text>
      </View>

      {/* Future roadmap */}
      <Text style={[textStyles.label, styles.roadmapTitle, { color: theme.textSecondary }]}>
        Sync Roadmap
      </Text>
      {ROADMAP.map((item, i) => (
        <View key={i} style={[styles.roadmapItem, { borderColor: theme.border }]}>
          <MaterialCommunityIcons
            name={item.done ? 'check-circle' : 'clock-outline'}
            size={18}
            color={item.done ? theme.success : theme.textDisabled}
          />
          <Text style={[textStyles.body, { color: item.done ? theme.textPrimary : theme.textDisabled, flex: 1 }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const ROADMAP = [
  { label: 'Local SQLite storage with synced flag', done: true },
  { label: 'Connectivity detection + sync banner', done: true },
  { label: 'Unsynced record tracking', done: true },
  { label: 'Turso/Supabase cloud sync integration', done: false },
  { label: 'Conflict resolution strategy', done: false },
  { label: 'Real-time updates via subscriptions', done: false },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: spacing.md,
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  divider: { height: 1 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  countText: { flex: 1 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    ...shadow.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  roadmapTitle: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
});
