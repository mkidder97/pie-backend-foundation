export interface KeyIdea {
  concept: string;
  explanation: string;
}

export interface MentalModel {
  model: string;
  how_applied: string;
}

export interface ToolMentioned {
  name: string;
  context: string;
}

export interface AutomationOpportunity {
  idea: string;
  complexity: string;
}

export interface StartupIdea {
  concept: string;
  why_interesting: string;
}

export interface StructuredSummary {
  executive_summary: string[];
  key_ideas: KeyIdea[];
  mental_models: MentalModel[];
  actionable_insights: string[];
  tools_mentioned: ToolMentioned[];
  automation_opportunities: AutomationOpportunity[];
  startup_app_ideas: StartupIdea[];
  notable_quotes: string[];
  build_this_week: string[];
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
  pie_creators: { name: string } | null;
}
