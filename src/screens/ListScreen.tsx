// ─────────────────────────────────────────────
//  LISTA · Screen · ListScreen
//  Searchable list of broker records
// ─────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { BrokerCard } from '../components/BrokerCard';
import { useBrokerRecords } from '../hooks/useBrokerRecords';
import { BrokerRecord } from '../db/brokerRepository';
import type { ListStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<ListStackParamList, 'ListRoot'>;

export const ListScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState('');
  const { records, loading, refresh } = useBrokerRecords(searchQuery);

  const handleCardPress = useCallback(
    (record: BrokerRecord) => {
      navigation.navigate('BrokerDetail', { brokerId: record.id, brokerName: record.broker_name });
    },
    [navigation]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.textDisabled} />
      <Text style={[textStyles.h3, { color: theme.textDisabled, marginTop: spacing.lg }]}>
        No records yet
      </Text>
      <Text style={[textStyles.bodySm, { color: theme.textDisabled, marginTop: spacing.xs, textAlign: 'center' }]}>
        Go to ADD RECORD to create your first broker entry
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View>
          <Text style={[textStyles.displayBold, { color: theme.primary, letterSpacing: 2 }]}>
            LISTA
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            Vessel Arrival Records
          </Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <MaterialCommunityIcons
            name={isDark ? 'weather-sunny' : 'weather-night'}
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchRow, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search broker or date..."
          placeholderTextColor={theme.textDisabled}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.textDisabled} />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
          {records.length} {records.length === 1 ? 'record' : 'records'}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BrokerCard record={item} onPress={() => handleCardPress(item)} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={records.length === 0 ? styles.listEmpty : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  themeBtn: {
    padding: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  countRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
});
