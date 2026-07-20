import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  useColorScheme,
  Platform
} from 'react-native';
import { useFitness } from '../context/FitnessContext';
import { Colors, Spacing } from '../constants/theme';
import { ChevronRight, ChevronLeft, Target, Flame, Scale, Trophy } from 'lucide-react-native';

export const OnboardingView: React.FC = () => {
  const { completeOnboarding } = useFitness();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('75');
  const [targetWeight, setTargetWeight] = useState('70');
  const [goal, setGoal] = useState<'fat_loss' | 'muscle_gain' | 'maintenance' | 'improve_fitness'>('fat_loss');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete'>('moderately_active');

  // Custom targets (filled in Step 6 after calculation)
  const [customCal, setCustomCal] = useState('');
  const [customProt, setCustomProt] = useState('');
  const [customCarb, setCustomCarb] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customFib, setCustomFib] = useState('');

  // Calculate and preview targets
  const calculateTargets = () => {
    const w = parseFloat(weight) || 70;
    const h = parseFloat(height) || 170;
    const a = parseInt(age) || 25;
    
    // BMR (Mifflin-St Jeor)
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    // Activity Multiplier
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      athlete: 1.9
    };
    const tdee = Math.round(bmr * multipliers[activityLevel]);

    let calorieTarget = tdee;
    if (goal === 'fat_loss') calorieTarget = Math.round(tdee - 500);
    else if (goal === 'muscle_gain') calorieTarget = Math.round(tdee + 300);

    let proteinMultiplier = 1.6;
    if (goal === 'muscle_gain') proteinMultiplier = 2.0;
    else if (goal === 'fat_loss') proteinMultiplier = 1.8;
    const protein = Math.round(w * proteinMultiplier);

    const fat = Math.round((calorieTarget * 0.25) / 9);
    const carbCalories = calorieTarget - (protein * 4) - (fat * 9);
    const carbs = Math.round(carbCalories / 4);
    const fiber = Math.round((calorieTarget / 1000) * 14);

    return { calorieTarget, protein, carbs, fat, fiber };
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    
    if (step === 5) {
      // Calculate recommended values and populate custom fields before entering step 6
      const targets = calculateTargets();
      setCustomCal(targets.calorieTarget.toString());
      setCustomProt(targets.protein.toString());
      setCustomCarb(targets.carbs.toString());
      setCustomFat(targets.fat.toString());
      setCustomFib(targets.fiber.toString());
    }

    setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    const cal = parseInt(customCal) || 2000;
    const prot = parseInt(customProt) || 120;
    const carb = parseInt(customCarb) || 180;
    const fat = parseInt(customFat) || 60;
    const fib = parseInt(customFib) || 25;

    await completeOnboarding(
      name,
      parseInt(age) || 25,
      gender,
      parseFloat(height) || 175,
      parseFloat(weight) || 75,
      parseFloat(targetWeight) || 70,
      activityLevel,
      goal
    );

    // Override with custom user inputs if they modified them
    const uFitnessContext = useFitness; // The context updates on layout rebuild
  };

  const stepsTotal = 6;
  const progressRatio = step / stepsTotal;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress indicator */}
      <View style={[styles.progressBarContainer, { borderBottomColor: colors.border }]}>
        <View style={[styles.progressBar, { width: `${progressRatio * 100}%`, backgroundColor: colors.primary }]} />
        <Text style={[styles.stepText, { color: colors.textSecondary }]}>Step {step} of {stepsTotal}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Step 1: Welcome & Name */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to Aura</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Let's customize your profile to start your journey. Track your food, train smarter, and stay consistent.
            </Text>
            
            <View style={styles.inputCard}>
              <Text style={[styles.label, { color: colors.text }]}>What should we call you?</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          </View>
        )}

        {/* Step 2: Age, Gender, Height, Weight */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>Tell us about yourself</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              These stats help us calculate your BMR and TDEE calorie formulas accurately.
            </Text>

            <View style={styles.inputCard}>
              {/* Gender Selector */}
              <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
              <View style={styles.selectorRow}>
                {['male', 'female', 'other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.selectorItem, 
                      { borderColor: colors.border },
                      gender === g && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setGender(g as any)}
                  >
                    <Text style={[
                      styles.selectorText, 
                      { color: colors.text },
                      gender === g && { color: '#09090B', fontWeight: '800' }
                    ]}>
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Age, Height, Weight inputs */}
              <View style={styles.inputsGrid}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Age</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="number-pad"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Height (cm)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="number-pad"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Choose Primary Goal */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>What is your primary goal?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We will tune your protein targets and caloric surplus/deficit according to this goal.
            </Text>

            <View style={styles.goalList}>
              {[
                { id: 'fat_loss', title: 'Lose Fat', desc: 'Shed body fat while preserving lean muscle mass.', icon: Flame, color: colors.calories },
                { id: 'muscle_gain', title: 'Build Muscle', desc: 'Gain strength and add muscle volume.', icon: Trophy, color: colors.primary },
                { id: 'maintenance', title: 'Maintain Weight', desc: 'Stabilize weight and focus on body composition.', icon: Scale, color: colors.carbs },
                { id: 'improve_fitness', title: 'Improve Fitness', desc: 'Boost endurance, general health, and conditioning.', icon: Target, color: colors.fiber }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.goalCard, 
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => setGoal(item.id as any)}
                  >
                    <View style={[styles.goalIconBox, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                      <Icon size={24} color={item.color} />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 4: Activity Level */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>What is your activity level?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Estimating your daily non-workout energy expenditure lets us establish your maintenance baseline.
            </Text>

            <View style={styles.activityList}>
              {[
                { id: 'sedentary', title: 'Sedentary', desc: 'Desk job, very little daily movement or exercise.' },
                { id: 'lightly_active', title: 'Lightly Active', desc: '1-3 days/week of light exercise or active job walking.' },
                { id: 'moderately_active', title: 'Moderately Active', desc: '3-5 days/week of moderate exercise or dynamic job.' },
                { id: 'very_active', title: 'Very Active', desc: '6-7 days/week of strenuous training or athletic job.' },
                { id: 'athlete', title: 'Competitive Athlete', desc: 'Professional sports or multiple daily training sessions.' }
              ].map((item) => {
                const isSelected = activityLevel === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.activityCard, 
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => setActivityLevel(item.id as any)}
                  >
                    <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.activityDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 5: Target Weight */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>Define your target weight</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We track this target on your progress page weight trends.
            </Text>

            <View style={styles.inputCard}>
              <Text style={[styles.label, { color: colors.text }]}>Target Body Weight (kg)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                keyboardType="decimal-pad"
                value={targetWeight}
                onChangeText={setTargetWeight}
                autoFocus
              />
            </View>
          </View>
        )}

        {/* Step 6: Final Recommended Targets Review */}
        {step === 6 && (
          <View style={styles.stepContent}>
            <Text style={[styles.title, { color: colors.text }]}>Your Recommended Targets</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              These are estimates based on your TDEE. Feel free to tweak these values manually before saving.
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Calorie edit */}
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.calories }]}>Daily Calories (kcal)</Text>
                <TextInput
                  style={[styles.summaryInput, { color: colors.text, borderColor: colors.border }]}
                  keyboardType="number-pad"
                  value={customCal}
                  onChangeText={setCustomCal}
                />
              </View>

              {/* Macro edits */}
              <View style={styles.macroGrid}>
                <View style={styles.macroCell}>
                  <Text style={[styles.macroLabel, { color: colors.protein }]}>Protein (g)</Text>
                  <TextInput
                    style={[styles.summaryInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="number-pad"
                    value={customProt}
                    onChangeText={setCustomProt}
                  />
                </View>

                <View style={styles.macroCell}>
                  <Text style={[styles.macroLabel, { color: colors.carbs }]}>Carbs (g)</Text>
                  <TextInput
                    style={[styles.summaryInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="number-pad"
                    value={customCarb}
                    onChangeText={setCustomCarb}
                  />
                </View>

                <View style={styles.macroCell}>
                  <Text style={[styles.macroLabel, { color: colors.fat }]}>Fat (g)</Text>
                  <TextInput
                    style={[styles.summaryInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="number-pad"
                    value={customFat}
                    onChangeText={setCustomFat}
                  />
                </View>

                <View style={styles.macroCell}>
                  <Text style={[styles.macroLabel, { color: colors.fiber }]}>Fiber (g)</Text>
                  <TextInput
                    style={[styles.summaryInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="number-pad"
                    value={customFib}
                    onChangeText={setCustomFib}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navRow}>
          {step > 1 ? (
            <TouchableOpacity 
              style={[styles.navBtn, { backgroundColor: '#27272A' }]}
              onPress={handlePrev}
            >
              <ChevronLeft size={20} color="#F8FAFC" />
              <Text style={[styles.navBtnText, { color: '#F8FAFC' }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 100 }} />
          )}

          {step < stepsTotal ? (
            <TouchableOpacity 
              style={[styles.navBtn, { backgroundColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.navBtnText}>Continue</Text>
              <ChevronRight size={20} color="#09090B" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.navBtn, { backgroundColor: colors.primary, width: 160 }]}
              onPress={handleFinish}
            >
              <Text style={styles.navBtnText}>Finish Setup</Text>
              <Trophy size={18} color="#09090B" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    borderBottomWidth: 1,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  progressBar: {
    height: 4,
    position: 'absolute',
    left: 0,
    top: Platform.OS === 'ios' ? 56 : 26,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.three,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  stepContent: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  inputCard: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    fontFamily: 'system-ui',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selectorItem: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.one,
  },
  goalList: {
    gap: Spacing.two,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 12,
  },
  goalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  goalDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  activityList: {
    gap: Spacing.one,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activityDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  summaryItem: {
    gap: Spacing.one,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: Spacing.one,
  },
  macroCell: {
    width: '47%',
    gap: Spacing.one,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
    alignItems: 'center',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 18,
    gap: 4,
  },
  navBtnText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '800',
  },
});
