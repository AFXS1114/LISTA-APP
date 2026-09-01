// ─────────────────────────────────────────────
//  LISTA · Screen · BrokerDetailScreen
//  Shows all vessel entries for a broker record
//  and allows adding more via the modal.
// ─────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { VesselEntryRow } from '../components/VesselEntryRow';
import { AddVesselModal } from '../components/AddVesselModal';
import { VesselEntry, getVesselEntriesForBroker } from '../db/vesselRepository';
import { getBrokerRecordById } from '../db/brokerRepository';
import { CACHE_KEYS, queryCache } from '../cache/queryCache';
import type { ListStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<ListStackParamList, 'BrokerDetail'>;

export const BrokerDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { brokerId, brokerName } = route.params;

  const [entries, setEntries] = useState<VesselEntry[]>([]);
  const [brokerDate, setBrokerDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const cacheKey = CACHE_KEYS.vesselList(brokerId);

      if (!forceRefresh) {
        const cached = queryCache.get<VesselEntry[]>(cacheKey);
        if (cached) {
          setEntries(cached);
          setLoading(false);
          return;
        }
      }

      const [data, broker] = await Promise.all([
        getVesselEntriesForBroker(brokerId),
        getBrokerRecordById(brokerId),
      ]);

      queryCache.set(cacheKey, data);
      setEntries(data);
      if (broker) setBrokerDate(broker.date);
    } catch (e) {
      console.error('[BrokerDetailScreen]', e);
    } finally {
      setLoading(false);
    }
  }, [brokerId]);

  useEffect(() => { load(); }, [load]);

  const totalTubs = entries.reduce((sum, e) => sum + e.num_tubs, 0);

  const renderHeader = () => (
    <View>
      {/* Stats strip */}
      <View style={[styles.statsStrip, { backgroundColor: theme.surface }]}>
        <StatChip icon="ferry" label="Vessels" value={entries.length} theme={theme} />
        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
        <StatChip icon="bucket-outline" label="Total Tubs" value={totalTubs} theme={theme} />
      </View>

      <Text style={[textStyles.label, styles.sectionLabel, { color: theme.textSecondary }]}>
        Vessel Arrivals
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[textStyles.h3, { color: theme.textPrimary }]} numberOfLines={1}>
            {brokerName}
          </Text>
          {brokerDate ? (
            <Text style={[textStyles.bodySm, { color: theme.textSecondary }]}>
              {new Date(brokerDate).toLocaleDateString('en-US', {
                weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </Text>
          ) : null}
        </View>
      </View>

      {loading && entries.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <View style={styles.rowWrapper}>
              <VesselEntryRow entry={item} index={index} />
            </View>
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="ferry" size={52} color={theme.textDisabled} />
              <Text style={[textStyles.h4, { color: theme.textDisabled, marginTop: spacing.lg }]}>
                No vessel entries yet
              </Text>
              <Text style={[textStyles.bodySm, { color: theme.textDisabled, marginTop: spacing.xs }]}>
                Tap + to add the first arrival
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => load(true)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={theme.textOnPrimary} />
      </TouchableOpacity>

      <AddVesselModal
        visible={modalVisible}
        brokerId={brokerId}
        onClose={() => setModalVisible(false)}
        onAdded={() => load(true)}
      />
    </View>
  );
};

type StatChipProps = {
  icon: string;
  label: string;
  value: number;
  theme: any;
};

const StatChip: React.FC<StatChipProps> = ({ icon, label, value, theme }) => (
  <View style={styles.statChip}>
    <MaterialCommunityIcons name={icon as any} size={18} color={theme.primary} />
    <Text style={[textStyles.h2, { color: theme.primary }]}>{value}</Text>
    <Text style={[textStyles.caption, { color: theme.textSecondary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  statDivider: {
    width: 1,
    height: 48,
    marginHorizontal: spacing.md,
  },
  sectionLabel: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  rowWrapper: {
    marginHorizontal: spacing.lg,
  },
  listContent: {
    paddingBottom: 100,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
