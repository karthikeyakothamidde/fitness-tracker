import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#09090B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    textSecondary: '#64748B',
    primary: '#6366F1', // Indigo
    primaryHover: '#4F46E5',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Legacy support for template components
    backgroundElement: '#F1F5F9', // slate-100
    backgroundSelected: '#E2E8F0', // slate-200
    
    // Fitness Accent Colors
    calories: '#FF6B4A', // Coral
    protein: '#3B82F6', // Blue
    carbs: '#F59E0B', // Gold
    fat: '#A855F7', // Purple
    fiber: '#10B981', // Emerald
    water: '#0EA5E9', // Water blue
    gems: '#06B6D4', // Diamond Cyan
    streak: '#F97316', // Orange Fire
    workout: '#EF4444', // Crimson
  },
  dark: {
    text: '#F8FAFC',
    background: '#09090B', // Deep Charcoal-Black
    card: '#18181B', // Zinc-900 Card Surface
    border: '#27272A', // Zinc-800 Border
    textSecondary: '#A1A1AA', // Zinc-400 Text
    primary: '#818CF8', // Indigo-400
    primaryHover: '#6366F1',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    
    // Legacy support for template components
    backgroundElement: '#27272A', // Zinc-800
    backgroundSelected: '#3F3F46', // Zinc-700
    
    // Fitness Accent Colors
    calories: '#FF7C5E', // Warm Coral
    protein: '#60A5FA', // Bright Blue
    carbs: '#FBBF24', // Yellow Gold
    fat: '#C084FC', // Light Purple
    fiber: '#34D399', // Emerald Green
    water: '#38BDF8', // Cyan Water
    gems: '#22D3EE', // Sapphire Diamond
    streak: '#FB923C', // Flame Orange
    workout: '#F87171', // Light Crimson
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    rounded: 'Outfit, ui-rounded, sans-serif',
    mono: 'Fira Code, monospace',
  },
});

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 480; // Optimized mobile width constraints for desktop web wrappers
