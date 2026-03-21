CREATE TABLE pie_user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_type text NOT NULL,
  preference_key text NOT NULL,
  weight int NOT NULL DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(preference_type, preference_key)
);

ALTER TABLE pie_user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read write" ON pie_user_preferences
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_pie_user_preferences_updated_at
  BEFORE UPDATE ON pie_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();