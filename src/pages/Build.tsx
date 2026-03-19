import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Skeleton } from "@/components/ui/skeleton";

interface BuildItem {
  creator: string;
  episodeTitle: string;
  item: string;
}

const Build = () => {
  const { data: grouped, isLoading } = useQuery({
    queryKey: ["pie-build"],
    queryFn: async () => {
      const since = subDays(new Date(), 14).toISOString();
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("title, structured_summary, pie_creators(name)")
        .eq("status", "completed")
        .gte("published_at", since)
        .order("published_at", { ascending: false });
      if (error) throw error;

      const items: BuildItem[] = [];
      for (const ep of data as unknown as PieEpisode[]) {
        const s = ep.structured_summary as StructuredSummary | null;
        const builds = s?.build_this_week ?? [];
        for (const b of builds) {
          items.push({
            creator: ep.pie_creators?.name ?? "Unknown",
            episodeTitle: ep.title,
            item: b,
          });
        }
      }

      const map = new Map<string, BuildItem[]>();
      for (const item of items) {
        const arr = map.get(item.creator) ?? [];
        arr.push(item);
        map.set(item.creator, arr);
      }
      return map;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!grouped || grouped.size === 0) {
    return (
      <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
        No build items from the last 14 days.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Build This Week — Last 14 Days
      </h1>
      {Array.from(grouped.entries()).map(([creator, items]) => (
        <div key={creator}>
          <h2 className="mb-3 text-sm font-semibold text-foreground">{creator}</h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded border border-border bg-card p-3">
                <p className="font-mono-pie text-xs leading-relaxed text-foreground">
                  <span className="mr-1.5 text-primary">→</span>
                  {item.item}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">{item.episodeTitle}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Build;
