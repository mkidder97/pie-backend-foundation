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
import { Copy, Check } from "lucide-react";
import { subDays, format } from "date-fns";

const rangeOptions = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
];

interface Props {
  category: string | null;
}

const CategoryRelay = ({ category }: Props) => {
  const [days, setDays] = useState("7");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const since = useMemo(() => subDays(new Date(), Number(days)).toISOString(), [days]);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-relay", days, category],
    queryFn: async () => {
      let query = supabase
        .from("pie_episodes")
        .select("id, title, source_url, source_type, published_at, status, structured_summary, creator_id, pie_creators!inner(name, category)")
        .eq("status", "completed")
        .gte("published_at", since)
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("pie_creators.category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as unknown as PieEpisode[];
    },
  });

  const eps = episodes ?? [];

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

  const markdown = useMemo(() => {
    if (eps.length === 0) return "";
    const range = rangeOptions.find((r) => r.value === days)?.label ?? "";
    const lines: string[] = [];

    lines.push(`# PIE Intelligence Briefing (${range})`);
    lines.push("");
    lines.push(`${stats.episodes} episodes processed from ${stats.creators} creators`);
    lines.push("");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono-pie text-lg font-bold text-foreground">Relay to Claude</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Curated briefing formatted for pasting into Claude. Copy it, start a conversation, and collaborate.
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

export default CategoryRelay;
