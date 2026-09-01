// ─────────────────────────────────────────────
//  LISTA · Component · AddVesselModal
//  Bottom sheet to add vessel entries to an
//  existing broker record. Includes voice input.
// ─────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, shadow } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { VoiceInput } from './VoiceInput';
import { useVoiceInput, ParsedVesselFields } from '../hooks/useVoiceInput';
import { addVesselEntry } from '../db/vesselRepository';
import { CACHE_KEYS, queryCache } from '../cache/queryCache';
import { SpeciePicker } from './SpeciePicker';

type Props = {
  visible: boolean;
  brokerId: number;
  onClose: () => void;
  onAdded: () => void;
};

const INITIAL_FORM = { vessel_name: '', num_tubs: '', specie: '' };

export const AddVesselModal: React.FC<Props> = ({ visible, brokerId, onClose, onAdded }) => {
  const { theme } = useTheme();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const handleFieldsParsed = useCallback((fields: ParsedVesselFields) => {
    setForm((prev) => ({
      vessel_name: fields.vessel_name ?? prev.vessel_name,
      num_tubs: fields.num_tubs ?? prev.num_tubs,
      specie: fields.specie
        ? fields.specie.charAt(0).toUpperCase() + fields.specie.slice(1)
        : prev.specie,
    }));
  }, []);

  const { isListening, transcript, startListening, stopListening } = useVoiceInput({
    onFieldsParsed: handleFieldsParsed,
    onError: (msg) => Alert.alert('Voice Error', msg),
  });

  const handleSave = async () => {
    if (!form.vessel_name.trim()) {
      Alert.alert('Validation', 'Please enter a vessel name.');
      return;
    }
    const tubs = parseInt(form.num_tubs, 10);
    if (isNaN(tubs) || tubs <= 0) {
      Alert.alert('Validation', 'Please enter a valid number of tubs.');
      return;
    }
    if (!form.specie.trim()) {
      Alert.alert('Validation', 'Please select or enter a specie.');
      return;
    }

    try {
      setSaving(true);
      await addVesselEntry({
        broker_record_id: brokerId,
        vessel_name: form.vessel_name.trim(),
        num_tubs: tubs,
        specie: form.specie.trim(),
      });
      // Invalidate caches
      queryCache.invalidate(CACHE_KEYS.vesselList(brokerId));
      queryCache.invalidate(CACHE_KEYS.summary);
      queryCache.invalidate(CACHE_KEYS.unsyncedCount);
      setForm(INITIAL_FORM);
      onAdded();
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save vessel entry.');
      console.error('[AddVesselModal]', e);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.textPrimary },
  ];
  const labelStyle = [textStyles.label, { color: theme.textSecondary, marginBottom: spacing.xs }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvWrapper}
        >
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            {/* Header */}
            <View style={styles.header}>
              <MaterialCommunityIcons name="ferry" size={22} color={theme.primary} />
              <Text style={[textStyles.h3, { color: theme.textPrimary, flex: 1, marginLeft: spacing.sm }]}>
                Add Vessel Arrival
              </Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Voice Input */}
              <VoiceInput
                isListening={isListening}
                transcript={transcript}
                onPress={isListening ? stopListening : startListening}
              />

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              {/* Vessel Name */}
              <Text style={labelStyle}>Vessel Name</Text>
              <TextInput
                style={inputStyle}
                value={form.vessel_name}
                onChangeText={(v) => setForm((p) => ({ ...p, vessel_name: v }))}
                placeholder="e.g. MV Alvin"
                placeholderTextColor={theme.textDisabled}
              />

              {/* No. of Tubs */}
              <Text style={[labelStyle, { marginTop: spacing.md }]}>No. of Tubs</Text>
              <TextInput
                style={inputStyle}
                value={form.num_tubs}
                onChangeText={(v) => setForm((p) => ({ ...p, num_tubs: v }))}
                placeholder="e.g. 25"
                placeholderTextColor={theme.textDisabled}
                keyboardType="numeric"
              />

              {/* Specie Picker */}
              <Text style={[labelStyle, { marginTop: spacing.md }]}>Specie</Text>
              <SpeciePicker
                value={form.specie}
                onChange={(v) => setForm((p) => ({ ...p, specie: v }))}
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: theme.primary },
                  saving && styles.disabled,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={theme.textOnPrimary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color={theme.textOnPrimary} />
                    <Text style={[textStyles.button, { color: theme.textOnPrimary }]}>
                      Save Vessel
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  kvWrapper: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: '90%',
    ...shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.xl,
  },
  disabled: {
    opacity: 0.6,
  },
});
