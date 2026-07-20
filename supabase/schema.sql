-- DATABASE SCHEMA FOR AI-POWERED GAMIFIED FITNESS TRACKER

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  height NUMERIC,
  current_weight NUMERIC,
  target_weight NUMERIC,
  activity_level TEXT,
  goal TEXT,
  calorie_target INTEGER,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  fiber_target INTEGER,
  water_target INTEGER DEFAULT 3000,
  gems INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  fiber INTEGER DEFAULT 0,
  foods JSONB DEFAULT '[]'::jsonb,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meals." ON public.meals
  FOR ALL USING (auth.uid() = user_id);

-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workouts." ON public.workouts
  FOR ALL USING (auth.uid() = user_id);

-- Create workout exercises
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workouts ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Share workout security policies recursively
CREATE POLICY "Users can manage their own workout exercises." ON public.workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workouts 
      WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid()
    )
  );

-- Create exercise sets table
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES public.workout_exercises ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC DEFAULT 0,
  reps INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  is_pr BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own exercise sets." ON public.exercise_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = exercise_sets.workout_exercise_id AND workouts.user_id = auth.uid()
    )
  );

-- Create weight logs table
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weight logs." ON public.weight_logs
  FOR ALL USING (auth.uid() = user_id);

-- Create water logs table
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own water logs." ON public.water_logs
  FOR ALL USING (auth.uid() = user_id);

-- Create daily goals and consistency table
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_breakfast BOOLEAN DEFAULT FALSE,
  logged_lunch BOOLEAN DEFAULT FALSE,
  logged_dinner BOOLEAN DEFAULT FALSE,
  completed_workout BOOLEAN DEFAULT FALSE,
  met_protein_goal BOOLEAN DEFAULT FALSE,
  met_fiber_goal BOOLEAN DEFAULT FALSE,
  drank_water BOOLEAN DEFAULT FALSE,
  consistency_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily goals." ON public.daily_goals
  FOR ALL USING (auth.uid() = user_id);

-- Create gem transactions table
CREATE TABLE IF NOT EXISTS public.gem_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.gem_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gem transactions." ON public.gem_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Create achievements master table
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge TEXT NOT NULL, -- emoji or code
  gem_reward INTEGER DEFAULT 0,
  target_type TEXT NOT NULL,
  target_value INTEGER NOT NULL
);

-- Seed achievements data
INSERT INTO public.achievements (id, title, description, badge, gem_reward, target_type, target_value) VALUES
  ('first_meal', 'First Meal Logged', 'Log your first meal in the app.', '🍳', 10, 'meals_logged', 1),
  ('first_scan', 'First AI Scan', 'Successfully scan a meal photo with AI.', '📸', 15, 'meals_logged', 2),
  ('first_workout', 'First Workout', 'Log your first workout session.', '🏋️', 20, 'workouts_logged', 1),
  ('workouts_10', 'Workout Warrior', 'Log 10 workout sessions.', '💪', 50, 'workouts_logged', 10),
  ('workouts_50', 'Iron Veteran', 'Log 50 workout sessions.', '🔥', 150, 'workouts_logged', 50),
  ('streak_7', 'Weekly Fire', 'Maintain a 7-day tracking streak.', '🔥', 50, 'streak_days', 7),
  ('streak_30', 'Monthly Dedication', 'Maintain a 30-day tracking streak.', '🏆', 200, 'streak_days', 30),
  ('protein_master', 'Protein Master', 'Meet your protein goal 5 times.', '🍗', 40, 'protein_target_met', 5),
  ('water_master', 'Hydration Champion', 'Meet your water goal 10 times.', '💧', 30, 'water_target_met', 10)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  badge = EXCLUDED.badge,
  gem_reward = EXCLUDED.gem_reward,
  target_type = EXCLUDED.target_type,
  target_value = EXCLUDED.target_value;

-- Create user achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements." ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements." ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
