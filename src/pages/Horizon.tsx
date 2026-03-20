import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { format } from "date-fns";
import type { HorizonItem } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface HorizonSource {
  creatorName: string;
  episodeTitle: string;
  publishedAt: string | null;
  why_it_matters: string;
}

interface AggregatedHorizon {
  feature: string;
  source: string;
  timeline: HorizonItem["timeline"];
  sources: HorizonSource[];
  latestPublished: string | null;
}

const TIMELINE_ORDER: Record<string, number> = {
  days: 0,
  weeks: 1,
  months: 2,
  unknown: 3,
};

const TIMELINE_STYLE: Record<string, string> = {
  days: "border-rose-500/40 text-rose-400",
  weeks: "border-yellow-500/40 text-yellow-400",
  months: "border-emerald-500/40 text-emerald-400",
  unknown: "border-muted-foreground/40 text-muted-foreground",
};

const Horizon = () => {
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30).toISOString(), []);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-horizon-episodes", thirtyDaysAgo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("title, published_at, structured_summary, pie_creators(name)")
        .eq("status", "completed")
        .gte("published_at", thirtyDaysAgo)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const aggregated = useMemo(() => {
    if (!episodes?.length) return [];

    const map = new Map<string, AggregatedHorizon>();

    for (const ep of episodes) {
      const summary = ep.structured_summary as Record<string, unknown> | null;
      const horizonItems = (summary?.on_the_horizon ?? []) as HorizonItem[];
      const creatorName = (ep.pie_creators as { name: string } | null)?.name ?? "Unknown";

      for (const h of horizonItems) {
        const key = h.feature.toLowerCase().trim();
        const source: HorizonSource = {
          creatorName,
          episodeTitle: ep.title,
          publishedAt: ep.published_at,
          why_it_matters: h.why_it_matters,
        };

        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.sources.push(source);
          if (
            ep.published_at &&
            (!existing.latestPublished || ep.published_at > existing.latestPublished)
          ) {
            existing.latestPublished = ep.published_at;
          }
        } else {
          map.set(key, {
            feature: h.feature,
            source: h.source,
            timeline: h.timeline,
            sources: [source],
            latestPublished: ep.published_at,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const tDiff = (TIMELINE_ORDER[a.timeline] ?? 3) - (TIMELINE_ORDER[b.timeline] ?? 3);
      if (tDiff !== 0) return tDiff;
      if (a.latestPublished && b.latestPublished) {
        return b.latestPublished.localeCompare(a.latestPublished);
      }
      return 0;
    });
  }, [episodes]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-8">
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-lg font-semibold text-foreground">On the Horizon</h1>
        <p className="mt-1 font-mono-pie text-xs text-muted-foreground">
          Announced features, upcoming releases, and beta signals from the last 30 days
        </p>
      </header>

      {aggregated.length === 0 ? (
        <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
          No upcoming signals detected yet. Check back after more episodes are processed.
        </p>
      ) : (
        <div className="space-y-3">
          {aggregated.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {item.feature}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${TIMELINE_STYLE[item.timeline] ?? TIMELINE_STYLE.unknown}`}
                    >
                      {item.timeline}
                    </Badge>
                    {item.sources.length > 1 && (
                      <Badge className="text-[10px]">
                        {item.sources.length} sources
                      </Badge>
                    )}
                  </div>
                  <p className="mb-1.5 text-[11px] text-muted-foreground">
                    {item.source}
                  </p>

                  {item.sources.length === 1 ? (
                    <>
                      <p className="font-mono-pie text-xs leading-relaxed text-muted-foreground">
                        {item.sources[0].why_it_matters}
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground/70">
                        {item.sources[0].creatorName} · {item.sources[0].episodeTitle}
                        {item.sources[0].publishedAt && (
                          <> · {format(new Date(item.sources[0].publishedAt), "MMM d")}</>
                        )}
                      </p>
                    </>
                  ) : (
                    <Collapsible>
                      <CollapsibleTrigger className="group flex items-center gap-1 text-[11px] text-primary hover:underline">
                        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                        View all {item.sources.length} mentions
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-3 border-l border-border pl-3">
                          {item.sources.map((src, j) => (
                            <div key={j}>
                              <p className="font-mono-pie text-xs leading-relaxed text-muted-foreground">
                                {src.why_it_matters}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                                {src.creatorName} · {src.episodeTitle}
                                {src.publishedAt && (
                                  <> · {format(new Date(src.publishedAt), "MMM d")}</>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Horizon;
