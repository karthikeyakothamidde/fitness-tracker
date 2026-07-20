import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  TextInput,
  Image,
  useColorScheme 
} from 'react-native';
import { useFitness } from '../context/FitnessContext';
import { geminiService, AIScanResult } from '../services/gemini';
import { Colors, Spacing } from '../constants/theme';
import { 
  Camera, 
  Image as ImageIcon, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react-native';
import { FoodItem, MealCategory } from '../types';

export default function ScanScreen() {
  const { addMeal } = useFitness();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme === null ? 'dark' : scheme];

  // Scanner UI States
  // 'idle' | 'capturing' | 'scanning' | 'review'
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'review'>('idle');
  const [mealCategory, setMealCategory] = useState<MealCategory>('Lunch');
  
  // Scanned results
  const [scanResult, setScanResult] = useState<AIScanResult | null>(null);
  
  // Simulated image path to display in review
  const [mealPhoto, setMealPhoto] = useState<string | null>(null);

  // Trigger real or simulated scan
  const triggerScan = async () => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setScanState('scanning');

          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              const fileUrl = URL.createObjectURL(file);
              setMealPhoto(fileUrl);

              const result = await geminiService.scanMealImage(base64Data);
              setScanResult(result);
              setScanState('review');
            } catch (error) {
              console.error('Scan failed:', error);
              setScanState('idle');
            }
          };
          
          reader.onerror = () => {
            console.error('Failed to read selected file.');
            setScanState('idle');
          };

          reader.readAsDataURL(file);
        };

        input.click();
      } catch (err) {
        console.error('File picker error:', err);
      }
    } else {
      setScanState('scanning');
      setMealPhoto('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'); // Beautiful mock salad image
      
      try {
        const result = await geminiService.scanMealImage('dummy_base64_string');
        setScanResult(result);
        setScanState('review');
      } catch (e) {
        console.error(e);
        setScanState('idle');
      }
    }
  };

  // Edit Detected food fields in state
  const handleUpdateFood = (idx: number, field: keyof FoodItem, value: any) => {
    if (!scanResult) return;
    
    const updatedFoods = [...scanResult.foods];
    const foodItem = { ...updatedFoods[idx] };

    if (field === 'name') {
      foodItem.name = value;
    } else {
      (foodItem as any)[field] = parseFloat(value) || 0;
    }

    updatedFoods[idx] = foodItem;

    // Recalculate totals
    let cals = 0, prot = 0, carbs = 0, fat = 0, fiber = 0;
    updatedFoods.forEach(f => {
      cals += f.calories;
      prot += f.protein;
      carbs += f.carbs;
      fat += f.fat;
      fiber += f.fiber;
    });

    setScanResult({
      ...scanResult,
      foods: updatedFoods,
      calories: Math.round(cals),
      protein: Math.round(prot),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber)
    });
  };

  const removeFoodItem = (idx: number) => {
    if (!scanResult) return;
    const filtered = scanResult.foods.filter((_, i) => i !== idx);

    let cals = 0, prot = 0, carbs = 0, fat = 0, fiber = 0;
    filtered.forEach(f => {
      cals += f.calories;
      prot += f.protein;
      carbs += f.carbs;
      fat += f.fat;
      fiber += f.fiber;
    });

    setScanResult({
      ...scanResult,
      foods: filtered,
      calories: Math.round(cals),
      protein: Math.round(prot),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber)
    });
  };

  const addEmptyFoodItem = () => {
    if (!scanResult) return;
    const newItem: FoodItem = {
      name: 'New Ingredient',
      quantity: 100,
      unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };
    setScanResult({
      ...scanResult,
      foods: [...scanResult.foods, newItem]
    });
  };

  const handleSaveMeal = async () => {
    if (!scanResult) return;
    
    // Save to diary
    await addMeal(
      mealCategory,
      scanResult.mealName || 'Scanned Meal',
      scanResult.foods,
      mealPhoto
    );

    // Reset scanner
    setScanResult(null);
    setMealPhoto(null);
    setScanState('idle');
  };

  const categories: { name: MealCategory; icon: string }[] = [
    { name: 'Breakfast', icon: '🌅' },
    { name: 'Lunch', icon: '🍱' },
    { name: 'Pre-Workout', icon: '⚡' },
    { name: 'Post-Workout', icon: '💪' },
    { name: 'Dinner', icon: '🌙' },
    { name: 'Snack', icon: '🍎' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {scanState === 'idle' && (
        <View style={styles.viewfinderContainer}>
          <View style={[styles.viewfinderBorder, { borderColor: colors.border }]}>
            <View style={styles.cameraMockBg}>
              <Camera size={44} color={colors.textSecondary} strokeWidth={1} />
              <Text style={[styles.cameraMockText, { color: colors.textSecondary }]}>
                Aura AI Meal Vision
              </Text>
              <Text style={[styles.cameraMockSub, { color: colors.textSecondary }]}>
                Position your plate in the center of the frame
              </Text>
            </View>
            
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
          </View>

          <View style={styles.captureControls}>
            <TouchableOpacity style={[styles.galleryBtn, { borderColor: colors.border }]} onPress={triggerScan}>
              <ImageIcon size={20} color={colors.text} />
              <Text style={[styles.galleryBtnText, { color: colors.text }]}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.shutterBtn, { backgroundColor: colors.primary }]} onPress={triggerScan}>
              <View style={styles.innerShutter} />
            </TouchableOpacity>

            <View style={{ width: 80 }} />
          </View>
        </View>
      )}

      {scanState === 'scanning' && (
        <View style={styles.scanningContainer}>
          <View style={styles.scanBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <View style={[styles.laserBar, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.scanningTitle, { color: colors.text }]}>Analyzing your meal...</Text>
          <Text style={[styles.scanningSub, { color: colors.textSecondary }]}>
            Identifying foods & estimating macros using Gemini Pro Vision
          </Text>
        </View>
      )}

      {scanState === 'review' && scanResult && (
        <ScrollView contentContainerStyle={styles.reviewScroll} showsVerticalScrollIndicator={false}>
          
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.title, { color: colors.text }]}>AI Nutrition Estimate</Text>
            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: colors.border }]}
              onPress={() => setScanState('idle')}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.alertBadge, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245,158,11,0.2)' }]}>
            <Info size={15} color={colors.warning} />
            <Text style={[styles.alertText, { color: colors.warning }]}>
              AI estimates can vary. Please review and adjust portions.
            </Text>
          </View>

          <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Meal Name</Text>
            <TextInput
              style={[styles.mealNameInput, { color: colors.text, borderColor: colors.border }]}
              value={scanResult.mealName}
              onChangeText={(val) => setScanResult({ ...scanResult, mealName: val })}
            />

            <View style={styles.totalMacroGrid}>
              <View style={styles.macroSumCell}>
                <Text style={[styles.macroSumVal, { color: colors.calories }]}>{scanResult.calories}</Text>
                <Text style={styles.macroSumLbl}>kcal</Text>
              </View>
              <View style={styles.macroSumCell}>
                <Text style={[styles.macroSumVal, { color: colors.protein }]}>{scanResult.protein}g</Text>
                <Text style={styles.macroSumLbl}>Prot</Text>
              </View>
              <View style={styles.macroSumCell}>
                <Text style={[styles.macroSumVal, { color: colors.carbs }]}>{scanResult.carbs}g</Text>
                <Text style={styles.macroSumLbl}>Carb</Text>
              </View>
              <View style={styles.macroSumCell}>
                <Text style={[styles.macroSumVal, { color: colors.fat }]}>{scanResult.fat}g</Text>
                <Text style={styles.macroSumLbl}>Fat</Text>
              </View>
              <View style={styles.macroSumCell}>
                <Text style={[styles.macroSumVal, { color: colors.fiber }]}>{scanResult.fiber}g</Text>
                <Text style={styles.macroSumLbl}>Fiber</Text>
              </View>
            </View>
          </View>

          {/* Categories Selector */}
          <Text style={[styles.blockHeader, { color: colors.text }]}>Which meal category is this?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat, idx) => {
              const isSelected = mealCategory === cat.name;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.catSelectBtn,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setMealCategory(cat.name)}
                >
                  <Text style={[styles.catSelectText, { color: colors.text }, isSelected && { color: '#09090B', fontWeight: '800' }]}>
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.ingredientsHeaderRow}>
            <Text style={[styles.blockHeader, { color: colors.text }]}>Edit Food Ingredients</Text>
            <TouchableOpacity style={[styles.addIngredientBtn, { borderColor: colors.border }]} onPress={addEmptyFoodItem}>
              <Plus size={12} color={colors.primary} />
              <Text style={[styles.addIngredientText, { color: colors.text }]}>Add Item</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ingredientsList}>
            {scanResult.foods.map((food, idx) => (
              <View key={idx} style={[styles.foodItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.foodRow1}>
                  <TextInput
                    style={[styles.foodNameInput, { color: colors.text, borderColor: colors.border }]}
                    value={food.name}
                    onChangeText={(val) => handleUpdateFood(idx, 'name', val)}
                  />
                  <TouchableOpacity onPress={() => removeFoodItem(idx)}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.foodRow2}>
                  <View style={styles.foodField}>
                    <Text style={styles.foodFieldLbl}>Portion (g)</Text>
                    <TextInput
                      style={[styles.foodInput, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="number-pad"
                      value={food.quantity.toString()}
                      onChangeText={(val) => handleUpdateFood(idx, 'quantity', val)}
                    />
                  </View>

                  <View style={styles.foodField}>
                    <Text style={styles.foodFieldLbl}>Calories</Text>
                    <TextInput
                      style={[styles.foodInput, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="number-pad"
                      value={food.calories.toString()}
                      onChangeText={(val) => handleUpdateFood(idx, 'calories', val)}
                    />
                  </View>

                  <View style={styles.foodField}>
                    <Text style={styles.foodFieldLbl}>Protein (g)</Text>
                    <TextInput
                      style={[styles.foodInput, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="number-pad"
                      value={food.protein.toString()}
                      onChangeText={(val) => handleUpdateFood(idx, 'protein', val)}
                    />
                  </View>

                  <View style={styles.foodField}>
                    <Text style={styles.foodFieldLbl}>Carbs (g)</Text>
                    <TextInput
                      style={[styles.foodInput, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="number-pad"
                      value={food.carbs.toString()}
                      onChangeText={(val) => handleUpdateFood(idx, 'carbs', val)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Confirm & Save */}
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleSaveMeal}>
            <Check size={20} color="#09090B" style={{ marginRight: 6 }} />
            <Text style={styles.confirmBtnText}>Save Meal to Diary</Text>
          </TouchableOpacity>

        </ScrollView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewfinderContainer: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: 'space-between',
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  viewfinderBorder: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: Spacing.two,
  },
  cameraMockBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraMockText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cameraMockSub: {
    fontSize: 11,
    textAlign: 'center',
    width: '70%',
    lineHeight: 16,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  captureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  shutterBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  innerShutter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#09090B',
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  galleryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scanningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  scanBox: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: '#27272A',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.four,
    overflow: 'hidden',
  },
  laserBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    top: '30%',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  scanningTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  scanningSub: {
    fontSize: 12,
    textAlign: 'center',
    width: '80%',
    lineHeight: 16,
  },
  reviewScroll: {
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
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  alertBadge: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    lineHeight: 14,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mealNameInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  totalMacroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 10,
    padding: 10,
  },
  macroSumCell: {
    alignItems: 'center',
  },
  macroSumVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  macroSumLbl: {
    fontSize: 9,
    color: '#71717A',
    marginTop: 2,
  },
  blockHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: Spacing.two,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  catSelectBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  catSelectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addIngredientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  addIngredientText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ingredientsList: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  foodItemCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: Spacing.two,
  },
  foodRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  foodNameInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  foodRow2: {
    flexDirection: 'row',
    gap: 8,
  },
  foodField: {
    flex: 1,
    gap: 4,
  },
  foodFieldLbl: {
    fontSize: 9,
    color: '#71717A',
    fontWeight: '600',
  },
  foodInput: {
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    fontSize: 11,
    textAlign: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '900',
  },
});
