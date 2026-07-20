import React, { useEffect } from 'react';
import { ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FitnessProvider, useFitness } from '../context/FitnessContext';
import { AnimatedSplashOverlay } from '../components/animated-icon';
import AppTabs from '../components/app-tabs';
import { LoginView } from '../components/LoginView';
import { OnboardingView } from '../components/OnboardingView';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

function AppGate() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: fitnessLoading, levelUpTrigger, dismissLevelUp, gemRewardTrigger, dismissGemReward } = useFitness();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  // Dismiss splash screen once loading is done
  useEffect(() => {
    if (!authLoading && !fitnessLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authLoading, fitnessLoading]);

  // Loading state
  if (authLoading || (user && fitnessLoading)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 1. Not Authenticated -> Show Login View
  if (!user) {
    return <LoginView />;
  }

  // 2. Authenticated but Onboarding Incomplete -> Show Onboarding View
  if (!profile || !profile.onboardingCompleted) {
    return <OnboardingView />;
  }

  // 3. Authenticated & Onboarded -> Render standard AppTabs layout
  if (Platform.OS === 'web') {
    return (
      <View style={styles.phoneMockupWrapper}>
        <View style={[styles.phoneMockupInner, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <AppTabs />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, height: '100%' }}>
      <AppTabs />
    </View>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <FitnessProvider>
          <AnimatedSplashOverlay />
          <AppGate />
        </FitnessProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneMockupWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090B',
  },
  phoneMockupInner: {
    width: '100%',
    maxWidth: 480,
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
});
