import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { dbService } from '../services/database';
import { 
  UserProfile, 
  Meal, 
  Workout, 
  WeightLog, 
  DailyGoals, 
  Streak, 
  Achievement, 
  MealCategory, 
  FoodItem,
  WorkoutExercise,
  ExerciseSet
} from '../types';

interface FitnessContextType {
  profile: UserProfile | null;
  selectedDate: string; // YYYY-MM-DD
  meals: Meal[];
  workouts: Workout[];
  waterMl: number;
  weightLogs: WeightLog[];
  dailyGoals: DailyGoals;
  streak: Streak;
  achievements: Achievement[];
  consistencyScore: number;
  
  // Navigation / Loading
  setSelectedDate: (date: string) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
  
  // Actions
  completeOnboarding: (name: string, age: number, gender: UserProfile['gender'], height: number, weight: number, targetWeight: number, activityLevel: UserProfile['activityLevel'], goal: UserProfile['goal']) => Promise<void>;
  addMeal: (category: MealCategory, name: string, foods: FoodItem[], photoUri: string | null) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  addWater: (amountMl: number) => Promise<void>;
  logWeight: (weightKg: number) => Promise<void>;
  
  // Active Workout Tracking
  activeWorkout: Workout | null;
  startWorkout: (routineName: string) => void;
  addExerciseToActiveWorkout: (name: string, category: string) => void;
  addSetToActiveExercise: (exerciseIndex: number) => void;
  updateActiveSet: (exerciseIndex: number, setIndex: number, updates: Partial<ExerciseSet>) => void;
  removeSetFromActiveExercise: (exerciseIndex: number, setIndex: number) => void;
  finishActiveWorkout: () => Promise<void>;
  cancelActiveWorkout: () => void;

