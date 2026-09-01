// ─────────────────────────────────────────────
//  LISTA · Component · BrokerCard
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BrokerRecord } from '../db/brokerRepository';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, shadow } from '../theme/spacing';
import { textStyles } from '../theme/typography';

type Props = {
  record: BrokerRecord;
  vesselCount?: number;
  onPress: () => void;
};

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export const BrokerCard: React.FC<Props> = ({ record, vesselCount, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          shadowColor: theme.shadow,
        },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: theme.primary }]} />

      <View style={styles.content}>
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="account-tie"
            size={16}
            color={theme.accent}
            style={styles.icon}
          />
          <Text style={[textStyles.h4, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
            {record.broker_name}
          </Text>
          {record.synced === 0 && (
            <View style={[styles.badge, { backgroundColor: theme.accent + '22' }]}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={12} color={theme.accent} />
            </View>
          )}
        </View>

        <View style={styles.row}>
          <MaterialCommunityIcons
            name="calendar-outline"
            size={14}
            color={theme.textSecondary}
            style={styles.icon}
          />
          <Text style={[textStyles.bodySm, { color: theme.textSecondary }]}>
            {formatDate(record.date)}
          </Text>
        </View>

        {vesselCount !== undefined && (
          <View style={styles.row}>
            <MaterialCommunityIcons
              name="ferry"
              size={14}
              color={theme.textSecondary}
              style={styles.icon}
            />
            <Text style={[textStyles.bodySm, { color: theme.textSecondary }]}>
              {vesselCount} vessel{vesselCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={theme.textDisabled}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    overflow: 'hidden',
    ...shadow.sm,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  badge: {
    padding: spacing.xs,
    borderRadius: radius.full,
    marginLeft: spacing.xs,
  },
  chevron: {
    marginRight: spacing.md,
  },
});
