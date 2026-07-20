import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { 
  UserProfile, 
  Meal, 
  Workout, 
  WeightLog, 
  WaterLog, 
  GemTransaction, 
  Achievement, 
  DailyGoals,
  Streak 
} from '../types';

// Key Names for AsyncStorage
const KEYS = {
  PROFILE: 'ft_profile',
  MEALS: 'ft_meals',
  WORKOUTS: 'ft_workouts',
  WEIGHT_LOGS: 'ft_weight_logs',
  WATER_LOGS: 'ft_water_logs',
  DAILY_GOALS: 'ft_daily_goals',
  GEM_TRANSACTIONS: 'ft_gem_transactions',
  ACHIEVEMENTS: 'ft_achievements',
  STREAK: 'ft_streak'
};

// Local storage helpers
const getLocal = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from AsyncStorage:`, e);
    return defaultValue;
  }
};

const setLocal = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to AsyncStorage:`, e);
  }
};

// Seed Achievements for Local Mode
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_meal', title: 'First Meal Logged', description: 'Log your first meal in the app.', badge: '🍳', gemReward: 10, targetType: 'meals_logged', targetValue: 1, currentValue: 0, unlocked: false },
  { id: 'first_scan', title: 'First AI Scan', description: 'Successfully scan a meal photo with AI.', badge: '📸', gemReward: 15, targetType: 'meals_logged', targetValue: 2, currentValue: 0, unlocked: false },
  { id: 'first_workout', title: 'First Workout', description: 'Log your first workout session.', badge: '🏋️', gemReward: 20, targetType: 'workouts_logged', targetValue: 1, currentValue: 0, unlocked: false },
  { id: 'workouts_10', title: 'Workout Warrior', description: 'Log 10 workout sessions.', badge: '💪', gemReward: 50, targetType: 'workouts_logged', targetValue: 10, currentValue: 0, unlocked: false },
  { id: 'workouts_50', title: 'Iron Veteran', description: 'Log 50 workout sessions.', badge: '🔥', gemReward: 150, targetType: 'workouts_logged', targetValue: 50, currentValue: 0, unlocked: false },
  { id: 'streak_7', title: 'Weekly Fire', description: 'Maintain a 7-day tracking streak.', badge: '🔥', gemReward: 50, targetType: 'streak_days', targetValue: 7, currentValue: 0, unlocked: false },
  { id: 'streak_30', title: 'Monthly Dedication', description: 'Maintain a 30-day tracking streak.', badge: '🏆', gemReward: 200, targetType: 'streak_days', targetValue: 30, currentValue: 0, unlocked: false },
  { id: 'protein_master', title: 'Protein Master', description: 'Meet your protein goal 5 times.', badge: '🍗', gemReward: 40, targetType: 'protein_target_met', targetValue: 5, currentValue: 0, unlocked: false },
  { id: 'water_master', title: 'Hydration Champion', description: 'Meet your water goal 10 times.', badge: '💧', gemReward: 30, targetType: 'water_target_met', targetValue: 10, currentValue: 0, unlocked: false }
];

