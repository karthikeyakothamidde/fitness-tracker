import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';
import { Home, Apple, Camera, Activity, User } from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  return (
    <Tabs style={[styles.mainLayout, { backgroundColor: colors.background }]}>
      <TabSlot style={styles.contentSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon={Home}>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="nutrition" href="/nutrition" asChild>
            <TabButton icon={Apple}>Food</TabButton>
          </TabTrigger>
          <TabTrigger name="scan" href="/scan" asChild>
            <TabButton icon={Camera} isScanner>Scan</TabButton>
          </TabTrigger>
          <TabTrigger name="workout" href="/workout" asChild>
            <TabButton icon={Activity}>Workout</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={User}>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps extends TabTriggerSlotProps {
  icon: React.ComponentType<any>;
  isScanner?: boolean;
}

export function TabButton({ children, isFocused, icon: IconComponent, isScanner, ...props }: TabButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  if (isScanner) {
    return (
      <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
        <View style={[styles.scannerButton, { backgroundColor: colors.primary }]}>
          <IconComponent size={24} color="#09090B" />
        </View>
        <ThemedText style={[styles.tabLabel, { color: colors.primary, marginTop: 4, fontWeight: '700' }]}>
          {children}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <IconComponent 
        size={20} 
        color={isFocused ? colors.primary : colors.textSecondary} 
        strokeWidth={isFocused ? 2.5 : 2}
      />
      <ThemedText style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.textSecondary }]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  return (
    <View {...props} style={[styles.tabListContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  mainLayout: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  phoneMockupWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMockupInner: {
    width: '100%',
    maxWidth: 480, // Restrict maximum width on desktop to resemble a mobile viewport
    height: '100%',
    maxHeight: 900,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  contentSlot: {
    flex: 1,
    marginBottom: 72, // Room for bottom tab navigation
  },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Spacing.one,
    zIndex: 100,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingVertical: Spacing.one,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'system-ui',
  },
  pressed: {
    opacity: 0.7,
  },
  scannerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
