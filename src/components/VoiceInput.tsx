// ─────────────────────────────────────────────
//  LISTA · Component · VoiceInput
//  Mic button with animated pulse ring
//  while recording.
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';
import { textStyles } from '../theme/typography';

type Props = {
  isListening: boolean;
  transcript?: string;
  onPress: () => void;
};

export const VoiceInput: React.FC<Props> = ({ isListening, transcript, onPress }) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isListening) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.5,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.6);
    }
    return () => loopRef.current?.stop();
  }, [isListening, pulseAnim, opacityAnim]);

  const bgColor = isListening ? theme.danger : theme.primary;

  return (
    <View style={styles.wrapper}>
      <View style={styles.buttonContainer}>
        {/* Pulse ring */}
        {isListening && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                backgroundColor: theme.danger,
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim,
              },
            ]}
          />
        )}
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={[styles.button, { backgroundColor: bgColor }]}
        >
          <MaterialCommunityIcons
            name={isListening ? 'microphone' : 'microphone-outline'}
            size={28}
            color={theme.textOnPrimary}
          />
        </TouchableOpacity>
      </View>

      <Text style={[textStyles.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
        {isListening ? '🔴 Listening...' : 'Tap to dictate fields'}
      </Text>

      {transcript ? (
        <View style={[styles.transcriptBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[textStyles.bodySm, { color: theme.textSecondary, fontStyle: 'italic' }]}>
            "{transcript}"
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: radius.full,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  transcriptBox: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 280,
  },
});
