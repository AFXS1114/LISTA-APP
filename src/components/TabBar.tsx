// ─────────────────────────────────────────────
//  LISTA · Component · TabBar
//  Custom swipeable tab bar with animated
//  active indicator and icon+label tabs.
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';
import { textStyles } from '../theme/typography';

export type Tab = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export const TABS: Tab[] = [
  { key: 'list',      label: 'LIST',       icon: 'format-list-bulleted' },
  { key: 'add',       label: 'ADD RECORD', icon: 'plus-circle-outline' },
  { key: 'summary',   label: 'SUMMARY',    icon: 'chart-bar' },
  { key: 'sync',      label: 'SYNC',       icon: 'cloud-sync-outline' },
];

type Props = {
  activeIndex: number;
  onTabPress: (index: number) => void;
  scrollX: Animated.Value;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

export const TabBar: React.FC<Props> = ({ activeIndex, onTabPress, scrollX }) => {
  const { theme } = useTheme();

  const indicatorLeft = scrollX.interpolate({
    inputRange: TABS.map((_, i) => i * SCREEN_WIDTH),
    outputRange: TABS.map((_, i) => i * TAB_WIDTH + TAB_WIDTH * 0.1),
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBar }]}>
      {/* Active indicator line */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: theme.tabBarActive, left: indicatorLeft, width: TAB_WIDTH * 0.8 },
        ]}
      />

      {TABS.map((tab, index) => {
        const isActive = activeIndex === index;
        const color = isActive ? theme.tabBarActive : theme.tabBarInactive;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={tab.icon} size={20} color={color} />
            <Text style={[textStyles.tabLabel, styles.label, { color }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 9,
    marginTop: 1,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 2,
    borderRadius: radius.full,
  },
});
