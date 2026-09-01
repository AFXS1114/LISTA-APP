// ─────────────────────────────────────────────
//  LISTA · Screen · AddRecordScreen
//  Creates a new broker record then adds
//  vessel entries with voice support.
// ─────────────────────────────────────────────

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, shadow } from '../theme/spacing';
import { textStyles } from '../theme/typography';
import { VoiceInput } from '../components/VoiceInput';
import { SpeciePicker } from '../components/SpeciePicker';
import { useVoiceInput, ParsedVesselFields } from '../hooks/useVoiceInput';
import { createBrokerRecord } from '../db/brokerRepository';
import { addVesselEntry } from '../db/vesselRepository';
import { queryCache } from '../cache/queryCache';

type VesselForm = {
  vessel_name: string;
  num_tubs: string;
  specie: string;
};

const EMPTY_VESSEL: VesselForm = { vessel_name: '', num_tubs: '', specie: '' };

export const AddRecordScreen: React.FC = () => {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // Broker fields
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [brokerName, setBrokerName] = useState('');

  // Vessel entries
  const [vessels, setVessels] = useState<VesselForm[]>([{ ...EMPTY_VESSEL }]);
  const [activeVesselIdx, setActiveVesselIdx] = useState(0);

  const [saving, setSaving] = useState(false);

  // Voice input updates the currently active vessel form
  const handleFieldsParsed = useCallback((fields: ParsedVesselFields) => {
    setVessels((prev) => {
      const updated = [...prev];
      const current = { ...updated[activeVesselIdx] };
      if (fields.vessel_name) current.vessel_name = fields.vessel_name;
      if (fields.num_tubs) current.num_tubs = fields.num_tubs;
      if (fields.specie) current.specie = fields.specie.charAt(0).toUpperCase() + fields.specie.slice(1);
      updated[activeVesselIdx] = current;
      return updated;
    });
  }, [activeVesselIdx]);

  const { isListening, transcript, startListening, stopListening } = useVoiceInput({
    onFieldsParsed: handleFieldsParsed,
    onError: (msg) => Alert.alert('Voice Error', msg),
  });

  const updateVessel = (idx: number, field: keyof VesselForm, value: string) => {
    setVessels((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addAnotherVessel = () => {
    setVessels((prev) => [...prev, { ...EMPTY_VESSEL }]);
    const newIdx = vessels.length;
    setActiveVesselIdx(newIdx);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const removeVessel = (idx: number) => {
    if (vessels.length === 1) return; // keep at least one
    setVessels((prev) => prev.filter((_, i) => i !== idx));
    setActiveVesselIdx(Math.max(0, idx - 1));
  };

  const handleSave = async () => {
    if (!brokerName.trim()) {
      Alert.alert('Validation', 'Please enter a broker name.');
      return;
    }

    // Validate at least one vessel
    const validVessels = vessels.filter(
      (v) => v.vessel_name.trim() && v.specie.trim() && parseInt(v.num_tubs, 10) > 0
    );
    if (validVessels.length === 0) {
      Alert.alert('Validation', 'Please fill in at least one complete vessel entry.');
      return;
    }

    try {
      setSaving(true);
      const brokerId = await createBrokerRecord({
        broker_name: brokerName.trim(),
        date: date.toISOString().split('T')[0],
      });

      for (const v of validVessels) {
        await addVesselEntry({
          broker_record_id: brokerId,
          vessel_name: v.vessel_name.trim(),
          num_tubs: parseInt(v.num_tubs, 10),
          specie: v.specie.trim(),
        });
      }

      // Invalidate all broker/vessel caches
      queryCache.invalidateAll();

      // Reset form
      setBrokerName('');
      setDate(new Date());
      setVessels([{ ...EMPTY_VESSEL }]);
      setActiveVesselIdx(0);

      Alert.alert('✅ Saved', `Broker record for "${brokerName.trim()}" saved with ${validVessels.length} vessel(s).`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save record.');
      console.error('[AddRecordScreen]', e);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.textPrimary },
  ];
  const labelStyle = [textStyles.label, styles.label, { color: theme.textSecondary }];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name="plus-circle" size={26} color={theme.primary} />
        <Text style={[textStyles.h2, { color: theme.textPrimary, marginLeft: spacing.sm }]}>
          Add Record
        </Text>
      </View>

      <ScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── BROKER SECTION ── */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[textStyles.h4, styles.sectionTitle, { color: theme.textPrimary }]}>
            <MaterialCommunityIcons name="account-tie" size={16} color={theme.primary} />
            {'  '}Broker Info
          </Text>

          {/* Date */}
          <Text style={labelStyle}>Date</Text>
          <TouchableOpacity
            style={[inputStyle, styles.datePicker]}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={18} color={theme.accent} />
            <Text style={[textStyles.body, { color: theme.textPrimary }]}>
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) setDate(selected);
              }}
            />
          )}

          {/* Broker Name */}
          <Text style={[labelStyle, { marginTop: spacing.md }]}>Broker Name</Text>
          <TextInput
            style={inputStyle}
            value={brokerName}
            onChangeText={setBrokerName}
            placeholder="Enter broker name..."
            placeholderTextColor={theme.textDisabled}
          />
        </View>

        {/* ── VESSEL ENTRIES ── */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[textStyles.h4, styles.sectionTitle, { color: theme.textPrimary }]}>
            <MaterialCommunityIcons name="ferry" size={16} color={theme.accent} />
            {'  '}Vessel Entries
          </Text>

          {/* Voice Input (shared across all vessel forms) */}
          <VoiceInput
            isListening={isListening}
            transcript={transcript}
            onPress={isListening ? stopListening : startListening}
          />

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* Vessel forms */}
          {vessels.map((vessel, idx) => (
            <VesselForm
              key={idx}
              idx={idx}
              vessel={vessel}
              isActive={activeVesselIdx === idx}
              theme={theme}
              onFocus={() => setActiveVesselIdx(idx)}
              onChange={(field, val) => updateVessel(idx, field, val)}
              onRemove={vessels.length > 1 ? () => removeVessel(idx) : undefined}
            />
          ))}

          {/* Add Another Vessel */}
          <TouchableOpacity
            style={[styles.addVesselBtn, { borderColor: theme.accent }]}
            onPress={addAnotherVessel}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={18} color={theme.accent} />
            <Text style={[textStyles.bodyMedium, { color: theme.accent }]}>
              Add Another Vessel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary }, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={theme.textOnPrimary} />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={22} color={theme.textOnPrimary} />
              <Text style={[textStyles.button, { color: theme.textOnPrimary }]}>
                Save Record
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ── Inline VesselForm sub-component ────────────────────────────────

