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
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  Calendar, 
  Sparkles,
  ChevronLeft
} from 'lucide-react-native';
import { FoodItem, MealCategory } from '../types';

// Pre-seeded Food Database for manual search
interface DBFood {
  name: string;
  defaultQty: number;
  unit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}

const FOOD_DATABASE: DBFood[] = [
  { name: 'Chicken Breast (cooked)', defaultQty: 100, unit: 'g', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0 },
  { name: 'White Rice (cooked)', defaultQty: 150, unit: 'g', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4 },
  { name: 'Brown Rice (cooked)', defaultQty: 150, unit: 'g', caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9, fiberPer100g: 1.8 },
  { name: 'Rolled Oats (raw)', defaultQty: 50, unit: 'g', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9, fiberPer100g: 10.6 },
  { name: 'Banana', defaultQty: 1, unit: 'pcs', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 22.8, fatPer100g: 0.3, fiberPer100g: 2.6 }, // 1 Banana approx 100g
  { name: 'Whole Egg (boiled)', defaultQty: 2, unit: 'pcs', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, fiberPer100g: 0 }, // 1 Egg approx 50g
  { name: 'Avocado', defaultQty: 50, unit: 'g', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 14.7, fiberPer100g: 6.7 },
  { name: 'Whey Protein Powder', defaultQty: 30, unit: 'g', caloriesPer100g: 380, proteinPer100g: 80, carbsPer100g: 6.6, fatPer100g: 4.5, fiberPer100g: 0 },
  { name: 'Peanut Butter', defaultQty: 15, unit: 'g', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, fiberPer100g: 6 },
  { name: 'Salmon (baked)', defaultQty: 120, unit: 'g', caloriesPer100g: 206, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 12, fiberPer100g: 0 },
  { name: 'Sweet Potato (baked)', defaultQty: 150, unit: 'g', caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 20.7, fatPer100g: 0.2, fiberPer100g: 3.3 },
  { name: 'Almonds', defaultQty: 28, unit: 'g', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 49.9, fiberPer100g: 12.5 },
  { name: 'Greek Yogurt (0%)', defaultQty: 150, unit: 'g', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0, fiberPer100g: 0 }
];

