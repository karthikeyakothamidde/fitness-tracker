export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete';
  goal: 'fat_loss' | 'muscle_gain' | 'maintenance' | 'improve_fitness';
  calorieTarget: number;
  macroTargets: {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber: number; // grams
  };
  waterTarget: number; // ml
  streak: number;
  level: number;
  gems: number;
  onboardingCompleted: boolean;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Pre-Workout' | 'Post-Workout';

export interface FoodItem {
  name: string;
  quantity: number; // value e.g. 150
  unit: string; // e.g. "g", "ml", "pcs"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Meal {
  id: string;
  userId: string;
  category: MealCategory;
  name: string;
  photoUri: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  foods: FoodItem[];
}

export interface ExerciseSet {
  id: string;
  weightKg: number;
  reps: number;
  completed: boolean;
  isPR?: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  category: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  name: string; // e.g., "Push Day"
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  exercises: WorkoutExercise[];
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  personalRecordWeight: number;
  personalRecordReps: number;
}

export interface WeightLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface WaterLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: string; // Emoji representing badge or icon code
  gemReward: number;
  targetType: 'meals_logged' | 'workouts_logged' | 'streak_days' | 'protein_target_met' | 'pr_unlocked' | 'water_target_met';
  targetValue: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: string; // ISO date
}

export interface GemTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  date: string; // YYYY-MM-DD
}

export interface DailyGoals {
  date: string; // YYYY-MM-DD
  loggedBreakfast: boolean;
  loggedLunch: boolean;
  loggedDinner: boolean;
  completedWorkout: boolean;
  metProteinGoal: boolean;
  metFiberGoal: boolean;
  drankWater: boolean;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
}
