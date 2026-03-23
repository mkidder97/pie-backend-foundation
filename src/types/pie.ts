export interface BuilderEvolutionItem {
  tool_or_pattern: string;
  why_it_matters: string;
  replaces_or_upgrades: string;
  score: number;
}

export interface AutonomyMultiplierItem {
  idea: string;
  steps_removed: string;
  current_friction_eliminated: string;
  score: number;
}

export interface EmergingStackItem {
  tool_or_method: string;
  who_is_adopting: string;
  why_ahead: string;
  score: number;
}

export interface ToolMentioned {
  name: string;
  url: string;
  category: string;
  recon_worthy: boolean;
}

export interface BuildThisWeekItem {
  what: string;
  why_now: string;
  estimated_hours: number;
}

export interface HorizonItem {
  feature: string;
  source: string;
  timeline: 'days' | 'weeks' | 'months' | 'unknown';
  why_it_matters: string;
}

export interface StructuredSummary {
  executive_summary: string[];
  key_insight?: string;
  builder_evolution?: BuilderEvolutionItem[];
  autonomy_multiplier?: AutonomyMultiplierItem[];
  emerging_stack?: EmergingStackItem[];
  tools_mentioned?: ToolMentioned[];
  build_this_week?: BuildThisWeekItem[];
  on_the_horizon?: HorizonItem[];
}

export interface PieEpisode {
  id: string;
  title: string;
  source_url: string;
  source_type: 'youtube' | 'rss' | 'both' | null;
  published_at: string | null;
  status: string;
  structured_summary: StructuredSummary | null;
  creator_id: string;
  pie_creators: { name: string; category?: string } | null;
}
