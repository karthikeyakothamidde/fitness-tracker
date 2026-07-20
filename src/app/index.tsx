import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { useFitness, getLevelFromGems } from '../context/FitnessContext';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing } from '../constants/theme';
import { CircularProgress } from '../components/CircularProgress';
import { 
  Flame, 
  Gem, 
  Plus, 
  Droplet, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  User 
} from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const { 
    profile, 
    selectedDate, 
    meals, 
    workouts, 
    waterMl, 
    dailyGoals, 
    streak, 
    consistencyScore, 
    addWater,
    levelUpTrigger,
    dismissLevelUp,
    gemRewardTrigger,
    dismissGemReward
  } = useFitness();
  
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  if (!profile) return null;

  // Calculate daily totals
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);
  const totalFiber = meals.reduce((sum, m) => sum + m.fiber, 0);

  const caloriesRemaining = Math.max(0, profile.calorieTarget - totalCalories);
  const calorieRatio = profile.calorieTarget > 0 ? totalCalories / profile.calorieTarget : 0;

  // Level Info
  const lvlInfo = getLevelFromGems(profile.gems);
  const nextLvlGems = lvlInfo.maxGems + 1;
  const lvlProgressRatio = profile.gems / nextLvlGems;

  // Format date header
  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  // Checklist items mapping
  const checklist = [
    { label: 'Log Breakfast', completed: dailyGoals.loggedBreakfast },
    { label: 'Log Lunch', completed: dailyGoals.loggedLunch },
    { label: 'Log Dinner', completed: dailyGoals.loggedDinner },
    { label: 'Complete Workout', completed: dailyGoals.completedWorkout },
    { label: 'Meet Protein Goal', completed: dailyGoals.metProteinGoal },
    { label: 'Meet Fiber Goal', completed: dailyGoals.metFiberGoal },
    { label: 'Drink Water', completed: dailyGoals.drankWater },
  ];

  const completedGoalsCount = checklist.filter(c => c.completed).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Good Morning,</Text>
            <Text style={[styles.nameText, { color: colors.text }]}>{profile.name} 👋</Text>
          </View>
          <View style={styles.metricsHeader}>
            <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Flame size={16} color={colors.streak} fill={colors.streak} />
              <Text style={[styles.badgeText, { color: colors.streak }]}>{streak.currentStreak}d</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(6, 182, 212, 0.08)', borderColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Gem size={15} color={colors.gems} fill={colors.gems} />
              <Text style={[styles.badgeText, { color: colors.gems }]}>{profile.gems}</Text>
            </View>
          </View>
        </View>

        {/* Floating level card */}
        <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.levelHeader}>
            <Text style={[styles.levelTitle, { color: colors.text }]}>Level {profile.level} — {lvlInfo.name}</Text>
            <Text style={[styles.levelGems, { color: colors.textSecondary }]}>{profile.gems} / {nextLvlGems} Gems</Text>
          </View>
          <View style={[styles.lvlTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.lvlBar, { width: `${lvlProgressRatio * 100}%`, backgroundColor: colors.gems }]} />
          </View>
        </View>

        {/* Large Calorie Circular Card */}
        <View style={[styles.dashboardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardHeader, { color: colors.text }]}>Calories</Text>
          <View style={styles.calorieRow}>
            <CircularProgress
              size={140}
              strokeWidth={12}
              progress={calorieRatio}
              color={colors.calories}
              backgroundColor={colors.border}
            >
              <View style={styles.circleCenter}>
                <Text style={[styles.centerRemaining, { color: colors.text }]}>{caloriesRemaining}</Text>
                <Text style={styles.centerSub}>kcal left</Text>
              </View>
            </CircularProgress>

            <View style={styles.calorieDetails}>
              <View style={styles.calorieStat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{totalCalories}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Consumed</Text>
              </View>
              <View style={[styles.dividerHorizontal, { backgroundColor: colors.border }]} />
              <View style={styles.calorieStat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{profile.calorieTarget}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Target Goal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Macros Progress Row */}
        <View style={styles.macroRow}>
          {[
            { label: 'Protein', val: totalProtein, tgt: profile.macroTargets.protein, color: colors.protein, unit: 'g' },
            { label: 'Carbs', val: totalCarbs, tgt: profile.macroTargets.carbs, color: colors.carbs, unit: 'g' },
            { label: 'Fat', val: totalFat, tgt: profile.macroTargets.fat, color: colors.fat, unit: 'g' },
            { label: 'Fiber', val: totalFiber, tgt: profile.macroTargets.fiber, color: colors.fiber, unit: 'g' },
          ].map((macro, idx) => {
            const ratio = macro.tgt > 0 ? Math.min(1, macro.val / macro.tgt) : 0;
            return (
              <View key={idx} style={[styles.macroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.macroName, { color: colors.textSecondary }]}>{macro.label}</Text>
                <Text style={[styles.macroVal, { color: colors.text }]}>
                  {macro.val}<Text style={styles.macroUnit}>{macro.unit}</Text>
                </Text>
                <View style={[styles.macroTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.macroProgress, { width: `${ratio * 100}%`, backgroundColor: macro.color }]} />
                </View>
                <Text style={[styles.macroTarget, { color: colors.textSecondary }]}>Goal: {macro.tgt}g</Text>
              </View>
            );
          })}
        </View>

        {/* Consistency Score Widget */}
        <View style={[styles.consistencyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.consistencyInfo}>
            <Text style={[styles.cardHeader, { color: colors.text, marginBottom: 4 }]}>Today's Consistency</Text>
            <Text style={[styles.consistencyDesc, { color: colors.textSecondary }]}>
              {consistencyScore >= 80 ? 'Excellent Day! Keep up this fire 🔥' : 'Log your metrics to earn bonus Gems.'}
            </Text>
            <Text style={[styles.consistencyScoreText, { color: colors.primary }]}>{consistencyScore}%</Text>
          </View>
          <View style={styles.consistencyDialContainer}>
            <CircularProgress
              size={80}
              strokeWidth={8}
              progress={consistencyScore / 100}
              color={colors.primary}
              backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* Water Intake Tracker */}
        <View style={[styles.dashboardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Droplet size={18} color={colors.water} fill={colors.water} />
              <Text style={[styles.cardHeader, { color: colors.text, marginBottom: 0 }]}>Water Intake</Text>
            </View>
            <Text style={[styles.waterTargetText, { color: colors.textSecondary }]}>
              {waterMl / 1000}L / {profile.waterTarget / 1000}L
            </Text>
          </View>
          
          <View style={styles.waterProgressRow}>
            <View style={[styles.waterProgressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.waterProgressFill, 
                  { 
                    width: `${Math.min(100, (waterMl / profile.waterTarget) * 100)}%`, 
                    backgroundColor: colors.water 
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.waterAddButtons}>
            <TouchableOpacity style={[styles.waterBtn, { borderColor: colors.border }]} onPress={() => addWater(250)}>
              <Plus size={14} color={colors.water} />
              <Text style={[styles.waterBtnText, { color: colors.text }]}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.waterBtn, { borderColor: colors.border }]} onPress={() => addWater(500)}>
              <Plus size={14} color={colors.water} />
              <Text style={[styles.waterBtnText, { color: colors.text }]}>+500ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Goals Checklist */}
        <View style={[styles.dashboardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardHeader, { color: colors.text, marginBottom: 0 }]}>Daily Checklist</Text>
            <Text style={[styles.waterTargetText, { color: colors.textSecondary }]}>
              {completedGoalsCount} / {checklist.length} Completed
            </Text>
          </View>

          <View style={styles.checklistGrid}>
            {checklist.map((item, idx) => (
              <View key={idx} style={[styles.checklistItem, { borderColor: colors.border }]}>
                {item.completed ? (
                  <CheckCircle2 size={18} color={colors.success} fill="rgba(16,185,129,0.1)" />
                ) : (
                  <Circle size={18} color={colors.textSecondary} />
                )}
                <Text style={[
                  styles.checklistLabel, 
                  { color: colors.text },
                  item.completed && { color: colors.textSecondary, textDecorationLine: 'line-through' }
                ]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricsHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  levelCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: Spacing.three,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  levelGems: {
    fontSize: 11,
    fontWeight: '600',
  },
  lvlTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  lvlBar: {
    height: '100%',
    borderRadius: 3,
  },
  dashboardCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  circleCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerRemaining: {
    fontSize: 22,
    fontWeight: '900',
  },
  centerSub: {
    fontSize: 10,
    color: '#71717A',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  calorieDetails: {
    flex: 1,
    paddingLeft: Spacing.three,
    justifyContent: 'center',
    gap: 8,
  },
  calorieStat: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  dividerHorizontal: {
    height: 1,
    width: '80%',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.three,
  },
  macroCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  macroName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  macroUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  macroTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 4,
  },
  macroProgress: {
    height: '100%',
    borderRadius: 2,
  },
  macroTarget: {
    fontSize: 10,
    fontWeight: '500',
  },
  consistencyCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    alignItems: 'center',
  },
  consistencyInfo: {
    flex: 1,
  },
  consistencyDesc: {
    fontSize: 11,
    lineHeight: 14,
    marginVertical: 4,
  },
  consistencyScoreText: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  consistencyDialContainer: {
    paddingLeft: Spacing.two,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterTargetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  waterProgressRow: {
    marginBottom: 12,
  },
  waterProgressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  waterAddButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  waterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  checklistGrid: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  checklistLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
