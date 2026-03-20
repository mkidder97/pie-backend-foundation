import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";
import type { HorizonItem, IndustryShift, StructuredSummary, PieEpisode } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const TIMELINE_ORDER: Record<string, number> = { days: 0, weeks: 1, months: 2, unknown: 3 };
const TIMELINE_STYLE: Record<string, string> = {
  days: "border-rose-500/40 text-rose-400",
  weeks: "border-yellow-500/40 text-yellow-400",
  months: "border-emerald-500/40 text-emerald-400",
  unknown: "border-muted-foreground/40 text-muted-foreground",
};

interface HorizonEntry {
  feature: string;
  timeline: HorizonItem["timeline"];
  why_it_matters: string;
  creatorName: string;
  episodeTitle: string;
}

interface ShiftEntry {
  shift: string;
  evidence: string;
}

interface Props {
  category: string | null;
}

const CategorySignals = ({ category }: Props) => {
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30).toISOString(), []);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-signals", category, thirtyDaysAgo],
    queryFn: async () => {
      let query = supabase
        .from("pie_episodes")
        .select("title, published_at, structured_summary, pie_creators(name, category)")
        .eq("status", "completed")
        .gte("published_at", thirtyDaysAgo)
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("pie_creators.category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data;
      if (category) {
        results = results.filter((ep: any) => ep.pie_creators !== null);
      }
      return results;
    },
  });

  const { horizonItems, shiftItems } = useMemo(() => {
    const horizonItems: HorizonEntry[] = [];
    const shiftItems: ShiftEntry[] = [];

    if (!episodes) return { horizonItems, shiftItems };

    for (const ep of episodes) {
      const s = ep.structured_summary as StructuredSummary | null;
      const creatorName = (ep.pie_creators as any)?.name ?? "Unknown";

      for (const h of s?.on_the_horizon ?? []) {
        horizonItems.push({
          feature: h.feature,
          timeline: h.timeline,
          why_it_matters: h.why_it_matters,
          creatorName,
          episodeTitle: ep.title,
        });
      }

      for (const shift of s?.industry_shifts ?? []) {
        shiftItems.push({ shift: shift.shift, evidence: shift.evidence });
      }
    }

    horizonItems.sort((a, b) => (TIMELINE_ORDER[a.timeline] ?? 3) - (TIMELINE_ORDER[b.timeline] ?? 3));

    return { horizonItems, shiftItems };
  }, [episodes]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const isEmpty = horizonItems.length === 0 && shiftItems.length === 0;

  if (isEmpty) {
    return (
      <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
        No signals detected in this category for the last 30 days.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* On the Horizon */}
      {horizonItems.length > 0 && (
        <section>
          <h2 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            On the Horizon
          </h2>
          <div className="space-y-2">
            {horizonItems.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">{item.feature}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${TIMELINE_STYLE[item.timeline] ?? TIMELINE_STYLE.unknown}`}
                  >
                    {item.timeline}
                  </Badge>
                </div>
                <p className="font-mono-pie text-xs leading-relaxed text-muted-foreground">
                  {item.why_it_matters}
                </p>
                <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                  {item.creatorName} · {item.episodeTitle}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Industry Shifts */}
      {shiftItems.length > 0 && (
        <section>
          <h2 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Industry Shifts
          </h2>
          <div className="space-y-2">
            {shiftItems.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{item.shift}</p>
                <p className="mt-1 font-mono-pie text-xs leading-relaxed text-muted-foreground">
                  {item.evidence}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CategorySignals;
