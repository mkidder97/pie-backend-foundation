import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Search } from "lucide-react";

interface ToolEntry {
  name: string;
  count: number;
  contexts: { episodeTitle: string; context: string; creatorName: string }[];
  categories: Set<string>;
}

const CATEGORY_LABELS: Record<string, string> = {
  src_tools: "SRC Tools",
  stack_watch: "Stack Watch",
  finance: "Finance",
  opportunities: "Opportunities",
};

const Tools = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [thisWeek, setThisWeek] = useState(false);

  const { data: tools, isLoading } = useQuery({
    queryKey: ["pie-tools-enhanced", thisWeek],
    queryFn: async () => {
      const since = subDays(new Date(), thisWeek ? 7 : 30).toISOString();
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("title, structured_summary, pie_creators(name, category)")
        .eq("status", "completed")
        .gte("published_at", since);
      if (error) throw error;

      const map = new Map<string, { contexts: { episodeTitle: string; context: string; creatorName: string }[]; categories: Set<string> }>();
      const caseMap = new Map<string, string>();

      for (const ep of data as any[]) {
        const s = ep.structured_summary as StructuredSummary | null;
        const creatorName = ep.pie_creators?.name ?? "Unknown";
        const creatorCategory = ep.pie_creators?.category ?? "src_tools";

        for (const t of s?.tools_mentioned ?? []) {
          const key = t.name.toLowerCase().trim();
          if (!caseMap.has(key)) caseMap.set(key, t.name);

          const existing = map.get(key) ?? { contexts: [], categories: new Set<string>() };
          existing.contexts.push({ episodeTitle: ep.title, context: t.context, creatorName });
          existing.categories.add(creatorCategory);
          map.set(key, existing);
        }
      }

      const entries: ToolEntry[] = Array.from(map.entries()).map(([key, val]) => ({
        name: caseMap.get(key) ?? key,
        count: val.contexts.length,
        contexts: val.contexts,
        categories: val.categories,
      }));

      entries.sort((a, b) => b.count - a.count);
      return entries;
    },
  });

  const filtered = useMemo(() => {
    if (!tools) return [];
    if (!search.trim()) return tools;
    const q = search.toLowerCase();
    return tools.filter((t) => t.name.toLowerCase().includes(q));
  }, [tools, search]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = new Map<string, ToolEntry[]>();
    for (const tool of filtered) {
      const cats = Array.from(tool.categories);
      const primary = cats[0] ?? "src_tools";
      const arr = groups.get(primary) ?? [];
      arr.push(tool);
      groups.set(primary, arr);
    }
    return groups;
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Tools Mentioned — {thisWeek ? "This Week" : "Last 30 Days"}
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          variant={thisWeek ? "default" : "outline"}
          className="h-8 text-xs"
          onClick={() => setThisWeek(!thisWeek)}
        >
          This Week
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
          No tools found.
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([cat, catTools]) => (
            <div key={cat}>
              <h2 className="font-mono-pie text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <div className="space-y-1">
                {catTools.map((tool) => {
                  const creators = [...new Set(tool.contexts.map((c) => c.creatorName))];
                  return (
                    <Collapsible
                      key={tool.name}
                      open={expanded === tool.name}
                      onOpenChange={(open) => setExpanded(open ? tool.name : null)}
                    >
                      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-accent">
                        <ChevronRight
                          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${expanded === tool.name ? "rotate-90" : ""}`}
                        />
                        <span className="flex-1 text-sm font-medium text-foreground">{tool.name}</span>
                        <span className="text-[10px] text-muted-foreground mr-2 hidden sm:inline">
                          {creators.slice(0, 2).join(", ")}{creators.length > 2 ? ` +${creators.length - 2}` : ""}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {tool.count} mention{tool.count > 1 ? "s" : ""}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-9 space-y-2 pb-2">
                          {tool.contexts.map((ctx, i) => (
                            <div key={i} className="rounded border border-border bg-card p-2">
                              <p className="font-mono-pie text-[11px] leading-relaxed text-foreground">{ctx.context}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {ctx.creatorName} · {ctx.episodeTitle}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tools;
