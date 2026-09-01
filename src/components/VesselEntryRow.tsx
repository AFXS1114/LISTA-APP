// ─────────────────────────────────────────────
//  LISTA · Component · VesselEntryRow
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VesselEntry } from '../db/vesselRepository';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';
import { textStyles } from '../theme/typography';

type Props = {
  entry: VesselEntry;
  index: number;
};

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const VesselEntryRow: React.FC<Props> = ({ entry, index }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      {/* Index bubble */}
      <View style={[styles.indexBubble, { backgroundColor: theme.primary + '22' }]}>
        <Text style={[textStyles.caption, { color: theme.primary, fontWeight: '700' }]}>
          #{index + 1}
        </Text>
      </View>

      <View style={styles.details}>
        {/* Vessel name */}
        <View style={styles.row}>
          <MaterialCommunityIcons name="ferry" size={15} color={theme.accent} />
          <Text style={[textStyles.bodyMedium, styles.fieldText, { color: theme.textPrimary }]}>
            {entry.vessel_name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {/* Tubs */}
          <View style={[styles.chip, { backgroundColor: theme.primary + '18' }]}>
            <MaterialCommunityIcons name="bucket-outline" size={12} color={theme.primary} />
            <Text style={[textStyles.caption, { color: theme.primary, fontWeight: '600' }]}>
              {entry.num_tubs} tubs
            </Text>
          </View>

          {/* Specie */}
          <View style={[styles.chip, { backgroundColor: theme.accent + '18' }]}>
            <MaterialCommunityIcons name="fish" size={12} color={theme.accent} />
            <Text style={[textStyles.caption, { color: theme.accent, fontWeight: '600' }]}>
              {entry.specie}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        <Text style={[textStyles.caption, { color: theme.textDisabled }]}>
          Added at {formatTime(entry.created_at)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
    padding: spacing.md,
    gap: spacing.md,
  },
  indexBubble: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldText: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
});
