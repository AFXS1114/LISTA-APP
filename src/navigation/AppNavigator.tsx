// ─────────────────────────────────────────────
//  LISTA · Navigation · AppNavigator
//  Swipeable PagerView tabs + Stack for LIST
// ─────────────────────────────────────────────

import React, { useRef, useState } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { TabBar } from '../components/TabBar';
import { ListScreen } from '../screens/ListScreen';
import { BrokerDetailScreen } from '../screens/BrokerDetailScreen';
import { AddRecordScreen } from '../screens/AddRecordScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { SyncScreen } from '../screens/SyncScreen';

// ── Type definitions ──────────────────────────────────────────────
export type ListStackParamList = {
  ListRoot: undefined;
  BrokerDetail: { brokerId: number; brokerName: string };
};

const Stack = createNativeStackNavigator<ListStackParamList>();

// ── List Stack (List + Detail) ────────────────────────────────────
function ListStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ListRoot" component={ListScreen} />
      <Stack.Screen name="BrokerDetail" component={BrokerDetailScreen} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────
export const AppNavigator: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
    setActiveTab(index);
  };

  return (
    <NavigationContainer>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
          onPageScroll={(e) => {
            const { position, offset } = e.nativeEvent;
            scrollX.setValue((position + offset) * SCREEN_WIDTH);
          }}
          offscreenPageLimit={3}
        >
          {/* Page 0 — LIST */}
          <View key="list" style={styles.page}>
            <ListStack />
          </View>

          {/* Page 1 — ADD RECORD */}
          <View key="add" style={styles.page}>
            <AddRecordScreen />
          </View>

          {/* Page 2 — SUMMARY */}
          <View key="summary" style={styles.page}>
            <SummaryScreen />
          </View>

          {/* Page 3 — SYNC */}
          <View key="sync" style={styles.page}>
            <SyncScreen />
          </View>
        </PagerView>

        <TabBar
          activeIndex={activeTab}
          onTabPress={handleTabPress}
          scrollX={scrollX}
        />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    overflow: 'hidden',
  },
});
