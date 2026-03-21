import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PieEpisode, StructuredSummary, HorizonItem, IndustryShift } from "@/types/pie";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Bot, Save } from "lucide-react";
import { subDays, format } from "date-fns";

const rangeOptions = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
];

const Relay = () => {
  const [days, setDays] = useState("7");
  const [copied, setCopied] = useState(false);
  const [agentCopied, setAgentCopied] = useState(false);
  const [agentSaved, setAgentSaved] = useState(false);
  const { toast } = useToast();

  const since = useMemo(() => subDays(new Date(), Number(days)).toISOString(), [days]);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-relay", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("id, title, source_url, source_type, published_at, status, structured_summary, creator_id, pie_creators(name)")
        .eq("status", "completed")
        .gte("published_at", since)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PieEpisode[];
    },
  });

  const eps = episodes ?? [];

  // Stats
  const stats = useMemo(() => {
    let insights = 0, automations = 0, tools = 0, horizonItems = 0;
    const creators = new Set<string>();
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      if (!s) continue;
      creators.add(ep.pie_creators?.name ?? "Unknown");
      insights += s.actionable_insights?.length ?? 0;
      automations += s.automation_opportunities?.length ?? 0;
      tools += s.tools_mentioned?.length ?? 0;
      horizonItems += s.on_the_horizon?.length ?? 0;
    }
    return { episodes: eps.length, insights, automations, tools, creators: creators.size, horizonItems };
  }, [eps]);

  // Generate markdown
  const markdown = useMemo(() => {
    if (eps.length === 0) return "";
    const range = rangeOptions.find((r) => r.value === days)?.label ?? "";
    const lines: string[] = [];

    lines.push(`# PIE Intelligence Briefing (${range})`);
    lines.push("");
    lines.push(`${stats.episodes} episodes processed from ${stats.creators} creators`);
    lines.push("");

    // Actionable Insights
    const allInsights: string[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.actionable_insights?.forEach((t) => allInsights.push(t));
    }
    if (allInsights.length > 0) {
      lines.push("## Actionable Insights");
      lines.push("");
      allInsights.slice(0, 10).forEach((t) => lines.push(`- ${t}`));
      lines.push("");
    }

    // Build Ideas
    const allBuilds: string[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.build_this_week?.forEach((t) => allBuilds.push(t));
    }
    if (allBuilds.length > 0) {
      lines.push("## Build Ideas");
      lines.push("");
      allBuilds.slice(0, 8).forEach((t) => lines.push(`- ${t}`));
      lines.push("");
    }

    // Automation Opportunities
    const allAutos: { idea: string; complexity: string }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.automation_opportunities?.forEach((a) => allAutos.push(a));
    }
    if (allAutos.length > 0) {
      lines.push("## Automation Opportunities");
      lines.push("");
      allAutos.slice(0, 8).forEach((a) => lines.push(`- [${a.complexity}] ${a.idea}`));
      lines.push("");
    }

    // On the Horizon
    const allHorizon: { item: HorizonItem; creator: string }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      const creator = ep.pie_creators?.name ?? "Unknown";
      s?.on_the_horizon?.forEach((h) => allHorizon.push({ item: h, creator }));
    }
    if (allHorizon.length > 0) {
      lines.push("## On the Horizon");
      lines.push("");
      allHorizon.forEach(({ item, creator }) =>
        lines.push(`- [${item.timeline}] ${item.feature} — ${item.why_it_matters} (Source: ${creator})`)
      );
      lines.push("");
    }

    // Industry Shifts
    const allShifts: IndustryShift[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.industry_shifts?.forEach((shift) => allShifts.push(shift));
    }
    if (allShifts.length > 0) {
      lines.push("## Industry Shifts");
      lines.push("");
      allShifts.forEach((s) => lines.push(`- ${s.shift} — ${s.evidence}`));
      lines.push("");
    }

    // Tools
    const toolNames = new Set<string>();
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.tools_mentioned?.forEach((t) => toolNames.add(t.name));
    }
    if (toolNames.size > 0) {
      lines.push("## Tools & Platforms Mentioned");
      lines.push("");
      lines.push(Array.from(toolNames).join(", "));
      lines.push("");
    }

    // Key Concepts
    const allConcepts: { concept: string; explanation: string }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.key_ideas?.forEach((k) => allConcepts.push(k));
    }
    if (allConcepts.length > 0) {
      lines.push("## Key Concepts");
      lines.push("");
      allConcepts.slice(0, 8).forEach((k) => lines.push(`- **${k.concept}**: ${k.explanation}`));
      lines.push("");
    }

    // Episode Breakdown
    lines.push("## Episode Breakdown");
    lines.push("");
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      const date = ep.published_at ? format(new Date(ep.published_at), "MMM d, yyyy") : "Unknown date";
      lines.push(`### ${ep.title}`);
      lines.push(`${ep.pie_creators?.name ?? "Unknown"} — ${date}`);
      lines.push("");
      s?.executive_summary?.slice(0, 3).forEach((t) => lines.push(`- ${t}`));
      lines.push("");
    }

    lines.push("---");
    lines.push("Use this as context when collaborating with Claude on building, automating, or exploring these ideas.");

    return lines.join("\n");
  }, [eps, days, stats]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: "Paste it into a Claude conversation." });
    setTimeout(() => setCopied(false), 2000);
  };

  const agentPreamble = `You are my personal AI engineer. I am about to share my weekly intelligence briefing from PIE (Personal Intelligence Engine). After reading it, I want you to:

1. Identify the single highest-leverage thing I should build this week
2. Ask me 3 clarifying questions to scope it properly
3. Then present a detailed build plan with file structure, Supabase schema changes needed, and n8n workflow design

My stack: n8n (mkidder97.app.n8n.cloud), Lovable (React/TypeScript/Tailwind/shadcn), Supabase (PostgreSQL + pgvector + Edge Functions), Claude API (claude-haiku-4-5-20251001)

---

`;

  const handleAgentBrief = async () => {
    const combined = agentPreamble + markdown;
    await navigator.clipboard.writeText(combined);
    setAgentCopied(true);
    toast({ title: "Agent Brief copied!", description: "Paste into Claude Code to start building." });
    setTimeout(() => setAgentCopied(false), 5000);
  };

  const handleAgentSave = async () => {
    const combined = agentPreamble + markdown;
    const rangeLabel = rangeOptions.find((r) => r.value === days)?.label ?? "";
    const { error } = await supabase.from("pie_agent_briefs" as any).insert({
      title: `Weekly Agent Brief — ${rangeLabel}`,
      prompt: combined,
      category: "relay",
      source: "relay",
    });
    if (error) {
      toast({ title: "Error saving", variant: "destructive" });
      return;
    }
    setAgentSaved(true);
    toast({ title: "Saved to Agent Briefs library" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono-pie text-lg font-bold text-foreground">Relay to Claude</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Curated briefing formatted for pasting into Claude. Copy it, start a conversation, and collaborate.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-44 bg-card border-border text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          disabled={!markdown || isLoading}
          className="gap-1.5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy All"}
        </Button>
      </div>

      {/* Quick stats */}
      {isLoading ? (
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[11px]">{stats.episodes} episodes</Badge>
          <Badge variant="outline" className="text-[11px]">{stats.insights} insights</Badge>
          <Badge variant="outline" className="text-[11px]">{stats.automations} automations</Badge>
          <Badge variant="outline" className="text-[11px]">{stats.tools} tool mentions</Badge>
          <Badge variant="outline" className="text-[11px]">{stats.horizonItems} horizon items</Badge>
        </div>
      )}

      {/* Preview */}
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : markdown ? (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <pre className="font-mono-pie text-xs text-foreground/90 whitespace-pre-wrap max-h-[600px] overflow-y-auto leading-relaxed">
              {markdown}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No completed episodes in this time range.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Relay;
