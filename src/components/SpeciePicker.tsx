// ─────────────────────────────────────────────
//  LISTA · Component · SpeciePicker
//  Dropdown of common fish species with a
//  "Custom" option that reveals a text input.
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, shadow } from '../theme/spacing';
import { textStyles } from '../theme/typography';

export const SPECIES_LIST = [
  'Tamban',
  'Galunggong',
  'Bangus',
  'Tilapia',
  'Alumahan',
  'Tulingan',
  'Dilis',
  'Matambaka',
  'Kitang',
  'Lapu-Lapu',
  'Maya-Maya',
  'Pampano',
  'Espada',
  'Hasa-Hasa',
  'Squid',
  'Mixed',
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const SpeciePicker: React.FC<Props> = ({ value, onChange }) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  const isCustom = value && !SPECIES_LIST.includes(value);

  const handleSelect = (specie: string) => {
    if (specie === '__custom__') {
      setCustomMode(true);
      setModalVisible(false);
    } else {
      onChange(specie);
      setModalVisible(false);
      setCustomMode(false);
    }
  };

  const handleCustomConfirm = () => {
    if (customText.trim()) {
      onChange(customText.trim());
      setCustomText('');
      setCustomMode(false);
    }
  };

  return (
    <View>
      {/* Picker button */}
      <TouchableOpacity
        style={[
          styles.picker,
          { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
        ]}
        onPress={() => {
          setCustomMode(false);
          setModalVisible(true);
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="fish" size={16} color={theme.accent} />
        <Text
          style={[
            textStyles.body,
            { flex: 1, color: value ? theme.textPrimary : theme.textDisabled },
          ]}
        >
          {value || 'Select species...'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>

      {/* Custom input (shown after selecting "Custom") */}
      {(customMode || isCustom) && (
        <View style={styles.customRow}>
          <TextInput
            style={[
              styles.customInput,
              { backgroundColor: theme.inputBackground, borderColor: theme.accent, color: theme.textPrimary },
            ]}
            value={customMode ? customText : value}
            onChangeText={customMode ? setCustomText : onChange}
            placeholder="Enter custom species..."
            placeholderTextColor={theme.textDisabled}
            autoFocus={customMode}
            onSubmitEditing={customMode ? handleCustomConfirm : undefined}
          />
          {customMode && (
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              onPress={handleCustomConfirm}
            >
              <MaterialCommunityIcons name="check" size={18} color={theme.textOnPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Species Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface, ...shadow.lg }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[textStyles.h4, { color: theme.textPrimary, padding: spacing.lg, paddingBottom: spacing.md }]}>
              Select Species
            </Text>

            <FlatList
              data={[...SPECIES_LIST, '__custom__']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item === value && { backgroundColor: theme.primary + '22' },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  {item === '__custom__' ? (
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.accent} />
                  ) : (
                    <MaterialCommunityIcons name="fish" size={16} color={theme.textSecondary} />
                  )}
                  <Text
                    style={[
                      textStyles.body,
                      {
                        color: item === value ? theme.primary : item === '__custom__' ? theme.accent : theme.textPrimary,
                        flex: 1,
                      },
                    ]}
                  >
                    {item === '__custom__' ? 'Custom...' : item}
                  </Text>
                  {item === value && (
                    <MaterialCommunityIcons name="check" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.list}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  customRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  confirmBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    borderRadius: radius.xl,
    maxHeight: 480,
    overflow: 'hidden',
  },
  list: {
    paddingBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
