import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

interface ToolEntry {
  name: string;
  count: number;
  contexts: { episodeTitle: string; context: string }[];
}

const Tools = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: tools, isLoading } = useQuery({
    queryKey: ["pie-tools"],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("title, structured_summary")
        .eq("status", "completed")
        .gte("published_at", since);
      if (error) throw error;

      const map = new Map<string, { episodeTitle: string; context: string }[]>();
      for (const ep of data as unknown as PieEpisode[]) {
        const s = ep.structured_summary as StructuredSummary | null;
        for (const t of s?.tools_mentioned ?? []) {
          const key = t.name.toLowerCase().trim();
          const arr = map.get(key) ?? [];
          arr.push({ episodeTitle: ep.title, context: t.context });
          map.set(key, arr);
        }
      }

      const entries: ToolEntry[] = Array.from(map.entries()).map(([name, contexts]) => ({
        name: contexts[0]?.episodeTitle ? name : name,
        count: contexts.length,
        contexts,
      }));
      // Use original casing from first occurrence
      const caseMap = new Map<string, string>();
      for (const ep of data as unknown as PieEpisode[]) {
        const s = ep.structured_summary as StructuredSummary | null;
        for (const t of s?.tools_mentioned ?? []) {
          const key = t.name.toLowerCase().trim();
          if (!caseMap.has(key)) caseMap.set(key, t.name);
        }
      }
      for (const entry of entries) {
        entry.name = caseMap.get(entry.name) ?? entry.name;
      }

      entries.sort((a, b) => b.count - a.count);
      return entries;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!tools?.length) {
    return (
      <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
        No tools mentioned in the last 30 days.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Tools Mentioned — Last 30 Days
      </h1>
      <div className="space-y-1">
        {tools.map((tool) => (
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
              <Badge variant="secondary" className="text-[10px]">
                {tool.count} mention{tool.count > 1 ? "s" : ""}
              </Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-9 space-y-2 pb-2">
                {tool.contexts.map((ctx, i) => (
                  <div key={i} className="rounded border border-border bg-card p-2">
                    <p className="font-mono-pie text-[11px] leading-relaxed text-foreground">{ctx.context}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{ctx.episodeTitle}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default Tools;
