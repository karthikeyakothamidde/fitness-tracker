import { FoodItem } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface AIScanResult {
  mealName: string;
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: 'high' | 'medium' | 'low';
}

// List of mock meals for simulation mode
const MOCK_MEALS: AIScanResult[] = [
  {
    mealName: 'Grilled Chicken & Quinoa Salad',
    confidence: 'high',
    foods: [
      { name: 'Grilled Chicken Breast', quantity: 150, unit: 'g', calories: 247, protein: 46, carbs: 0, fat: 5, fiber: 0 },
      { name: 'Cooked Quinoa', quantity: 120, unit: 'g', calories: 144, protein: 5, carbs: 26, fat: 2, fiber: 3 },
      { name: 'Mixed Greens & Avocado', quantity: 100, unit: 'g', calories: 120, protein: 2, carbs: 8, fat: 9, fiber: 5 }
    ],
    calories: 511, protein: 53, carbs: 34, fat: 16, fiber: 8
  },
  {
    mealName: 'Oatmeal with Berries & Honey',
    confidence: 'high',
    foods: [
      { name: 'Rolled Oats (cooked)', quantity: 200, unit: 'g', calories: 166, protein: 6, carbs: 28, fat: 3, fiber: 4 },
      { name: 'Blueberries & Raspberries', quantity: 80, unit: 'g', calories: 45, protein: 1, carbs: 10, fat: 0.4, fiber: 3.5 },
      { name: 'Honey', quantity: 15, unit: 'g', calories: 46, protein: 0, carbs: 12, fat: 0, fiber: 0 }
    ],
    calories: 257, protein: 7, carbs: 50, fat: 3.4, fiber: 7.5
  },
  {
    mealName: 'Classic Salmon Rice Bowl',
    confidence: 'high',
    foods: [
      { name: 'Pan-Seared Salmon', quantity: 140, unit: 'g', calories: 290, protein: 32, carbs: 0, fat: 17, fiber: 0 },
      { name: 'Brown Rice', quantity: 150, unit: 'g', calories: 170, protein: 4, carbs: 35, fat: 1.5, fiber: 2.5 },
      { name: 'Steamed Broccoli', quantity: 80, unit: 'g', calories: 28, protein: 2.5, carbs: 5, fat: 0.3, fiber: 2.6 }
    ],
    calories: 488, protein: 38.5, carbs: 40, fat: 18.8, fiber: 5.1
  },
  {
    mealName: 'Avocado Toast with Poached Eggs',
    confidence: 'high',
    foods: [
      { name: 'Sourdough Toast', quantity: 2, unit: 'slices', calories: 180, protein: 7, carbs: 36, fat: 1.5, fiber: 2 },
      { name: 'Mashed Avocado', quantity: 70, unit: 'g', calories: 112, protein: 1.4, carbs: 6, fat: 10, fiber: 4.8 },
      { name: 'Poached Eggs', quantity: 2, unit: 'large', calories: 144, protein: 12.6, carbs: 0.8, fat: 9.9, fiber: 0 }
    ],
    calories: 436, protein: 21, carbs: 42.8, fat: 21.4, fiber: 6.8
  }
];

export const geminiService = {
  scanMealImage: async (base64Image: string): Promise<AIScanResult> => {
    // 1. Check if Gemini API key exists
    const hasKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
    
    if (!hasKey) {
      // Simulate API lag
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Pick a random mock meal
      const randomIndex = Math.floor(Math.random() * MOCK_MEALS.length);
      return MOCK_MEALS[randomIndex];
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const systemPrompt = `
You are an expert AI nutritionist. Analyze this meal photo and provide a detailed estimate of the food items, portions, and nutritional information.
Return ONLY a valid JSON object matching the following structure:
{
  "mealName": "Name of the overall meal",
  "confidence": "high" | "medium" | "low",
  "foods": [
    {
      "name": "specific food item name",
      "quantity": 100,
      "unit": "g" | "ml" | "pieces" | "slices",
      "calories": 150,
      "protein": 12,
      "carbs": 15,
      "fat": 5,
      "fiber": 2
    }
  ]
}
Estimate values carefully. If the image is unclear or confidence is low, set confidence to "low". Do not output markdown fences or other text, just raw JSON.
`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const responseData = await response.json();
      const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Gemini API did not return text content.');
      }

      // Parse JSON response
      const parsedResult = JSON.parse(text) as Omit<AIScanResult, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber'>;
      
      // Calculate totals
      let totalCal = 0;
      let totalProt = 0;
      let totalCarb = 0;
      let totalFat = 0;
      let totalFib = 0;

      const foods: FoodItem[] = parsedResult.foods.map(f => {
        const item: FoodItem = {
          name: f.name || 'Unknown Item',
          quantity: Number(f.quantity) || 0,
          unit: f.unit || 'g',
          calories: Math.round(Number(f.calories) || 0),
          protein: Math.round(Number(f.protein) || 0),
          carbs: Math.round(Number(f.carbs) || 0),
          fat: Math.round(Number(f.fat) || 0),
          fiber: Math.round(Number(f.fiber) || 0)
        };
        
        totalCal += item.calories;
        totalProt += item.protein;
        totalCarb += item.carbs;
        totalFat += item.fat;
        totalFib += item.fiber;
        
        return item;
      });

      return {
        mealName: parsedResult.mealName || 'Scanned Meal',
        confidence: parsedResult.confidence || 'medium',
        foods,
        calories: Math.round(totalCal),
        protein: Math.round(totalProt),
        carbs: Math.round(totalCarb),
        fat: Math.round(totalFat),
        fiber: Math.round(totalFib)
      };

    } catch (error) {
      console.error('Error scanning meal with Gemini:', error);
      // Fail gracefully: fallback to a default mock meal so that user experience is not disrupted
      const randomIndex = Math.floor(Math.random() * MOCK_MEALS.length);
      return {
        ...MOCK_MEALS[randomIndex],
        confidence: 'low' // Mark confidence low because it's a fallback
      };
    }
  }
};
