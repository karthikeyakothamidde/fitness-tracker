import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  useColorScheme 
} from 'react-native';
import { useFitness, getLevelFromGems } from '../context/FitnessContext';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing } from '../constants/theme';
import { CustomChart } from '../components/CustomChart';
import { 
  Award, 
  TrendingUp, 
  Scale, 
  LogOut, 
  Edit2, 
  ChevronRight, 
  Lock, 
  Sparkles,
  Flame,
  Gem,
  Check,
  Plus
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { 
    profile, 
    achievements, 
    weightLogs, 
    logWeight, 
    streak,
    completeOnboarding // Used to re-save targets
  } = useFitness();
  
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  const [weightInput, setWeightInput] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');

  if (!profile) return null;

  // Level details
  const lvlInfo = getLevelFromGems(profile.gems);
  const nextLvlGems = lvlInfo.maxGems + 1;

  // Save logged weight
  const handleLogWeightSubmit = async () => {
    const wt = parseFloat(weightInput);
    if (wt > 20 && wt < 300) {
      await logWeight(wt);
      setWeightInput('');
      setIsLoggingWeight(false);
    }
  };

  // Compile weight chart data
  const compileWeightData = () => {
    // Standard mock trends if logs are too short to render a nice chart
    if (weightLogs.length < 2) {
      const mockWeights = [76.5, 76.1, 75.8, 75.4, 75.2, 74.9, profile.currentWeight];
      const mockLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
      return { data: mockWeights, labels: mockLabels };
    }

    // Filter by selected range
    const limit = chartRange === '7d' ? 7 : 30;
    const recentLogs = weightLogs.slice(-limit);
    
    const data = recentLogs.map(l => l.weightKg);
    const labels = recentLogs.map((l, idx) => {
      // Return simple label formatting
      const date = new Date(l.date);
      if (chartRange === '7d') {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    });

    return { data, labels };
  };

  const chartData = compileWeightData();

  // Helper to format goal text
  const formatGoal = (goalStr: string) => {
    switch(goalStr) {
      case 'fat_loss': return 'Lose Body Fat ✂️';
      case 'muscle_gain': return 'Build Lean Muscle 🏋️';
      case 'maintenance': return 'Weight Maintenance ⚖️';
      default: return 'Improve General Fitness ⚡';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Summary */}
        <View style={[styles.profileHeaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileAvatarRow}>
            <View style={[styles.avatarBox, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: colors.border }]}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.profileUserText}>
              <Text style={[styles.nameText, { color: colors.text }]}>{profile.name}</Text>
              <Text style={[styles.goalText, { color: colors.primary }]}>{formatGoal(profile.goal)}</Text>
            </View>
          </View>

          {/* Mini Stats Summary Row */}
          <View style={[styles.miniStatsRow, { borderTopColor: colors.border }]}>
            <View style={styles.miniStat}>
              <Text style={[styles.miniVal, { color: colors.text }]}>{profile.height} cm</Text>
              <Text style={[styles.miniLbl, { color: colors.textSecondary }]}>Height</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniVal, { color: colors.text }]}>{profile.currentWeight} kg</Text>
              <Text style={[styles.miniLbl, { color: colors.textSecondary }]}>Weight</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniVal, { color: colors.text }]}>{profile.targetWeight} kg</Text>
              <Text style={[styles.miniLbl, { color: colors.textSecondary }]}>Target</Text>
            </View>
          </View>
        </View>

        {/* Weight Tracker Section with SVG Chart */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Scale size={18} color={colors.primary} />
              <Text style={[styles.cardHeader, { color: colors.text }]}>Weight Progress</Text>
            </View>
            
            {/* Chart toggle range buttons */}
            <View style={styles.chartRangeRow}>
              {(['7d', '30d'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.rangeBtn,
                    { borderColor: colors.border },
                    chartRange === r && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setChartRange(r)}
                >
                  <Text style={[styles.rangeBtnText, { color: colors.text }, chartRange === r && { color: '#09090B', fontWeight: '800' }]}>
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dynamic line chart */}
          <CustomChart data={chartData.data} labels={chartData.labels} color={colors.primary} />

          {/* Quick weight logger */}
          {isLoggingWeight ? (
            <View style={styles.weightInputRow}>
              <TextInput
                style={[styles.weightInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="decimal-pad"
                placeholder="Weight in kg (e.g. 74.5)"
                placeholderTextColor={colors.textSecondary}
                value={weightInput}
                onChangeText={setWeightInput}
                autoFocus
              />
              <TouchableOpacity style={[styles.submitWeightBtn, { backgroundColor: colors.primary }]} onPress={handleLogWeightSubmit}>
                <Check size={16} color="#09090B" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitWeightBtn, { backgroundColor: '#27272A' }]} onPress={() => setIsLoggingWeight(false)}>
                <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>X</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.logWeightBtn, { borderColor: colors.primary }]} onPress={() => setIsLoggingWeight(true)}>
              <Plus size={14} color={colors.primary} />
              <Text style={[styles.logWeightBtnText, { color: colors.primary }]}>Log Current Bodyweight</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Achievements checklist */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Award size={18} color={colors.gems} />
            <Text style={[styles.cardHeader, { color: colors.text, marginBottom: 0 }]}>Earned Achievements</Text>
          </View>

          <View style={styles.achievementsList}>
            {achievements.map((ach) => (
              <View 
                key={ach.id} 
                style={[
                  styles.achievementItem, 
                  { borderColor: colors.border },
                  ach.unlocked && { backgroundColor: 'rgba(34, 211, 238, 0.02)', borderColor: 'rgba(34, 211, 238, 0.15)' }
                ]}
              >
                <View style={[styles.badgeIconBox, { backgroundColor: ach.unlocked ? 'rgba(34, 211, 238, 0.08)' : 'rgba(255,255,255,0.01)' }]}>
                  <Text style={[styles.badgeEmoji, !ach.unlocked && { opacity: 0.3 }]}>
                    {ach.badge}
                  </Text>
                </View>
                <View style={styles.achInfo}>
                  <View style={styles.achTitleRow}>
                    <Text style={[styles.achTitle, { color: colors.text }, !ach.unlocked && { color: colors.textSecondary }]}>
                      {ach.title}
                    </Text>
                    {ach.unlocked && (
                      <View style={[styles.unlockedTag, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                        <Text style={[styles.unlockedTagText, { color: colors.success }]}>Unlocked</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.achDesc, { color: colors.textSecondary }]}>{ach.description}</Text>
                  
                  {/* Progress tracker bar */}
                  {!ach.unlocked && (
                    <View style={styles.achProgressRow}>
                      <View style={[styles.achTrack, { backgroundColor: colors.border }]}>
                        <View 
                          style={[
                            styles.achProgressBar, 
                            { 
                              width: `${Math.min(100, (ach.currentValue / ach.targetValue) * 100)}%`, 
                              backgroundColor: colors.gems 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.achProgressText, { color: colors.textSecondary }]}>
                        {ach.currentValue} / {ach.targetValue}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={[styles.achRewardText, { color: colors.gems }]}>+{ach.gemReward} Gems 💎</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Global Settings & Utilities Actions */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.settingText, { color: colors.text }]}>Workout Preferences</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.settingText, { color: colors.text }]}>Custom Calorie Goals</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.settingText, { color: colors.text }]}>Export Fitness Logs (JSON)</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow} onPress={signOut}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LogOut size={16} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error, fontWeight: '700' }]}>Sign Out</Text>
            </View>
            <ChevronRight size={16} color={colors.error} />
          </TouchableOpacity>
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
  profileHeaderCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  profileUserText: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '900',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
  },
  miniStat: {
    alignItems: 'center',
    flex: 1,
  },
  miniVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  miniLbl: {
    fontSize: 10,
    marginTop: 2,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
  },
  chartRangeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rangeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rangeBtnText: {
    fontSize: 9,
    fontWeight: '700',
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 38,
    gap: 6,
    marginTop: Spacing.two,
  },
  logWeightBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  weightInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.two,
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  submitWeightBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementsList: {
    gap: Spacing.two,
  },
  achievementItem: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    alignItems: 'center',
  },
  badgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 20,
  },
  achInfo: {
    flex: 1,
  },
  achTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'space-between',
  },
  achTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  unlockedTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  unlockedTagText: {
    fontSize: 8,
    fontWeight: '800',
  },
  achDesc: {
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
  achProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  achTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  achProgressText: {
    fontSize: 9,
    fontWeight: '700',
  },
  achRewardText: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