export default function NutritionScreen() {
  const { meals, addMeal, deleteMeal, selectedDate } = useFitness();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  // Manual Food Search Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('Breakfast');
  
  // Custom meal builder state
  const [activeFood, setActiveFood] = useState<DBFood | null>(null);
  const [quantityInput, setQuantityInput] = useState('100');
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [customProt, setCustomProt] = useState('');
  const [customCarb, setCustomCarb] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customFib, setCustomFib] = useState('');
  
  const [mealCreatorVisible, setMealCreatorVisible] = useState(false);
  const [addedFoods, setAddedFoods] = useState<FoodItem[]>([]);
  const [mealNameInput, setMealNameInput] = useState('');

  // Search Results filtering
  const filteredFoods = FOOD_DATABASE.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categories helper
  const categories: { name: MealCategory; icon: string }[] = [
    { name: 'Breakfast', icon: '🌅' },
    { name: 'Lunch', icon: '🍱' },
    { name: 'Pre-Workout', icon: '⚡' },
    { name: 'Post-Workout', icon: '💪' },
    { name: 'Dinner', icon: '🌙' },
    { name: 'Snack', icon: '🍎' }
  ];

  // Open food detail setup
  const selectFood = (food: DBFood) => {
    setActiveFood(food);
    setQuantityInput(food.defaultQty.toString());
  };

  // Add search food to active meal draft list
  const addFoodToMealDraft = () => {
    if (!activeFood) return;
    
    const qty = parseFloat(quantityInput) || 100;
    const factor = qty / 100;
    
    const item: FoodItem = {
      name: activeFood.name,
      quantity: qty,
      unit: activeFood.unit,
      calories: Math.round(activeFood.caloriesPer100g * factor),
      protein: Math.round(activeFood.proteinPer100g * factor),
      carbs: Math.round(activeFood.carbsPer100g * factor),
      fat: Math.round(activeFood.fatPer100g * factor),
      fiber: Math.round(activeFood.fiberPer100g * factor)
    };

    setAddedFoods([...addedFoods, item]);
    setActiveFood(null);
    setSearchQuery('');
  };

  // Add custom typed food to active meal draft list
  const addCustomFoodToMealDraft = () => {
    if (!customName.trim()) return;

    const item: FoodItem = {
      name: customName,
      quantity: parseFloat(quantityInput) || 1,
      unit: 'servings',
      calories: Math.round(parseFloat(customCal) || 0),
      protein: Math.round(parseFloat(customProt) || 0),
      carbs: Math.round(parseFloat(customCarb) || 0),
      fat: Math.round(parseFloat(customFat) || 0),
      fiber: Math.round(parseFloat(customFib) || 0)
    };

    setAddedFoods([...addedFoods, item]);
    // Clear custom form
    setCustomName('');
    setCustomCal('');
    setCustomProt('');
    setCustomCarb('');
    setCustomFat('');
    setCustomFib('');
  };

  // Save the complete drafted meal
  const saveCompleteMeal = async () => {
    if (addedFoods.length === 0) return;
    
    const finalMealName = mealNameInput.trim() || `${selectedCategory} Meal`;
    await addMeal(selectedCategory, finalMealName, addedFoods, null);
    
    // Reset state & close modal
    setAddedFoods([]);
    setMealNameInput('');
    setModalVisible(false);
  };

  // Group current logged meals by category
  const mealsByCategory = (cat: MealCategory) => {
    return meals.filter(m => m.category === cat);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Date / Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.title, { color: colors.text }]}>Nutrition Diary</Text>
          <View style={styles.dateSelector}>
            <Calendar size={15} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{selectedDate}</Text>
          </View>
        </View>

        {/* Meal Category Logs */}
        <View style={styles.categoriesContainer}>
          {categories.map((cat, idx) => {
            const catMeals = mealsByCategory(cat.name);
            const totalCatCals = catMeals.reduce((sum, m) => sum + m.calories, 0);
            const totalCatProt = catMeals.reduce((sum, m) => sum + m.protein, 0);

            return (
              <View key={idx} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header */}
                <View style={styles.categoryCardHeader}>
                  <View style={styles.categoryNameBox}>
                    <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                    <Text style={[styles.categoryTitle, { color: colors.text }]}>{cat.name}</Text>
                  </View>
                  <View style={styles.categorySummary}>
                    {totalCatCals > 0 && (
                      <Text style={[styles.catSummaryText, { color: colors.textSecondary }]}>
                        {totalCatCals} kcal  •  {totalCatProt}g protein
                      </Text>
                    )}
                    <TouchableOpacity 
                      style={[styles.addFoodBtn, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: colors.border }]}
                      onPress={() => {
                        setSelectedCategory(cat.name);
                        setModalVisible(true);
                      }}
                    >
                      <Plus size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Logged Meals List under category */}
                {catMeals.length > 0 ? (
                  <View style={[styles.loggedMealsList, { borderTopColor: colors.border }]}>
                    {catMeals.map((meal) => (
                      <View key={meal.id} style={styles.loggedMealRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mealNameText, { color: colors.text }]}>{meal.name}</Text>
                          <Text style={[styles.mealFoodsText, { color: colors.textSecondary }]}>
                            {meal.foods.map(f => `${f.name} (${f.quantity}${f.unit})`).join(', ')}
                          </Text>
                        </View>
                        <View style={styles.mealActionCol}>
                          <Text style={[styles.mealCalText, { color: colors.text }]}>{meal.calories} kcal</Text>
                          <TouchableOpacity onPress={() => deleteMeal(meal.id)}>
                            <Trash2 size={15} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyCategoryText, { color: colors.textSecondary }]}>
                    No food logged for {cat.name.toLowerCase()} yet.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* =======================================================
          MANUAL FOOD ADDER MODAL WIZARD
          ======================================================= */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Food to {selectedCategory}</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Select from database or input custom details</Text>
              </View>
              <TouchableOpacity 
                style={[styles.closeBtn, { backgroundColor: colors.border }]} 
                onPress={() => {
                  setModalVisible(false);
                  setAddedFoods([]);
                  setMealNameInput('');
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* DRAFT MEAL OVERVIEW (Shown if foods are added to the list) */}
            {addedFoods.length > 0 && (
              <View style={[styles.draftCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.draftHeader}>
                  <Text style={[styles.draftTitle, { color: colors.text }]}>Current Meal Draft</Text>
                  <Text style={[styles.draftTotals, { color: colors.primary }]}>
                    {addedFoods.reduce((acc, f) => acc + f.calories, 0)} kcal
                  </Text>
                </View>
                <ScrollView style={{ maxHeight: 80 }} nestedScrollEnabled>
                  {addedFoods.map((f, idx) => (
                    <View key={idx} style={styles.draftFoodRow}>
                      <Text style={[styles.draftFoodName, { color: colors.text }]} numberOfLines={1}>
                        {f.name} ({f.quantity}{f.unit})
                      </Text>
                      <TouchableOpacity onPress={() => setAddedFoods(addedFoods.filter((_, i) => i !== idx))}>
                        <Trash2 size={13} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                
                <View style={styles.mealNameInputContainer}>
                  <TextInput
                    style={[styles.modalSearchInput, { color: colors.text, borderColor: colors.border, height: 38 }]}
                    placeholder="Give this meal a name (e.g. Oatmeal Bowl)"
                    placeholderTextColor={colors.textSecondary}
                    value={mealNameInput}
                    onChangeText={setMealNameInput}
                  />
                  <TouchableOpacity style={[styles.saveMealBtn, { backgroundColor: colors.primary }]} onPress={saveCompleteMeal}>
                    <Text style={styles.saveMealBtnText}>Log Meal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SEARCH DATABASE FORM */}
            {!activeFood && (
              <View style={{ flex: 1 }}>
                <View style={[styles.searchBar, { borderColor: colors.border }]}>
                  <Search size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search foods (e.g. Chicken, Oats...)"
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {searchQuery.length > 0 ? (
                  <ScrollView style={styles.searchResults} nestedScrollEnabled>
                    {filteredFoods.length > 0 ? (
                      filteredFoods.map((food, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.foodResultRow, { borderBottomColor: colors.border }]} 
                          onPress={() => selectFood(food)}
                        >
                          <View>
                            <Text style={[styles.resultName, { color: colors.text }]}>{food.name}</Text>
                            <Text style={[styles.resultMacros, { color: colors.textSecondary }]}>
                              {food.caloriesPer100g} kcal / 100g  •  P: {food.proteinPer100g}g  •  C: {food.carbsPer100g}g
                            </Text>
                          </View>
                          <ChevronRight size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noResultsBox}>
                        <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>No matching foods found</Text>
                        <TouchableOpacity style={[styles.addCustomBtn, { borderColor: colors.primary }]} onPress={() => {
                          // Trigger custom input builder manually
                          setActiveFood({
                            name: searchQuery,
                            defaultQty: 1,
                            unit: 'serving',
                            caloriesPer100g: 0,
                            proteinPer100g: 0,
                            carbsPer100g: 0,
                            fatPer100g: 0,
                            fiberPer100g: 0
                          });
                        }}>
                          <Text style={[styles.addCustomBtnText, { color: colors.primary }]}>Create Custom Food Details</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                ) : (
                  <View style={{ flex: 1, paddingVertical: Spacing.two }}>
                    <Text style={[styles.recentHeader, { color: colors.text }]}>Frequent Foods</Text>
                    <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
                      {FOOD_DATABASE.slice(0, 5).map((food, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.foodResultRow, { borderBottomColor: colors.border }]} 
                          onPress={() => selectFood(food)}
                        >
                          <View>
                            <Text style={[styles.resultName, { color: colors.text }]}>{food.name}</Text>
                            <Text style={[styles.resultMacros, { color: colors.textSecondary }]}>
                              {food.caloriesPer100g} kcal/100g  •  Protein: {food.proteinPer100g}g
                            </Text>
                          </View>
                          <Plus size={16} color={colors.primary} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* FOOD QUANTITY ADJUSTER SHEET */}
            {activeFood && (
              <View style={[styles.adjustSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.backToSearch} onPress={() => setActiveFood(null)}>
                  <ChevronLeft size={16} color={colors.primary} />
                  <Text style={[styles.backToSearchText, { color: colors.primary }]}>Back to Search</Text>
                </TouchableOpacity>

                <Text style={[styles.adjustFoodTitle, { color: colors.text }]}>{activeFood.name}</Text>
                
                <View style={styles.quantityInputsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.text, marginBottom: 6 }]}>
                      Portion Amount ({activeFood.unit})
                    </Text>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="decimal-pad"
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      autoFocus
                    />
                  </View>
                </View>

                {/* Calculate preview on-the-fly */}
                {(() => {
                  const qty = parseFloat(quantityInput) || 0;
                  const factor = qty / 100;
                  const cals = Math.round(activeFood.caloriesPer100g * factor);
                  const prot = Math.round(activeFood.proteinPer100g * factor);
                  const carbs = Math.round(activeFood.carbsPer100g * factor);
                  const fat = Math.round(activeFood.fatPer100g * factor);
                  const fiber = Math.round(activeFood.fiberPer100g * factor);

                  return (
                    <View style={styles.previewBox}>
                      <Text style={[styles.previewHeader, { color: colors.textSecondary }]}>ESTIMATED NUTRITION</Text>
                      <View style={styles.previewGrid}>
                        <View style={styles.previewCell}>
                          <Text style={[styles.previewVal, { color: colors.calories }]}>{cals}</Text>
                          <Text style={styles.previewLbl}>kcal</Text>
                        </View>
                        <View style={styles.previewCell}>
                          <Text style={[styles.previewVal, { color: colors.protein }]}>{prot}g</Text>
                          <Text style={styles.previewLbl}>Prot</Text>
                        </View>
                        <View style={styles.previewCell}>
                          <Text style={[styles.previewVal, { color: colors.carbs }]}>{carbs}g</Text>
                          <Text style={styles.previewLbl}>Carb</Text>
                        </View>
                        <View style={styles.previewCell}>
                          <Text style={[styles.previewVal, { color: colors.fat }]}>{fat}g</Text>
                          <Text style={styles.previewLbl}>Fat</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                <TouchableOpacity style={[styles.addToMealBtn, { backgroundColor: colors.primary }]} onPress={addFoodToMealDraft}>
                  <Text style={styles.addToMealBtnText}>Add to Draft List</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>
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
  categoriesContainer: {
    gap: Spacing.three,
  },
  categoryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 36,
  },
  categoryNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  categorySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catSummaryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addFoodBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCategoryText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: Spacing.two,
  },
  loggedMealsList: {
    marginTop: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  loggedMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  mealNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealFoodsText: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  mealActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealCalText: {
    fontSize: 13,
    fontWeight: '800',
  },
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
    height: '85%',
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
  draftCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: Spacing.three,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  draftTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  draftTotals: {
    fontSize: 12,
    fontWeight: '800',
  },
  draftFoodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  draftFoodName: {
    fontSize: 11,
    flex: 1,
    marginRight: 10,
  },
  mealNameInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  modalSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  saveMealBtn: {
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveMealBtnText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: '800',
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
    marginLeft: 8,
    fontSize: 13,
  },
  searchResults: {
    flex: 1,
  },
  foodResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  noResultsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  addCustomBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addCustomBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recentHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  adjustSheet: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  backToSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  backToSearchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  adjustFoodTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  quantityInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  previewBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 12,
    padding: 12,
    marginTop: Spacing.one,
  },
  previewHeader: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewCell: {
    alignItems: 'center',
  },
  previewVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  previewLbl: {
    fontSize: 9,
    color: '#71717A',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  addToMealBtn: {
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  addToMealBtnText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '800',
  },
});
