// ─────────────────────────────────────────────
//  LISTA · Screen · ListScreen
//  Searchable list of broker records
// ─────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { BrokerCard } from '../components/BrokerCard';
import { useBrokerRecords } from '../hooks/useBrokerRecords';
import {
  BrokerRecord,
  deleteBrokerRecord,
  setBrokerJournalStatus,
  updateBrokerRecord,
} from '../db/brokerRepository';
import type { ListStackParamList } from '../navigation/AppNavigator';
import { queryCache } from '../cache/queryCache';

type Nav = NativeStackNavigationProp<ListStackParamList, 'ListRoot'>;

export const ListScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionRecord, setActionRecord] = useState<BrokerRecord | null>(null);
  const [editTarget, setEditTarget] = useState<BrokerRecord | null>(null);
  const [editBrokerName, setEditBrokerName] = useState('');
  const [editBrokerDate, setEditBrokerDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const { records, loading, refresh } = useBrokerRecords(searchQuery);

  const handleCardPress = useCallback(
    (record: BrokerRecord) => {
      if (actionRecord) {
        setActionRecord(null);
        return;
      }
      navigation.navigate('BrokerDetail', { brokerId: record.id, brokerName: record.broker_name });
    },
    [actionRecord, navigation]
  );

  const handleLongPress = useCallback((record: BrokerRecord) => {
    setActionRecord(record);
  }, []);

  const handleEditOpen = useCallback((record: BrokerRecord) => {
    setEditTarget(record);
    setEditBrokerName(record.broker_name);
    setEditBrokerDate(new Date(record.date));
    setActionRecord(null);
  }, []);

  const handleDelete = useCallback(
    (record: BrokerRecord) => {
      Alert.alert(
        'Delete broker record',
        `Delete "${record.broker_name}"? This will remove the record from the list.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteBrokerRecord(record.id);
                queryCache.invalidateAll();
                await refresh();
              } catch (error) {
                console.error('[ListScreen] Failed to delete broker', error);
              }
            },
          },
        ]
      );
    },
    [refresh]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editTarget) return;
    const trimmedName = editBrokerName.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Broker name is required.');
      return;
    }

    try {
      await updateBrokerRecord(editTarget.id, {
        broker_name: trimmedName,
        date: editBrokerDate.toISOString().split('T')[0],
      });
      queryCache.invalidateAll();
      setEditTarget(null);
      await refresh();
    } catch (error) {
      console.error('[ListScreen] Failed to update broker', error);
      Alert.alert('Error', 'Unable to save broker changes.');
    }
  }, [editBrokerDate, editBrokerName, editTarget, refresh]);

  const handleToggleListed = useCallback(
    async (recordId: number, currentValue: boolean) => {
      try {
        await setBrokerJournalStatus(recordId, !currentValue);
        queryCache.invalidateAll();
        await refresh();
      } catch (error) {
        console.error('[ListScreen] Failed to update journal status', error);
      }
    },
    [refresh]
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

      {actionRecord && (
        <View style={[styles.actionBar, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEditOpen(actionRecord)}>
            <Text style={[textStyles.bodyMedium, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(actionRecord)}>
            <Text style={[textStyles.bodyMedium, { color: theme.primary }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActionRecord(null)}>
            <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BrokerCard
            record={item}
            onPress={() => handleCardPress(item)}
            onLongPress={() => handleLongPress(item)}
            onToggleListed={() => handleToggleListed(item.id, item.listed_in_journal === 1)}
          />
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

      <Modal
        visible={Boolean(editTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            <Text style={[textStyles.h3, { color: theme.textPrimary }]}>Edit broker</Text>

            <Text style={[textStyles.label, { color: theme.textSecondary, marginTop: spacing.md }]}>Broker name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              value={editBrokerName}
              onChangeText={setEditBrokerName}
              placeholder="Broker name"
              placeholderTextColor={theme.textDisabled}
            />

            <Text style={[textStyles.label, { color: theme.textSecondary, marginTop: spacing.md }]}>Date</Text>
            <TouchableOpacity
              style={[styles.input, styles.dateInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
              onPress={() => setShowEditDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={18} color={theme.primary} />
              <Text style={[textStyles.body, { color: theme.textPrimary, flex: 1 }]}>
                {editBrokerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {showEditDatePicker && (
              <DateTimePicker
                value={editBrokerDate}
                mode="date"
                display="default"
                onChange={(_, selected) => {
                  setShowEditDatePicker(false);
                  if (selected) setEditBrokerDate(selected);
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setEditTarget(null)}>
                <Text style={[textStyles.bodyMedium, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonPrimary, { backgroundColor: theme.primary }]}
                onPress={handleSaveEdit}
              >
                <Text style={[textStyles.bodyMedium, { color: theme.textOnPrimary }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalButtonSecondary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  modalButtonPrimary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
