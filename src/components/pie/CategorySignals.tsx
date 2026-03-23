import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import type { HorizonItem, StructuredSummary, BuilderEvolutionItem } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, Check } from "lucide-react";

const TIMELINE_ORDER: Record<string, number> = { days: 0, weeks: 1, months: 2, unknown: 3 };
const TIMELINE_STYLE: Record<string, string> = {
  days: "border-rose-500/40 text-rose-400",
  weeks: "border-yellow-500/40 text-yellow-400",
  months: "border-emerald-500/40 text-emerald-400",
  unknown: "border-muted-foreground/40 text-muted-foreground",
};

interface HorizonGroup {
  feature: string;
  timeline: HorizonItem["timeline"];
  why_it_matters: string;
  sources: { creatorName: string; episodeTitle: string }[];
}

interface BuilderEvoEntry {
  item: BuilderEvolutionItem;
  creatorName: string;
  episodeTitle: string;
}

const dayOptions = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
];

interface Props {
  category: string | null;
}

function scoreColor(score: number): string {
  if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (score >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-muted text-muted-foreground border-border";
}

const CategorySignals = ({ category }: Props) => {
  const [days, setDays] = useState(30);
  const [savedMonitors, setSavedMonitors] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const since = useMemo(() => subDays(new Date(), days).toISOString(), [days]);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-signals", category, days],
    queryFn: async () => {
      let query = supabase
        .from("pie_episodes")
        .select("title, published_at, structured_summary, pie_creators!inner(name, category)")
        .eq("status", "completed")
        .gte("published_at", since)
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("pie_creators.category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { horizonGroups, builderEvoItems } = useMemo(() => {
    const horizonMap = new Map<string, HorizonGroup>();
    const builderEvoItems: BuilderEvoEntry[] = [];

    if (!episodes) return { horizonGroups: [], builderEvoItems: [] };

    for (const ep of episodes) {
      const s = ep.structured_summary as unknown as StructuredSummary | null;
      const creatorName = (ep.pie_creators as any)?.name ?? "Unknown";

      for (const h of s?.on_the_horizon ?? []) {
        const key = h.feature.toLowerCase().trim();
        const existing = horizonMap.get(key);
        if (existing) {
          existing.sources.push({ creatorName, episodeTitle: ep.title });
        } else {
          horizonMap.set(key, {
            feature: h.feature,
            timeline: h.timeline,
            why_it_matters: h.why_it_matters,
            sources: [{ creatorName, episodeTitle: ep.title }],
          });
        }
      }

      for (const be of s?.builder_evolution ?? []) {
        builderEvoItems.push({ item: be, creatorName, episodeTitle: ep.title });
      }
    }

    const horizonGroups = Array.from(horizonMap.values()).sort(
      (a, b) => (TIMELINE_ORDER[a.timeline] ?? 3) - (TIMELINE_ORDER[b.timeline] ?? 3)
    );

    builderEvoItems.sort((a, b) => b.item.score - a.item.score);

    return { horizonGroups, builderEvoItems: builderEvoItems.slice(0, 15) };
  }, [episodes]);

  const handleMonitor = async (item: HorizonGroup) => {
    const sourcesText = item.sources.map((s) => `- ${s.creatorName} — ${s.episodeTitle}`).join("\n");
    const prompt = `Monitor and report on: ${item.feature}\n\nContext: ${item.why_it_matters}\n\nSources:\n${sourcesText}`;

    const { error } = await supabase.from("pie_agent_briefs" as any).insert({
      title: `Monitor: ${item.feature}`,
      prompt,
      category: "monitor",
      source: `${item.sources[0]?.creatorName} — ${item.sources[0]?.episodeTitle}`,
    });
    if (error) {
      toast({ title: "Error saving", variant: "destructive" });
      return;
    }
    toast({ title: "Added to monitoring queue" });
    setSavedMonitors((prev) => new Set(prev).add(item.feature));
    setTimeout(() => {
      setSavedMonitors((prev) => { const next = new Set(prev); next.delete(item.feature); return next; });
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const isEmpty = horizonGroups.length === 0 && builderEvoItems.length === 0;

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <DayToggle value={days} onChange={setDays} />
        <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
          No signals detected in this category for the last {days} days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DayToggle value={days} onChange={setDays} />

      {/* Builder Evolution Signals */}
      {builderEvoItems.length > 0 && (
        <section>
          <h2 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Builder Evolution Signals
          </h2>
          <div className="space-y-2">
            {builderEvoItems.map((entry, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-[10px] ${scoreColor(entry.item.score)}`}>
                    {entry.item.score}/10
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">{entry.item.tool_or_pattern}</span>
                </div>
                {entry.item.replaces_or_upgrades && (
                  <p className="text-[11px] text-muted-foreground">↗ {entry.item.replaces_or_upgrades}</p>
                )}
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {entry.creatorName} · {entry.episodeTitle}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* On the Horizon */}
      {horizonGroups.length > 0 && (
        <section>
          <h2 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            On the Horizon
          </h2>
          <div className="space-y-2">
            {horizonGroups.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{item.feature}</span>
                    <Badge variant="outline" className={`text-[10px] ${TIMELINE_STYLE[item.timeline] ?? TIMELINE_STYLE.unknown}`}>
                      {item.timeline}
                    </Badge>
                    {item.sources.length > 1 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.sources.length} sources
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 gap-1 px-2 text-[10px] shrink-0"
                    onClick={() => handleMonitor(item)}
                    disabled={savedMonitors.has(item.feature)}
                  >
                    {savedMonitors.has(item.feature) ? (
                      <><Check className="h-3 w-3" /> Saved</>
                    ) : (
                      <><Eye className="h-3 w-3" /> Monitor</>
                    )}
                  </Button>
                </div>
                <p className="font-mono-pie text-xs leading-relaxed text-muted-foreground">
                  {item.why_it_matters}
                </p>
                {item.sources.map((src, j) => (
                  <p key={j} className="mt-1 text-[10px] text-muted-foreground/70">
                    {src.creatorName} · {src.episodeTitle}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

function DayToggle({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {dayOptions.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={value === opt.value ? "default" : "outline"}
          className="h-7 px-3 text-xs"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

export default CategorySignals;
