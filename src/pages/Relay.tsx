import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PieEpisode, StructuredSummary, HorizonItem } from "@/types/pie";
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

  const stats = useMemo(() => {
    let builderEvo = 0, autonomy = 0, tools = 0, horizonItems = 0;
    const creators = new Set<string>();
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      if (!s) continue;
      creators.add(ep.pie_creators?.name ?? "Unknown");
      builderEvo += s.builder_evolution?.length ?? 0;
      autonomy += s.autonomy_multiplier?.length ?? 0;
      tools += s.tools_mentioned?.length ?? 0;
      horizonItems += s.on_the_horizon?.length ?? 0;
    }
    return { episodes: eps.length, builderEvo, autonomy, tools, creators: creators.size, horizonItems };
  }, [eps]);

  const markdown = useMemo(() => {
    if (eps.length === 0) return "";
    const range = rangeOptions.find((r) => r.value === days)?.label ?? "";
    const lines: string[] = [];

    lines.push(`# PIE Intelligence Briefing — ${range}`);
    lines.push("");
    lines.push(`${stats.episodes} episodes processed from ${stats.creators} creators`);
    lines.push("");

    // Key Insights
    const keyInsights: { insight: string; title: string }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      if (s?.key_insight) keyInsights.push({ insight: s.key_insight, title: ep.title });
    }
    if (keyInsights.length > 0) {
      lines.push("## Key Insights");
      lines.push("");
      keyInsights.forEach((k) => lines.push(`- ${k.insight} _(${k.title})_`));
      lines.push("");
    }

    // Builder Evolution
    const allBE: { tool_or_pattern: string; replaces_or_upgrades: string; why_it_matters: string; score: number }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.builder_evolution?.forEach((b) => allBE.push(b));
    }
    allBE.sort((a, b) => b.score - a.score);
    if (allBE.length > 0) {
      lines.push("## Builder Evolution");
      lines.push("");
      allBE.forEach((item) => lines.push(`- [${item.score}/10] **${item.tool_or_pattern}** — ${item.why_it_matters}`));
      lines.push("");
    }

    // Autonomy Multipliers
    const allAM: { idea: string; steps_removed: string; score: number }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.autonomy_multiplier?.forEach((a) => allAM.push(a));
    }
    allAM.sort((a, b) => b.score - a.score);
    if (allAM.length > 0) {
      lines.push("## Autonomy Multipliers");
      lines.push("");
      allAM.forEach((item) => lines.push(`- [${item.score}/10] **${item.idea}** — ${item.steps_removed}`));
      lines.push("");
    }

    // Emerging Stack
    const allES: { tool_or_method: string; who_is_adopting: string; why_ahead: string; score: number }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.emerging_stack?.forEach((e) => allES.push(e));
    }
    allES.sort((a, b) => b.score - a.score);
    if (allES.length > 0) {
      lines.push("## Emerging Stack");
      lines.push("");
      allES.forEach((item) => lines.push(`- [${item.score}/10] **${item.tool_or_method}** — ${item.why_ahead}`));
      lines.push("");
    }

    // Build This Week
    const allBuilds: { what: string; why_now: string; estimated_hours: number }[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.build_this_week?.forEach((b) => allBuilds.push(b));
    }
    if (allBuilds.length > 0) {
      lines.push("## Build This Week");
      lines.push("");
      allBuilds.forEach((b) => lines.push(`- **${b.what}** (~${b.estimated_hours}h) — ${b.why_now}`));
      lines.push("");
    }

    // Tools to Recon
    const reconTools = new Set<string>();
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.tools_mentioned?.filter((t) => t.recon_worthy).forEach((t) => reconTools.add(t.name));
    }
    if (reconTools.size > 0) {
      lines.push("## Tools to Recon");
      lines.push("");
      lines.push(Array.from(reconTools).join(", "));
      lines.push("");
    }

    // On the Horizon
    const allHorizon: HorizonItem[] = [];
    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      s?.on_the_horizon?.forEach((h) => allHorizon.push(h));
    }
    if (allHorizon.length > 0) {
      lines.push("## On the Horizon");
      lines.push("");
      allHorizon.forEach((h) => lines.push(`- [${h.timeline}] ${h.feature} — ${h.why_it_matters}`));
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
      if (s?.key_insight) lines.push(`> ${s.key_insight}`);
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
      <div>
        <h1 className="font-mono-pie text-lg font-bold text-foreground">Relay to Claude</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Curated briefing formatted for pasting into Claude.
        </p>
      </div>

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

        <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!markdown || isLoading} className="gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy All"}
        </Button>

        <Button variant="outline" size="sm" onClick={handleAgentBrief} disabled={!markdown || isLoading} className="gap-1.5">
          <Bot className="h-3.5 w-3.5" />
          {agentCopied ? "Copied!" : "Agent Brief"}
        </Button>
        {agentCopied && !agentSaved && (
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={handleAgentSave}>
            <Save className="h-3 w-3" /> Save
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[11px]">{stats.episodes} episodes</Badge>
            <Badge variant="outline" className="text-[11px]">{stats.builderEvo} builder evo</Badge>
            <Badge variant="outline" className="text-[11px]">{stats.autonomy} autonomy</Badge>
            <Badge variant="outline" className="text-[11px]">{stats.tools} tools</Badge>
            <Badge variant="outline" className="text-[11px]">{stats.horizonItems} horizon</Badge>
          </div>

          {markdown ? (
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
        </>
      )}
    </div>
  );
};

export default Relay;