  // Gamification helpers
  awardGems: (amount: number, reason: string) => Promise<void>;
  levelUpTrigger: number | null; // Stores level if just leveled up, for animation trigger
  dismissLevelUp: () => void;
  gemRewardTrigger: { amount: number; reason: string } | null;
  dismissGemReward: () => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

// Level calculator helper
export const getLevelFromGems = (gems: number): { level: number; name: string; minGems: number; maxGems: number } => {
  const levels = [
    { level: 1, name: 'Beginner', minGems: 0, maxGems: 249 },
    { level: 2, name: 'Bronze', minGems: 250, maxGems: 499 },
    { level: 3, name: 'Silver', minGems: 500, maxGems: 999 },
    { level: 4, name: 'Gold', minGems: 1000, maxGems: 1999 },
    { level: 5, name: 'Platinum', minGems: 2000, maxGems: 3499 },
    { level: 6, name: 'Diamond', minGems: 3500, maxGems: 4999 },
    { level: 7, name: 'Elite', minGems: 5000, maxGems: 7499 },
    { level: 8, name: 'Legend', minGems: 7500, maxGems: 999999 }
  ];
  const found = levels.find(l => gems >= l.minGems && gems <= l.maxGems);
  return found || levels[0];
};

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDateState] = useState<string>(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [waterMl, setWaterMl] = useState<number>(0);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    date: selectedDate, loggedBreakfast: false, loggedLunch: false, loggedDinner: false,
    completedWorkout: false, metProteinGoal: false, metFiberGoal: false, drankWater: false
  });
  const [streak, setStreak] = useState<Streak>({ currentStreak: 0, longestStreak: 0, lastActiveDate: null });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [consistencyScore, setConsistencyScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Active workout tracking
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);

  // Rewards notifications
  const [levelUpTrigger, setLevelUpTrigger] = useState<number | null>(null);
  const [gemRewardTrigger, setGemRewardTrigger] = useState<{ amount: number; reason: string } | null>(null);

  const dismissLevelUp = () => setLevelUpTrigger(null);
  const dismissGemReward = () => setGemRewardTrigger(null);

  // Format date helper
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
  };

  // 1. Calculations & Dynamic Consistency Scoring
  const recalculateConsistency = useCallback((goals: DailyGoals) => {
    let completed = 0;
    const totalGoals = 7;
    if (goals.loggedBreakfast) completed++;
    if (goals.loggedLunch) completed++;
    if (goals.loggedDinner) completed++;
    if (goals.completedWorkout) completed++;
    if (goals.metProteinGoal) completed++;
    if (goals.metFiberGoal) completed++;
    if (goals.drankWater) completed++;
    
    return Math.round((completed / totalGoals) * 100);
  }, []);

  // 2. Fetch all daily data
  const refreshData = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const uId = user.id;
      const loadedProfile = await dbService.getProfile(uId);
      const loadedMeals = await dbService.getMeals(selectedDate, uId);
      const loadedWorkouts = await dbService.getWorkouts(selectedDate, uId);
      const loadedWater = await dbService.getWaterLog(selectedDate, uId);
      const loadedWeight = await dbService.getWeightLogs(uId);
      const loadedGoals = await dbService.getDailyGoals(selectedDate, uId);
      const loadedStreak = await dbService.getStreak();
      const loadedAchievements = await dbService.getAchievements(uId);

      setProfile(loadedProfile);
      setMeals(loadedMeals);
      setWorkouts(loadedWorkouts);
      setWaterMl(loadedWater);
      setWeightLogs(loadedWeight);
      setDailyGoals(loadedGoals);
      setStreak(loadedStreak);
      setAchievements(loadedAchievements);
      
      setConsistencyScore(recalculateConsistency(loadedGoals));
    } catch (e) {
      console.error('Error fetching fitness data:', e);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, recalculateConsistency]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Evaluate streaks and update last active date
  const updateStreakAndActiveDate = async (uId: string) => {
    const todayStr = getTodayStr();
    let currentStreak = streak.currentStreak;
    let longestStreak = streak.longestStreak;
    const lastActive = streak.lastActiveDate;

    if (lastActive === todayStr) {
      // Already active today, streak stays the same
      return;
    }

    if (lastActive === null) {
      // First active day ever
      currentStreak = 1;
      longestStreak = Math.max(longestStreak, 1);
    } else {
      const lastActiveDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Active consecutive day
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        
        // Award streak milestones
        if (currentStreak === 7) {
          await awardGems(25, '7-Day Streak Milestone! 🔥');
        } else if (currentStreak === 30) {
          await awardGems(100, '30-Day Streak Milestone! 🏆');
        }
      } else if (diffDays > 1) {
        // Streak broken
        currentStreak = 1;
      }
    }

    const updatedStreak: Streak = {
      currentStreak,
      longestStreak,
      lastActiveDate: todayStr
    };

    setStreak(updatedStreak);
    await dbService.saveStreak(updatedStreak);
    
    // Update streak in profile
    if (profile) {
      const updatedProfile = { ...profile, streak: currentStreak };
      setProfile(updatedProfile);
      await dbService.saveProfile(updatedProfile, uId);
    }
  };

  // Evaluate and unlock achievements
  const checkAchievements = async (uId: string, updatedGoals: DailyGoals, allMeals: Meal[], allWorkouts: Workout[]) => {
    const activeAchievements = [...achievements];
    let changed = false;

    // Calculate metrics
    const totalMealsLogged = allMeals.length; // Approximate from local sync or simple counting
    const totalWorkoutsLogged = allWorkouts.length;
    const streakDays = streak.currentStreak;

    // Fetch historical records count
    const weightCount = weightLogs.length;

    for (const ach of activeAchievements) {
      if (ach.unlocked) continue;

      let currentVal = ach.currentValue;

      if (ach.targetType === 'meals_logged') {
        currentVal = totalMealsLogged;
      } else if (ach.targetType === 'workouts_logged') {
        currentVal = totalWorkoutsLogged;
      } else if (ach.targetType === 'streak_days') {
        currentVal = streakDays;
      } else if (ach.targetType === 'protein_target_met') {
        if (updatedGoals.metProteinGoal) {
          currentVal += 1;
        }
      } else if (ach.targetType === 'water_target_met') {
        if (updatedGoals.drankWater) {
          currentVal += 1;
        }
      }

      ach.currentValue = currentVal;

      if (currentVal >= ach.targetValue) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString();
        changed = true;
        
        // Award gems
        await awardGems(ach.gemReward, `Unlocked Achievement: ${ach.title} 🏆`);
        await dbService.unlockAchievementCloud(ach.id, uId);
      }
    }

    if (changed) {
      setAchievements(activeAchievements);
      await dbService.saveAchievements(activeAchievements);
    }
  };

  // Award Gems & Manage Level Ups
  const awardGems = async (amount: number, reason: string) => {
    if (!user || !profile) return;
    const uId = user.id;
    const todayStr = getTodayStr();

    // Prevent farming gems: limit daily logs earnings
    const dailyTx = await dbService.getGemTransactions(uId);
    const todayTx = dailyTx.filter(tx => tx.date === todayStr);
    const todayLoggedEarnings = todayTx
      .filter(tx => tx.reason.includes('Logged') || tx.reason.includes('Water') || tx.reason.includes('Workout'))
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Limit daily track earnings to 50 Gems to prevent abuse
    if (todayLoggedEarnings >= 50 && (reason.includes('Logged') || reason.includes('Water') || reason.includes('Workout'))) {
      console.log('Daily Gem earning limit reached. Transaction skipped.');
      return;
    }

    const updatedGems = profile.gems + amount;
    const currentLvlInfo = getLevelFromGems(profile.gems);
    const newLvlInfo = getLevelFromGems(updatedGems);

    const updatedProfile: UserProfile = {
      ...profile,
      gems: updatedGems,
      level: newLvlInfo.level
    };

    setProfile(updatedProfile);
    await dbService.saveProfile(updatedProfile, uId);
    await dbService.addGemTransaction(amount, reason, todayStr, uId);
    
    // Trigger animations
    setGemRewardTrigger({ amount, reason });
    if (newLvlInfo.level > currentLvlInfo.level) {
      setLevelUpTrigger(newLvlInfo.level);
    }
  };

  // Onboarding Complete
  const completeOnboarding = async (
    name: string, age: number, gender: UserProfile['gender'], height: number, weight: number, targetWeight: number, activityLevel: UserProfile['activityLevel'], goal: UserProfile['goal']
  ) => {
    if (!user) return;
    
    // Calculate suggested calories and macros
    // BMR (Mifflin-St Jeor Formula)
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // TDEE Multipliers
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      athlete: 1.9
    };
    const tdee = Math.round(bmr * multipliers[activityLevel]);

    // Calorie Adjustment based on Goals
    let calorieTarget = tdee;
    if (goal === 'fat_loss') calorieTarget = Math.round(tdee - 500);
    else if (goal === 'muscle_gain') calorieTarget = Math.round(tdee + 300);

    // Calculate Macros (Suggested proportions)
    // Protein: 2.0g per kg for muscle gain, 1.8g fat loss, 1.5g general
    let proteinMultiplier = 1.6;
    if (goal === 'muscle_gain') proteinMultiplier = 2.0;
    else if (goal === 'fat_loss') proteinMultiplier = 1.8;
    const protein = Math.round(weight * proteinMultiplier);

    // Fat: 20-30% of total calories. Let's use 25% (9 kcal per gram)
    const fat = Math.round((calorieTarget * 0.25) / 9);

    // Carbs: Remaining calories (4 kcal per gram)
    const carbCalories = calorieTarget - (protein * 4) - (fat * 9);
    const carbs = Math.round(carbCalories / 4);

    // Fiber: 14g per 1000 calories
    const fiber = Math.round((calorieTarget / 1000) * 14);

    // Suggested Water: 35ml per kg of bodyweight
    const waterTarget = Math.round(weight * 35);

    const initialProfile: UserProfile = {
      name,
      age,
      gender,
      height,
      currentWeight: weight,
      targetWeight,
      activityLevel,
      goal,
      calorieTarget,
      macroTargets: { protein, carbs, fat, fiber },
      waterTarget,
      streak: 0,
      level: 1,
      gems: 0,
      onboardingCompleted: true
    };

    setProfile(initialProfile);
    await dbService.saveProfile(initialProfile, user.id);
    await dbService.logWeight(weight, getTodayStr(), user.id);
  };

  // Add Meal
  const addMeal = async (category: MealCategory, name: string, foods: FoodItem[], photoUri: string | null) => {
    if (!user || !profile) return;
    const uId = user.id;
    const todayStr = getTodayStr();

    // Sum up food details
    let mealCal = 0;
    let mealProt = 0;
    let mealCarb = 0;
    let mealFat = 0;
    let mealFib = 0;

    foods.forEach(f => {
      mealCal += f.calories;
      mealProt += f.protein;
      mealCarb += f.carbs;
      mealFat += f.fat;
      mealFib += f.fiber;
    });

    const newMeal: Meal = {
      id: Math.random().toString(),
      userId: uId,
      category,
      name,
      photoUri,
      date: selectedDate,
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      calories: Math.round(mealCal),
      protein: Math.round(mealProt),
      carbs: Math.round(mealCarb),
      fat: Math.round(mealFat),
      fiber: Math.round(mealFib),
      foods
    };

    await dbService.saveMeal(newMeal);
    await updateStreakAndActiveDate(uId);

    // Update Daily Goals and check targets
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);

    // Recalculate daily totals
    const dailyProtTotal = updatedMeals.reduce((acc, curr) => acc + curr.protein, 0);
    const dailyFibTotal = updatedMeals.reduce((acc, curr) => acc + curr.fiber, 0);

    const updatedGoals: DailyGoals = {
      ...dailyGoals,
      loggedBreakfast: dailyGoals.loggedBreakfast || category === 'Breakfast',
      loggedLunch: dailyGoals.loggedLunch || category === 'Lunch',
      loggedDinner: dailyGoals.loggedDinner || category === 'Dinner',
      metProteinGoal: dailyProtTotal >= profile.macroTargets.protein,
      metFiberGoal: dailyFibTotal >= profile.macroTargets.fiber
    };

    setDailyGoals(updatedGoals);
    await dbService.saveDailyGoals(updatedGoals, uId);
    setConsistencyScore(recalculateConsistency(updatedGoals));

    // Award Gems
    await awardGems(2, `Logged ${category} Meal 🍱`);
    if (updatedGoals.metProteinGoal && !dailyGoals.metProteinGoal) {
      await awardGems(5, 'Met Daily Protein Target! 🍗');
    }
    if (updatedGoals.metFiberGoal && !dailyGoals.metFiberGoal) {
      await awardGems(3, 'Met Daily Fiber Target! 🥬');
    }

    // Achievements Evaluation
    await checkAchievements(uId, updatedGoals, updatedMeals, workouts);
  };

  // Delete Meal
  const deleteMeal = async (mealId: string) => {
    if (!user || !profile) return;
    await dbService.deleteMeal(mealId);

    const updatedMeals = meals.filter(m => m.id !== mealId);
    setMeals(updatedMeals);

    // Recalculate macro target goals
    const dailyProtTotal = updatedMeals.reduce((acc, curr) => acc + curr.protein, 0);
    const dailyFibTotal = updatedMeals.reduce((acc, curr) => acc + curr.fiber, 0);

    const updatedGoals: DailyGoals = {
      ...dailyGoals,
      // Keep category logs as true if there are other meals in that category today
      loggedBreakfast: updatedMeals.some(m => m.category === 'Breakfast'),
      loggedLunch: updatedMeals.some(m => m.category === 'Lunch'),
      loggedDinner: updatedMeals.some(m => m.category === 'Dinner'),
      metProteinGoal: dailyProtTotal >= profile.macroTargets.protein,
      metFiberGoal: dailyFibTotal >= profile.macroTargets.fiber
    };

    setDailyGoals(updatedGoals);
    await dbService.saveDailyGoals(updatedGoals, user.id);
    setConsistencyScore(recalculateConsistency(updatedGoals));
  };

  // Add Water
  const addWater = async (amountMl: number) => {
    if (!user || !profile) return;
    const uId = user.id;

    await dbService.addWater(amountMl, selectedDate, uId);
    await updateStreakAndActiveDate(uId);

    const newTotal = waterMl + amountMl;
    setWaterMl(newTotal);

    const reachedTarget = newTotal >= profile.waterTarget;
    const updatedGoals = {
      ...dailyGoals,
      drankWater: reachedTarget
    };

    setDailyGoals(updatedGoals);
    await dbService.saveDailyGoals(updatedGoals, uId);
    setConsistencyScore(recalculateConsistency(updatedGoals));

    if (reachedTarget && !dailyGoals.drankWater) {
      await awardGems(3, 'Hydration Target Reached! 💧');
    }

    await checkAchievements(uId, updatedGoals, meals, workouts);
  };

  // Log Body Weight
  const logWeight = async (weightKg: number) => {
    if (!user || !profile) return;
    const uId = user.id;

    await dbService.logWeight(weightKg, selectedDate, uId);
    await updateStreakAndActiveDate(uId);

    // Update local profile weight
    const updatedProfile = {
      ...profile,
      currentWeight: weightKg
    };
    setProfile(updatedProfile);
    await dbService.saveProfile(updatedProfile, uId);

    // Refresh Weight log history list
    const updatedLogs = await dbService.getWeightLogs(uId);
    setWeightLogs(updatedLogs);
  };

  // ==========================================
  // ACTIVE WORKOUT ACTIONS
  // ==========================================
  const startWorkout = (routineName: string) => {
    if (!user) return;
    setWorkoutStartTime(Date.now());
    setActiveWorkout({
      id: Math.random().toString(),
      userId: user.id,
      name: routineName || 'Custom Workout',
      date: selectedDate,
      durationSeconds: 0,
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      exercises: []
    });
  };

  const addExerciseToActiveWorkout = (name: string, category: string) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    updated.exercises.push({
      id: Math.random().toString(),
      name,
      category,
      sets: [
        { id: Math.random().toString(), weightKg: 0, reps: 0, completed: false }
      ]
    });
    setActiveWorkout(updated);
  };

  const addSetToActiveExercise = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    const ex = updated.exercises[exerciseIndex];
    const prevSet = ex.sets[ex.sets.length - 1];
    
    ex.sets.push({
      id: Math.random().toString(),
      weightKg: prevSet ? prevSet.weightKg : 0,
      reps: prevSet ? prevSet.reps : 0,
      completed: false
    });
    setActiveWorkout(updated);
  };

  const updateActiveSet = (exerciseIndex: number, setIndex: number, updates: Partial<ExerciseSet>) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    updated.exercises[exerciseIndex].sets[setIndex] = {
      ...updated.exercises[exerciseIndex].sets[setIndex],
      ...updates
    };
    setActiveWorkout(updated);
  };

  const removeSetFromActiveExercise = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    const ex = updated.exercises[exerciseIndex];
    if (ex.sets.length > 1) {
      ex.sets.splice(setIndex, 1);
      setActiveWorkout(updated);
    }
  };

  const finishActiveWorkout = async () => {
    if (!activeWorkout || !user) return;
    const uId = user.id;

    // Calculate duration
    const duration = workoutStartTime ? Math.round((Date.now() - workoutStartTime) / 1000) : 0;
    
    // Sum metrics
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;

    activeWorkout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalSets++;
          totalReps += s.reps;
          totalVolume += (s.weightKg * s.reps);
        }
      });
    });

    // Check if workout is empty
    if (totalSets === 0) {
      // No sets completed, cancel instead
      cancelActiveWorkout();
      return;
    }

    const completedWorkout: Workout = {
      ...activeWorkout,
      durationSeconds: duration,
      totalSets,
      totalReps,
      totalVolume,
      date: selectedDate
    };

    await dbService.saveWorkout(completedWorkout);
    await updateStreakAndActiveDate(uId);

    const updatedWorkouts = [...workouts, completedWorkout];
    setWorkouts(updatedWorkouts);

    // Update daily goal
    const updatedGoals = {
      ...dailyGoals,
      completedWorkout: true
    };
    setDailyGoals(updatedGoals);
    await dbService.saveDailyGoals(updatedGoals, uId);
    setConsistencyScore(recalculateConsistency(updatedGoals));

    // Reset active workspace
    setActiveWorkout(null);
    setWorkoutStartTime(null);

    // Award Gems
    await awardGems(10, 'Workout Completed! 🏋️');
    
    // Achievements evaluation
    await checkAchievements(uId, updatedGoals, meals, updatedWorkouts);
  };

  const cancelActiveWorkout = () => {
    setActiveWorkout(null);
    setWorkoutStartTime(null);
  };

  return (
    <FitnessContext.Provider value={{
      profile, selectedDate, meals, workouts, waterMl, weightLogs, dailyGoals, streak, achievements, consistencyScore,
      setSelectedDate, loading, refreshData,
      completeOnboarding, addMeal, deleteMeal, addWater, logWeight,
      activeWorkout, startWorkout, addExerciseToActiveWorkout, addSetToActiveExercise, updateActiveSet, removeSetFromActiveExercise, finishActiveWorkout, cancelActiveWorkout,
      awardGems, levelUpTrigger, dismissLevelUp, gemRewardTrigger, dismissGemReward
    }}>
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) throw new Error('useFitness must be used within a FitnessProvider');
  return context;
};
