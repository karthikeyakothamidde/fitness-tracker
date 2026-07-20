import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal,
  useColorScheme 
} from 'react-native';
import { useFitness } from '../context/FitnessContext';
import { Colors, Spacing } from '../constants/theme';
import { 
  Play, 
  Plus, 
  Check, 
  Trash2, 
  Dumbbell, 
  Clock, 
  Calendar, 
  Trophy, 
  ChevronRight,
  Square,
  Sparkles
} from 'lucide-react-native';
import { FormattedTimer, RestTimer } from '../components/WorkoutTimer';

// Global exercise library for selection
const EXERCISE_LIBRARY = [
  { name: 'Bench Press', category: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest' },
  { name: 'Pull-Ups', category: 'Back' },
  { name: 'Barbell Row', category: 'Back' },
  { name: 'Squats', category: 'Legs' },
  { name: 'Leg Press', category: 'Legs' },
  { name: 'Overhead Press', category: 'Shoulders' },
  { name: 'Lateral Raises', category: 'Shoulders' },
  { name: 'Bicep Curls', category: 'Biceps' },
  { name: 'Tricep Pushdowns', category: 'Triceps' },
  { name: 'Plank', category: 'Abs/Core' },
  { name: 'Crunches', category: 'Abs/Core' }
];

export default function WorkoutScreen() {
  const { 
    workouts, 
    activeWorkout, 
    startWorkout, 
    addExerciseToActiveWorkout, 
    addSetToActiveExercise, 
    updateActiveSet, 
    removeSetFromActiveExercise, 
    finishActiveWorkout, 
    cancelActiveWorkout,
    selectedDate
  } = useFitness();
  
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  // Exercises Library Search modal
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rest Timer modal trigger
  const [restTimerVisible, setRestTimerVisible] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);

  const filteredExercises = EXERCISE_LIBRARY.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formats duration seconds into readable time
  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  // Workout Routines Templates
  const routines = [
    { name: 'Push Day', exercisesCount: 4, desc: 'Chest, Shoulders & Triceps focus' },
    { name: 'Pull Day', exercisesCount: 4, desc: 'Back, Biceps & Rear Delts focus' },
    { name: 'Leg Day', exercisesCount: 3, desc: 'Squats, Quads & Hamstrings focus' },
    { name: 'Custom Workout', exercisesCount: 0, desc: 'Create a routine on the fly' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* 1. VIEW ACTIVE WORKOUT SESSION (IN-PROGRESS LOGGER VIEW) */}
      {activeWorkout ? (
        <View style={styles.activeContainer}>
          {/* Active Workout Top panel header */}
          <View style={[styles.activeHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.activeTitle, { color: colors.text }]}>{activeWorkout.name}</Text>
              <View style={styles.timerRow}>
                <Clock size={14} color={colors.textSecondary} />
                <FormattedTimer startTime={Date.now() - activeWorkout.durationSeconds * 1000} />
              </View>
            </View>
            <View style={styles.activeHeaderButtons}>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.error }]} onPress={cancelActiveWorkout}>
                <Square size={14} color="#F8FAFC" fill="#F8FAFC" />
                <Text style={styles.controlText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.success }]} onPress={finishActiveWorkout}>
                <Check size={14} color="#09090B" />
                <Text style={[styles.controlText, { color: '#09090B' }]}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active exercises list */}
          <ScrollView style={styles.activeExercisesScroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {activeWorkout.exercises.map((ex, exIdx) => (
              <View key={ex.id} style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.exerciseCardHeader}>
                  <View>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.name}</Text>
                    <Text style={[styles.exerciseCat, { color: colors.textSecondary }]}>{ex.category}</Text>
                  </View>
                  <TouchableOpacity style={[styles.addSetBtn, { borderColor: colors.border }]} onPress={() => addSetToActiveExercise(exIdx)}>
                    <Plus size={12} color={colors.primary} />
                    <Text style={[styles.addSetText, { color: colors.text }]}>Add Set</Text>
                  </TouchableOpacity>
                </View>

                {/* Sets Column Header */}
                <View style={styles.setsTableHeader}>
                  <Text style={[styles.colHeader, { flex: 0.5 }]}>Set</Text>
                  <Text style={[styles.colHeader, { flex: 1 }]}>Weight (kg)</Text>
                  <Text style={[styles.colHeader, { flex: 1 }]}>Reps</Text>
                  <Text style={[styles.colHeader, { flex: 0.5 }]}>Done</Text>
                </View>

                {/* Exercise Sets Rows */}
                {ex.sets.map((set, setIdx) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={[styles.setNumLabel, { flex: 0.5, color: colors.textSecondary }]}>{setIdx + 1}</Text>
                    
                    <TextInput
                      style={[styles.setInput, { flex: 1, color: colors.text, borderColor: colors.border }, set.completed && { opacity: 0.5 }]}
                      keyboardType="decimal-pad"
                      value={set.weightKg.toString()}
                      onChangeText={(val) => updateActiveSet(exIdx, setIdx, { weightKg: parseFloat(val) || 0 })}
                      editable={!set.completed}
                    />

                    <TextInput
                      style={[styles.setInput, { flex: 1, color: colors.text, borderColor: colors.border }, set.completed && { opacity: 0.5 }]}
                      keyboardType="number-pad"
                      value={set.reps.toString()}
                      onChangeText={(val) => updateActiveSet(exIdx, setIdx, { reps: parseInt(val) || 0 })}
                      editable={!set.completed}
                    />

                    {/* Completion checkbox check */}
                    <TouchableOpacity 
                      style={[
                        styles.checkSetBtn, 
                        { flex: 0.5, borderColor: colors.border },
                        set.completed && { backgroundColor: colors.success, borderColor: colors.success }
                      ]} 
                      onPress={() => {
                        const newCompleted = !set.completed;
                        updateActiveSet(exIdx, setIdx, { completed: newCompleted });
                        if (newCompleted) {
                          // Show rest timer countdown!
                          setRestSeconds(60);
                          setRestTimerVisible(true);
                        }
                      }}
                    >
                      {set.completed && <Check size={12} color="#09090B" />}
                    </TouchableOpacity>

                    {/* Delete set */}
                    {ex.sets.length > 1 && (
                      <TouchableOpacity onPress={() => removeSetFromActiveExercise(exIdx, setIdx)} style={styles.deleteSetBtn}>
                        <Trash2 size={14} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ))}

            {/* Add Exercise Trigger Button */}
            <TouchableOpacity 
              style={[styles.addExBtn, { borderColor: colors.primary }]}
              onPress={() => setExerciseModalVisible(true)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.addExBtnText, { color: colors.primary }]}>Add Exercise to Workout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        
        // 2. IDLE ROUTINE SELECTOR & WORKOUT HISTORY VIEW
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.title, { color: colors.text }]}>Train Smarter</Text>
            <View style={styles.dateSelector}>
              <Calendar size={15} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>{selectedDate}</Text>
            </View>
          </View>

          {/* Quick routine templates start buttons */}
          <Text style={[styles.blockHeader, { color: colors.text }]}>Start a Routine</Text>
          <View style={styles.routinesContainer}>
            {routines.map((item, idx) => (
              <View key={idx} style={[styles.routineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.routineInfo}>
                  <Text style={[styles.routineTitle, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.routineDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.startPlayBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    startWorkout(item.name);
                    // Prepopulate template exercises if it's template
                    if (item.name === 'Push Day') {
                      setTimeout(() => {
                        addExerciseToActiveWorkout('Bench Press', 'Chest');
                        addExerciseToActiveWorkout('Overhead Press', 'Shoulders');
                        addExerciseToActiveWorkout('Tricep Pushdowns', 'Triceps');
                      }, 50);
                    } else if (item.name === 'Pull Day') {
                      setTimeout(() => {
                        addExerciseToActiveWorkout('Pull-Ups', 'Back');
                        addExerciseToActiveWorkout('Barbell Row', 'Back');
                        addExerciseToActiveWorkout('Bicep Curls', 'Biceps');
                      }, 50);
                    } else if (item.name === 'Leg Day') {
                      setTimeout(() => {
                        addExerciseToActiveWorkout('Squats', 'Legs');
                        addExerciseToActiveWorkout('Leg Press', 'Legs');
                      }, 50);
                    }
                  }}
                >
                  <Play size={16} color="#09090B" fill="#09090B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Today's Completed Workouts Summary History */}
          <Text style={[styles.blockHeader, { color: colors.text, marginTop: Spacing.four }]}>Today's Session Logs</Text>
          {workouts.length > 0 ? (
            <View style={styles.historyContainer}>
              {workouts.map((w) => (
                <View key={w.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.historyTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Dumbbell size={16} color={colors.primary} />
                      <Text style={[styles.historyTitle, { color: colors.text }]}>{w.name}</Text>
                    </View>
                    <Text style={[styles.historyDuration, { color: colors.textSecondary }]}>
                      {formatSeconds(w.durationSeconds)}
                    </Text>
                  </View>

                  <View style={styles.historyDetailsRow}>
                    <View style={styles.historyStat}>
                      <Text style={[styles.histStatVal, { color: colors.text }]}>{w.exercises.length}</Text>
                      <Text style={[styles.histStatLbl, { color: colors.textSecondary }]}>Exercises</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Text style={[styles.histStatVal, { color: colors.text }]}>{w.totalSets}</Text>
                      <Text style={[styles.histStatLbl, { color: colors.textSecondary }]}>Total Sets</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Text style={[styles.histStatVal, { color: colors.text }]}>{w.totalVolume} kg</Text>
                      <Text style={[styles.histStatLbl, { color: colors.textSecondary }]}>Volume</Text>
                    </View>
                  </View>

                  {/* Exercises detail collapse */}
                  <View style={[styles.historyExList, { borderTopColor: colors.border }]}>
                    {w.exercises.map((ex, idx) => (
                      <Text key={idx} style={[styles.histExRow, { color: colors.textSecondary }]}>
                        • {ex.name}: {ex.sets.filter(s => s.completed).length} sets ({ex.sets.map(s => `${s.weightKg}kg × ${s.reps}`).join(', ')})
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyHistoryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Dumbbell size={28} color={colors.textSecondary} strokeWidth={1} />
              <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>
                No workouts completed today. Press play to start.
              </Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* =======================================================
          EXERCISES DATABASE LIBRARY MODAL DIALOGUE
          ======================================================= */}
      <Modal visible={exerciseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Exercise</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Search our global exercises list</Text>
              </View>
              <TouchableOpacity 
                style={[styles.closeBtn, { backgroundColor: colors.border }]} 
                onPress={() => setExerciseModalVisible(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBar, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search exercise (e.g. Squat, Bench...)"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={{ flex: 1 }}>
              {filteredExercises.map((ex, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.foodResultRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    addExerciseToActiveWorkout(ex.name, ex.category);
                    setExerciseModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <View>
                    <Text style={[styles.resultName, { color: colors.text }]}>{ex.name}</Text>
                    <Text style={[styles.resultMacros, { color: colors.textSecondary }]}>{ex.category}</Text>
                  </View>
                  <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =======================================================
          REST TIMER COUNTDOWN DISPLAY MODAL
          ======================================================= */}
      <RestTimer 
        visible={restTimerVisible} 
        initialSeconds={restSeconds} 
        onClose={() => setRestTimerVisible(false)} 
      />

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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  blockHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  routinesContainer: {
    gap: Spacing.two,
  },
  routineCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routineInfo: {
    flex: 1,
    marginRight: Spacing.two,
  },
  routineTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  routineDesc: {
    fontSize: 11,
    marginTop: 4,
  },
  startPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContainer: {
    gap: Spacing.three,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyDuration: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: Spacing.one,
  },
  historyStat: {
    alignItems: 'center',
  },
  histStatVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  histStatLbl: {
    fontSize: 10,
    marginTop: 2,
  },
  historyExList: {
    borderTopWidth: 1,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    gap: 4,
  },
  histExRow: {
    fontSize: 11,
    lineHeight: 14,
  },
  emptyHistoryBox: {
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Active in-progress logging sheet
  activeContainer: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    padding: Spacing.three,
    paddingTop: 16,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  activeHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  controlText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
  },
  activeExercisesScroll: {
    flex: 1,
    padding: Spacing.three,
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '800',
  },
  exerciseCat: {
    fontSize: 11,
    marginTop: 2,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  addSetText: {
    fontSize: 10,
    fontWeight: '700',
  },
  setsTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
  },
  colHeader: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
    gap: 8,
  },
  setNumLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  setInput: {
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  checkSetBtn: {
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSetBtn: {
    padding: 6,
  },
  addExBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 40,
  },
  addExBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  
  // Modals Shared styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: Spacing.three,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.01)',
    marginBottom: Spacing.two,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  foodResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultName: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultMacros: {
    fontSize: 11,
    marginTop: 2,
  },
});
