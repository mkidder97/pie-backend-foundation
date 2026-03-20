import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EpisodeDetail from "@/components/pie/EpisodeDetail";

type SourceFilter = "all" | "youtube" | "rss";

export function getSourceBadge(episode: Pick<PieEpisode, "source_type" | "pie_creators">) {
  const creatorName = episode.pie_creators?.name ?? "";
  const isChangelog = /news|blog|changelog/i.test(creatorName);

  if (isChangelog && episode.source_type === "rss") {
    return { label: "Changelog", className: "border-purple-500/40 text-purple-400" };
  }
  if (episode.source_type === "youtube") {
    return { label: "Video", className: "border-rose-500/40 text-rose-400" };
  }
  return { label: "Newsletter", className: "border-blue-500/40 text-blue-400" };
}

const Feed = () => {
  const [selected, setSelected] = useState<PieEpisode | null>(null);
  const [filter, setFilter] = useState<SourceFilter>("all");

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-episodes-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("id, title, source_url, source_type, published_at, status, structured_summary, creator_id, pie_creators(name)")
        .eq("status", "completed")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PieEpisode[];
    },
  });

  const filtered = episodes?.filter((ep) => {
    if (filter === "all") return true;
    return ep.source_type === filter;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!episodes?.length) {
    return (
      <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
        No completed episodes yet.
      </p>
    );
  }

  const filters: { value: SourceFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "youtube", label: "Video" },
    { value: "rss", label: "Newsletter" },
  ];

  return (
    <>
      <div className="mb-4 flex gap-1">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            className="h-7 px-3 text-xs"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered?.map((ep) => {
          const s = ep.structured_summary as StructuredSummary | null;
          const summary = s?.executive_summary?.slice(0, 3) ?? [];
          const buildCount = s?.build_this_week?.length ?? 0;
          const badge = getSourceBadge(ep);

          return (
            <Card
              key={ep.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setSelected(ep)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {ep.pie_creators?.name ?? "Unknown"}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
                        {badge.label}
                      </Badge>
                      {ep.published_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(ep.published_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground">
                      {ep.title}
                    </h3>
                    {summary.length > 0 && (
                      <ul className="space-y-0.5">
                        {summary.map((line, i) => (
                          <li key={i} className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground">
                            <span className="mr-1.5 text-primary">→</span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {buildCount > 0 && (
                    <Badge className="shrink-0 text-[10px]">
                      {buildCount} build{buildCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EpisodeDetail
        episode={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
};

export default Feed;