export const dbService = {
  // ==========================================
  // PROFILE OPERATIONS
  // ==========================================
  getProfile: async (userId: string = 'default-user'): Promise<UserProfile | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null; // Doesn't exist
        console.error('Supabase profile error:', error);
      } else {
        return {
          name: data.name,
          age: data.age,
          gender: data.gender,
          height: data.height,
          currentWeight: data.current_weight,
          targetWeight: data.target_weight,
          activityLevel: data.activity_level,
          goal: data.goal,
          calorieTarget: data.calorie_target,
          macroTargets: {
            protein: data.protein_target,
            carbs: data.carbs_target,
            fat: data.fat_target,
            fiber: data.fiber_target,
          },
          waterTarget: data.water_target,
          gems: data.gems,
          level: data.level,
          streak: data.streak,
          onboardingCompleted: data.onboarding_completed
        };
      }
    }
    // AsyncStorage fallback
    return getLocal<UserProfile | null>(KEYS.PROFILE, null);
  },

  saveProfile: async (profile: UserProfile, userId: string = 'default-user'): Promise<void> => {
    if (isSupabaseConfigured) {
      const dbProfile = {
        id: userId,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        current_weight: profile.currentWeight,
        target_weight: profile.targetWeight,
        activity_level: profile.activityLevel,
        goal: profile.goal,
        calorie_target: profile.calorieTarget,
        protein_target: profile.macroTargets.protein,
        carbs_target: profile.macroTargets.carbs,
        fat_target: profile.macroTargets.fat,
        fiber_target: profile.macroTargets.fiber,
        water_target: profile.waterTarget,
        gems: profile.gems,
        level: profile.level,
        streak: profile.streak,
        onboarding_completed: profile.onboardingCompleted,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(dbProfile);
      
      if (error) console.error('Supabase profile save error:', error);
    }
    // AsyncStorage fallback
    await setLocal(KEYS.PROFILE, profile);
  },

  // ==========================================
  // MEALS OPERATIONS
  // ==========================================
  getMeals: async (date: string, userId: string = 'default-user'): Promise<Meal[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date);
      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          category: item.category,
          name: item.name,
          photoUri: item.photo_url,
          date: item.date,
          time: item.time,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          foods: item.foods
        }));
      }
      console.error('Supabase meals fetch error:', error);
    }
    const allMeals = await getLocal<Meal[]>(KEYS.MEALS, []);
    return allMeals.filter(m => m.date === date);
  },

  saveMeal: async (meal: Meal): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('meals').insert({
        user_id: meal.userId,
        category: meal.category,
        name: meal.name,
        photo_url: meal.photoUri,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
        foods: meal.foods,
        date: meal.date,
        time: meal.time
      });
      if (error) console.error('Supabase meal save error:', error);
    }
    const allMeals = await getLocal<Meal[]>(KEYS.MEALS, []);
    allMeals.push(meal);
    await setLocal(KEYS.MEALS, allMeals);
  },

  deleteMeal: async (mealId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('meals').delete().eq('id', mealId);
      if (error) console.error('Supabase meal delete error:', error);
    }
    const allMeals = await getLocal<Meal[]>(KEYS.MEALS, []);
    const filtered = allMeals.filter(m => m.id !== mealId);
    await setLocal(KEYS.MEALS, filtered);
  },

  // ==========================================
  // WORKOUT OPERATIONS
  // ==========================================
  getWorkouts: async (date: string, userId: string = 'default-user'): Promise<Workout[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercise_sets (*)
          )
        `)
        .eq('user_id', userId)
        .eq('date', date);
      
      if (!error && data) {
        return data.map((w: any) => ({
          id: w.id,
          userId: w.user_id,
          name: w.name,
          date: w.date,
          durationSeconds: w.duration_seconds,
          totalVolume: w.total_volume,
          totalSets: w.total_sets,
          totalReps: w.total_reps,
          exercises: w.workout_exercises.map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            notes: e.notes,
            sets: e.exercise_sets.map((s: any) => ({
              id: s.id,
              weightKg: s.weight_kg,
              reps: s.reps,
              completed: s.completed,
              isPR: s.is_pr
            }))
          }))
        }));
      }
      console.error('Supabase workouts fetch error:', error);
    }
    const allWorkouts = await getLocal<Workout[]>(KEYS.WORKOUTS, []);
    return allWorkouts.filter(w => w.date === date);
  },

  saveWorkout: async (workout: Workout): Promise<void> => {
    if (isSupabaseConfigured) {
      // 1. Insert Workout
      const { data: wData, error: wError } = await supabase
        .from('workouts')
        .insert({
          user_id: workout.userId,
          name: workout.name,
          duration_seconds: workout.durationSeconds,
          total_volume: workout.totalVolume,
          total_sets: workout.totalSets,
          total_reps: workout.totalReps,
          date: workout.date
        })
        .select()
        .single();
      
      if (wError) {
        console.error('Supabase workout save error:', wError);
        return;
      }
      
      // 2. Insert exercises & sets recursively
      for (const ex of workout.exercises) {
        const { data: exData, error: exError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: wData.id,
            name: ex.name,
            category: ex.category,
            notes: ex.notes
          })
          .select()
          .single();
          
        if (exError) continue;
        
        const setsToInsert = ex.sets.map(s => ({
          workout_exercise_id: exData.id,
          weight_kg: s.weightKg,
          reps: s.reps,
          completed: s.completed,
          is_pr: s.isPR
        }));
        
        await supabase.from('exercise_sets').insert(setsToInsert);
      }
    }
    const allWorkouts = await getLocal<Workout[]>(KEYS.WORKOUTS, []);
    allWorkouts.push(workout);
    await setLocal(KEYS.WORKOUTS, allWorkouts);
  },

  // ==========================================
  // WATER OPERATIONS
  // ==========================================
  getWaterLog: async (date: string, userId: string = 'default-user'): Promise<number> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', userId)
        .eq('date', date);
      if (!error && data) {
        return data.reduce((acc: number, curr: any) => acc + curr.amount_ml, 0);
      }
    }
    const logs = await getLocal<WaterLog[]>(KEYS.WATER_LOGS, []);
    return logs
      .filter(l => l.date === date)
      .reduce((acc: number, curr: any) => acc + curr.amountMl, 0);
  },

  addWater: async (amountMl: number, date: string, userId: string = 'default-user'): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.from('water_logs').insert({
        user_id: userId,
        amount_ml: amountMl,
        date: date
      });
    }
    const logs = await getLocal<WaterLog[]>(KEYS.WATER_LOGS, []);
    logs.push({
      id: Math.random().toString(),
      userId,
      date,
      amountMl
    });
    await setLocal(KEYS.WATER_LOGS, logs);
  },

  // ==========================================
  // WEIGHT LOGS OPERATIONS
  // ==========================================
  getWeightLogs: async (userId: string = 'default-user'): Promise<WeightLog[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (!error && data) {
        return data.map((w: any) => ({
          id: w.id,
          userId: w.user_id,
          weightKg: w.weight_kg,
          date: w.date
        }));
      }
    }
    return getLocal<WeightLog[]>(KEYS.WEIGHT_LOGS, []);
  },

  logWeight: async (weightKg: number, date: string, userId: string = 'default-user'): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.from('weight_logs').insert({
        user_id: userId,
        weight_kg: weightKg,
        date: date
      });
    }
    const logs = await getLocal<WeightLog[]>(KEYS.WEIGHT_LOGS, []);
    // Remove if there's already weight logged today
    const filtered = logs.filter(l => l.date !== date);
    filtered.push({
      id: Math.random().toString(),
      userId,
      date,
      weightKg
    });
    // Sort chronologically
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    await setLocal(KEYS.WEIGHT_LOGS, filtered);
  },

  // ==========================================
  // GEMS & ACHIEVEMENTS OPERATIONS
  // ==========================================
  getGemTransactions: async (userId: string = 'default-user'): Promise<GemTransaction[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('gem_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((g: any) => ({
          id: g.id,
          userId: g.user_id,
          amount: g.amount,
          reason: g.reason,
          date: g.date
        }));
      }
    }
    return getLocal<GemTransaction[]>(KEYS.GEM_TRANSACTIONS, []);
  },

  addGemTransaction: async (amount: number, reason: string, date: string, userId: string = 'default-user'): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.from('gem_transactions').insert({
        user_id: userId,
        amount,
        reason,
        date
      });
    }
    const txs = await getLocal<GemTransaction[]>(KEYS.GEM_TRANSACTIONS, []);
    txs.unshift({
      id: Math.random().toString(),
      userId,
      amount,
      reason,
      date
    });
    await setLocal(KEYS.GEM_TRANSACTIONS, txs);
  },

  getAchievements: async (userId: string = 'default-user'): Promise<Achievement[]> => {
    const localAchievements = await getLocal<Achievement[]>(KEYS.ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS);
    if (isSupabaseConfigured) {
      const { data: unlocked, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);
      
      if (!error && unlocked) {
        const unlockedIds = new Map(unlocked.map((u: any) => [u.achievement_id, u.unlocked_at]));
        return localAchievements.map(a => {
          const isUnlocked = unlockedIds.has(a.id);
          const unlockedAtVal = unlockedIds.get(a.id);
          return {
            ...a,
            unlocked: isUnlocked,
            unlockedAt: unlockedAtVal ? String(unlockedAtVal) : undefined
          };
        });
      }
    }
    return localAchievements;
  },

  saveAchievements: async (achievements: Achievement[]): Promise<void> => {
    await setLocal(KEYS.ACHIEVEMENTS, achievements);
  },

  unlockAchievementCloud: async (achievementId: string, userId: string = 'default-user'): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.from('user_achievements').upsert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString()
      });
    }
  },

  // ==========================================
  // DAILY GOALS & STREAKS
  // ==========================================
  getDailyGoals: async (date: string, userId: string = 'default-user'): Promise<DailyGoals> => {
    const defaultGoals: DailyGoals = {
      date,
      loggedBreakfast: false,
      loggedLunch: false,
      loggedDinner: false,
      completedWorkout: false,
      metProteinGoal: false,
      metFiberGoal: false,
      drankWater: false
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
      
      if (!error && data) {
        return {
          date: data.date,
          loggedBreakfast: data.logged_breakfast,
          loggedLunch: data.logged_lunch,
          loggedDinner: data.logged_dinner,
          completedWorkout: data.completed_workout,
          metProteinGoal: data.met_protein_goal,
          metFiberGoal: data.met_fiber_goal,
          drankWater: data.drank_water
        };
      }
    }
    
    const allGoals = await getLocal<DailyGoals[]>(KEYS.DAILY_GOALS, []);
    const found = allGoals.find(g => g.date === date);
    return found || defaultGoals;
  },

  saveDailyGoals: async (goals: DailyGoals, userId: string = 'default-user'): Promise<void> => {
    if (isSupabaseConfigured) {
      // Calculate a simplistic consistency score for the cloud
      let completed = 0;
      let total = 7;
      if (goals.loggedBreakfast) completed++;
      if (goals.loggedLunch) completed++;
      if (goals.loggedDinner) completed++;
      if (goals.completedWorkout) completed++;
      if (goals.metProteinGoal) completed++;
      if (goals.metFiberGoal) completed++;
      if (goals.drankWater) completed++;
      const score = Math.round((completed / total) * 100);

      await supabase.from('daily_goals').upsert({
        user_id: userId,
        date: goals.date,
        logged_breakfast: goals.loggedBreakfast,
        logged_lunch: goals.loggedLunch,
        logged_dinner: goals.loggedDinner,
        completed_workout: goals.completedWorkout,
        met_protein_goal: goals.metProteinGoal,
        met_fiber_goal: goals.metFiberGoal,
        drank_water: goals.drankWater,
        consistency_score: score,
        updated_at: new Date().toISOString()
      });
    }

    const allGoals = await getLocal<DailyGoals[]>(KEYS.DAILY_GOALS, []);
    const filtered = allGoals.filter(g => g.date !== goals.date);
    filtered.push(goals);
    await setLocal(KEYS.DAILY_GOALS, filtered);
  },

  getStreak: async (): Promise<Streak> => {
    return getLocal<Streak>(KEYS.STREAK, {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null
    });
  },

  saveStreak: async (streak: Streak): Promise<void> => {
    await setLocal(KEYS.STREAK, streak);
  }
};
