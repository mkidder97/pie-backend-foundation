import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EpisodeDetail from "@/components/pie/EpisodeDetail";

const Feed = () => {
  const [selected, setSelected] = useState<PieEpisode | null>(null);

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

  return (
    <>
      <div className="space-y-3">
        {episodes.map((ep) => {
          const s = ep.structured_summary as StructuredSummary | null;
          const summary = s?.executive_summary?.slice(0, 3) ?? [];
          const buildCount = s?.build_this_week?.length ?? 0;

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
                      <Badge variant="outline" className="text-[10px]">
                        {ep.source_type === "youtube" ? "YouTube" : "RSS"}
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
