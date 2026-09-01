// ─────────────────────────────────────────────
//  LISTA · Screen · SummaryScreen
//  Consolidated view: per-broker totals
//  grouped by specie.
// ─────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, shadow } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { getVesselSummary, VesselSummaryRow } from '../db/vesselRepository';
import { CACHE_KEYS, queryCache } from '../cache/queryCache';

type BrokerSummary = {
  broker_id: number;
  broker_name: string;
  date: string;
  totalVessels: number;
  totalTubs: number;
  species: { specie: string; tubs: number; vessels: number }[];
};

function groupSummary(rows: VesselSummaryRow[]): BrokerSummary[] {
  const map = new Map<number, BrokerSummary>();
  for (const row of rows) {
    if (!map.has(row.broker_id)) {
      map.set(row.broker_id, {
        broker_id: row.broker_id,
        broker_name: row.broker_name,
        date: row.date,
        totalVessels: 0,
        totalTubs: 0,
        species: [],
      });
    }
    const entry = map.get(row.broker_id)!;
    if (row.specie) {
      entry.species.push({ specie: row.specie, tubs: row.total_tubs, vessels: row.vessel_count });
      entry.totalVessels += row.vessel_count;
      entry.totalTubs += row.total_tubs;
    }
  }
  return Array.from(map.values());
}

export const SummaryScreen: React.FC = () => {
  const { theme } = useTheme();
  const [summaries, setSummaries] = useState<BrokerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!forceRefresh) {
        const cached = queryCache.get<BrokerSummary[]>(CACHE_KEYS.summary);
        if (cached) {
          setSummaries(cached);
          setLoading(false);
          return;
        }
      }
      const rows = await getVesselSummary();
      const grouped = groupSummary(rows);
      queryCache.set(CACHE_KEYS.summary, grouped, 60_000);
      setSummaries(grouped);
    } catch (e) {
      console.error('[SummaryScreen]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Grand totals
  const grandTotalVessels = summaries.reduce((s, b) => s + b.totalVessels, 0);
  const grandTotalTubs = summaries.reduce((s, b) => s + b.totalTubs, 0);

  const renderHeader = () => (
    <View>
      {/* Grand total strip */}
      <View style={[styles.grandTotalStrip, { backgroundColor: theme.primary }]}>
        <TotalStat icon="ferry" label="Total Vessels" value={grandTotalVessels} textColor={theme.textOnPrimary} />
        <View style={[styles.statDivider, { backgroundColor: theme.textOnPrimary + '44' }]} />
        <TotalStat icon="bucket-outline" label="Total Tubs" value={grandTotalTubs} textColor={theme.textOnPrimary} />
        <View style={[styles.statDivider, { backgroundColor: theme.textOnPrimary + '44' }]} />
        <TotalStat icon="account-tie" label="Brokers" value={summaries.length} textColor={theme.textOnPrimary} />
      </View>

      <Text style={[textStyles.label, styles.sectionLabel, { color: theme.textSecondary }]}>
        Per-Broker Breakdown
      </Text>
    </View>
  );

  if (loading && summaries.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name="chart-bar" size={26} color={theme.primary} />
        <Text style={[textStyles.h2, { color: theme.textPrimary, marginLeft: spacing.sm }]}>
          Summary
        </Text>
      </View>

      <FlatList
        data={summaries}
        keyExtractor={(item) => String(item.broker_id)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-bar" size={56} color={theme.textDisabled} />
            <Text style={[textStyles.h4, { color: theme.textDisabled, marginTop: spacing.lg }]}>
              No data yet
            </Text>
            <Text style={[textStyles.bodySm, { color: theme.textDisabled, textAlign: 'center' }]}>
              Add broker records to see the summary
            </Text>
          </View>
        }
        renderItem={({ item }) => <BrokerSummaryCard summary={item} theme={theme} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => load(true)}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={summaries.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ── Sub-components ─────────────────────────────────────────────────

type TotalStatProps = { icon: string; label: string; value: number; textColor: string };
const TotalStat: React.FC<TotalStatProps> = ({ icon, label, value, textColor }) => (
  <View style={styles.totalStat}>
    <MaterialCommunityIcons name={icon as any} size={18} color={textColor} />
    <Text style={{ fontSize: 24, fontWeight: '700', color: textColor }}>{value}</Text>
    <Text style={{ fontSize: 11, color: textColor + 'CC' }}>{label}</Text>
  </View>
);

type BrokerSummaryCardProps = { summary: BrokerSummary; theme: any };
const BrokerSummaryCard: React.FC<BrokerSummaryCardProps> = ({ summary, theme }) => {
  const dateStr = new Date(summary.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadow }]}>
      {/* Card header */}
      <View style={[styles.cardHeader, { borderBottomColor: theme.divider }]}>
        <View style={[styles.accentBar, { backgroundColor: theme.primary }]} />
        <View style={styles.cardTitleArea}>
          <Text style={[textStyles.h4, { color: theme.textPrimary }]}>{summary.broker_name}</Text>
          <Text style={[textStyles.bodySm, { color: theme.textSecondary }]}>{dateStr}</Text>
        </View>
        <View style={styles.cardTotals}>
          <Text style={[textStyles.h2, { color: theme.primary }]}>{summary.totalVessels}</Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>vessels</Text>
        </View>
      </View>

      {/* Species breakdown */}
      <View style={styles.specieRows}>
        {summary.species.map((s, i) => (
          <View key={i} style={[styles.specieRow, i < summary.species.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
            <MaterialCommunityIcons name="fish" size={14} color={theme.accent} />
            <Text style={[textStyles.bodyMedium, { color: theme.textPrimary, flex: 1 }]}>{s.specie}</Text>
            <View style={[styles.specieChip, { backgroundColor: theme.accent + '1A' }]}>
              <Text style={[textStyles.caption, { color: theme.accent, fontWeight: '600' as any }]}>
                {s.vessels}v · {s.tubs}t
              </Text>
            </View>
          </View>
        ))}
        {summary.species.length === 0 && (
          <Text style={[textStyles.bodySm, { color: theme.textDisabled, padding: spacing.sm }]}>
            No vessel entries
          </Text>
        )}
      </View>

      {/* Total tubs */}
      <View style={[styles.cardFooter, { backgroundColor: theme.primary + '12' }]}>
        <MaterialCommunityIcons name="bucket-outline" size={14} color={theme.primary} />
        <Text style={[textStyles.bodyMedium, { color: theme.primary }]}>
          {summary.totalTubs} total tubs
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  },
  grandTotalStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  totalStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  statDivider: {
    width: 1,
    height: 48,
  },
  sectionLabel: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  listContent: { paddingBottom: spacing.xl },
  emptyList: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.xs,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardTitleArea: { flex: 1, gap: 2 },
  cardTotals: { alignItems: 'center' },
  specieRows: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  specieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  specieChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
