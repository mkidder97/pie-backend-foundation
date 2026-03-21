CREATE TABLE pie_agent_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  prompt text NOT NULL,
  category text DEFAULT 'all',
  source text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pie_agent_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read write" ON pie_agent_briefs
  FOR ALL USING (true) WITH CHECK (true);