type VesselFormProps = {
  idx: number;
  vessel: VesselForm;
  isActive: boolean;
  theme: any;
  onFocus: () => void;
  onChange: (field: keyof VesselForm, val: string) => void;
  onRemove?: () => void;
};

const VesselForm: React.FC<VesselFormProps> = ({
  idx, vessel, isActive, theme, onFocus, onChange, onRemove,
}) => {
  const inputStyle = [
    styles.input,
    { backgroundColor: theme.inputBackground, borderColor: isActive ? theme.accent : theme.inputBorder, color: theme.textPrimary },
  ];
  const labelStyle = [textStyles.label, styles.label, { color: theme.textSecondary }];

  return (
    <View
      style={[
        styles.vesselCard,
        {
          borderColor: isActive ? theme.accent : theme.cardBorder,
          backgroundColor: theme.card,
        },
      ]}
    >
      <View style={styles.vesselHeader}>
        <View style={[styles.vesselIndex, { backgroundColor: theme.accent + '22' }]}>
          <Text style={[textStyles.caption, { color: theme.accent, fontWeight: '700' }]}>
            #{idx + 1}
          </Text>
        </View>
        <Text style={[textStyles.bodyMedium, { color: theme.textSecondary, flex: 1 }]}>
          Vessel Entry
        </Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={theme.danger} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={labelStyle}>Vessel Name</Text>
      <TextInput
        style={inputStyle}
        value={vessel.vessel_name}
        onChangeText={(v) => onChange('vessel_name', v)}
        onFocus={onFocus}
        placeholder="e.g. MV Alvin"
        placeholderTextColor={theme.textDisabled}
      />

      <Text style={[labelStyle, { marginTop: spacing.md }]}>No. of Tubs</Text>
      <TextInput
        style={inputStyle}
        value={vessel.num_tubs}
        onChangeText={(v) => onChange('num_tubs', v)}
        onFocus={onFocus}
        placeholder="e.g. 25"
        placeholderTextColor={theme.textDisabled}
        keyboardType="numeric"
      />

      <Text style={[labelStyle, { marginTop: spacing.md }]}>Specie</Text>
      <SpeciePicker value={vessel.specie} onChange={(v) => onChange('specie', v)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  section: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.sm,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  vesselCard: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  vesselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  vesselIndex: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  addVesselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    ...shadow.md,
  },
  disabled: { opacity: 0.6 },
});
