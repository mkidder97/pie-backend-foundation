CREATE TABLE IF NOT EXISTS pie_tool_recon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL,
  website_url text,
  builder_evolution_score int CHECK (builder_evolution_score BETWEEN 1 AND 10),
  builder_evolution_reason text,
  autonomy_multiplier_score int CHECK (autonomy_multiplier_score BETWEEN 1 AND 10),
  autonomy_multiplier_reason text,
  emerging_stack_score int CHECK (emerging_stack_score BETWEEN 1 AND 10),
  emerging_stack_reason text,
  total_score int GENERATED ALWAYS AS (
    COALESCE(builder_evolution_score,0) +
    COALESCE(autonomy_multiplier_score,0) +
    COALESCE(emerging_stack_score,0)
  ) STORED,
  replaces_or_upgrades text,
  integrations text[],
  use_cases text[],
  solo_viable boolean,
  verdict text,
  recon_summary text,
  source_episode_id uuid REFERENCES pie_episodes(id),
  flagged_by_pie boolean DEFAULT true,
  manually_added boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pie_tool_recon ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read write" ON pie_tool_recon FOR ALL USING (true) WITH CHECK (true);