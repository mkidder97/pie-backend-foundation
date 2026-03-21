import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, Play } from "lucide-react";
import EpisodeDetail from "@/components/pie/EpisodeDetail";
import AgentLaunchDialog from "@/components/pie/AgentLaunchDialog";
import { getSourceBadge } from "@/pages/Feed";

type SourceFilter = "all" | "youtube" | "rss";

interface Props {
  category: string | null;
}

const CategoryFeed = ({ category }: Props) => {
  const [selected, setSelected] = useState<PieEpisode | null>(null);
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [expandedBuilds, setExpandedBuilds] = useState<Set<string>>(new Set());
  const [launchBuild, setLaunchBuild] = useState<{ idea: string; episodeTitle: string; creatorName: string } | null>(null);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-category-feed", category],
    queryFn: async () => {
      let query = supabase
        .from("pie_episodes")
        .select("id, title, source_url, source_type, published_at, status, structured_summary, creator_id, pie_creators!inner(name, category)")
        .eq("status", "completed")
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("pie_creators.category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as unknown as PieEpisode[];
    },
  });

  const filtered = episodes
    ?.filter((ep) => {
      const s = ep.structured_summary as StructuredSummary | null;
      if (!s) return false;
      const summary = s.executive_summary;
      if (!summary?.length) return false;
      const first = summary[0]?.toLowerCase() ?? "";
      if (first.includes("no transcript")) return false;
      if (first.includes("unable to extract")) return false;
      return true;
    })
    .filter((ep) => {
      if (filter === "all") return true;
      return ep.source_type === filter;
    });

  const toggleBuilds = (id: string) => {
    setExpandedBuilds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        No completed episodes in this category.
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
          const builds = s?.build_this_week ?? [];
          const buildCount = builds.length;
          const badge = getSourceBadge(ep);
          const isExpanded = expandedBuilds.has(ep.id);

          return (
            <Card
              key={ep.id}
              className="transition-colors hover:bg-accent/50"
            >
              <CardContent className="p-4">
                <div
                  className="cursor-pointer"
                  onClick={() => setSelected(ep)}
                >
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
                </div>

                {/* Build items inline */}
                {buildCount > 0 && (
                  <div className="mt-3 border-t border-border pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBuilds(ep.id);
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                      Build This Week ({buildCount})
                    </button>
                    {isExpanded && (
                      <ul className="mt-1.5 space-y-1 ml-4">
                        {builds.map((b, i) => (
                          <li key={i} className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground">
                            <span className="mr-1.5 text-primary">⚡</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
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

export default CategoryFeed;
