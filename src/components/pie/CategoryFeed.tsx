import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Zap } from "lucide-react";
import EpisodeDetail from "@/components/pie/EpisodeDetail";
import AgentLaunchDialog from "@/components/pie/AgentLaunchDialog";
import { getSourceBadge } from "@/pages/Feed";

interface Props {
  category: string | null;
}

const BAD_PHRASES = [
  "no transcript", "unable to extract", "no relevance",
  "cannot extract", "no substantive", "transcript contains",
  "metadata only",
];

function getTopScore(s: StructuredSummary): number {
  let max = 0;
  for (const item of s.builder_evolution ?? []) if (item.score > max) max = item.score;
  for (const item of s.autonomy_multiplier ?? []) if (item.score > max) max = item.score;
  for (const item of s.emerging_stack ?? []) if (item.score > max) max = item.score;
  return max;
}

function scoreColor(score: number): string {
  if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (score >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-muted text-muted-foreground border-border";
}

const CategoryFeed = ({ category }: Props) => {
  const [selected, setSelected] = useState<PieEpisode | null>(null);
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

  const filtered = episodes?.filter((ep) => {
    const s = ep.structured_summary as StructuredSummary | null;
    if (!s) return false;
    const summary = s.executive_summary;
    if (!summary?.length) return false;
    const first = summary[0]?.toLowerCase() ?? "";
    return !BAD_PHRASES.some((phrase) => first.includes(phrase));
  });

  const toggleBuilds = (id: string) => {
    setExpandedBuilds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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

  return (
    <>
      <div className="space-y-3">
        {filtered?.map((ep) => {
          const s = ep.structured_summary as StructuredSummary | null;
          const firstBullet = s?.executive_summary?.[0];
          const builds = s?.build_this_week ?? [];
          const topScore = s ? getTopScore(s) : 0;
          const badge = getSourceBadge(ep);
          const isExpanded = expandedBuilds.has(ep.id);

          return (
            <Card key={ep.id} className="transition-colors hover:bg-accent/50">
              <CardContent className="p-4">
                <div className="cursor-pointer" onClick={() => setSelected(ep)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2 flex-wrap">
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
                      <h3 className="mb-1 text-sm font-semibold leading-snug text-foreground">
                        {ep.title}
                      </h3>
                      {s?.key_insight && (
                        <p className="mb-1.5 text-xs italic text-muted-foreground leading-relaxed">
                          {s.key_insight}
                        </p>
                      )}
                      {firstBullet && (
                        <p className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground">
                          <span className="mr-1.5 text-primary">→</span>
                          {firstBullet}
                        </p>
                      )}
                    </div>
                    {topScore > 0 && (
                      <Badge variant="outline" className={`shrink-0 text-[10px] gap-0.5 ${scoreColor(topScore)}`}>
                        <Zap className="h-2.5 w-2.5" />
                        {topScore}/10
                      </Badge>
                    )}
                  </div>
                </div>

                {builds.length > 0 && (
                  <div className="mt-3 border-t border-border pt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBuilds(ep.id); }}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      Build This Week ({builds.length})
                    </button>
                    {isExpanded && (
                      <ul className="mt-1.5 space-y-1 ml-4">
                        {builds.map((b, i) => (
                          <li key={i} className="flex items-center justify-between gap-2 font-mono-pie text-[11px] leading-relaxed text-muted-foreground">
                            <span>
                              <span className="mr-1.5 text-primary">⚡</span>
                              {b.what}
                            </span>
                            <Badge variant="outline" className="shrink-0 text-[10px] text-emerald-400 border-emerald-500/40">
                              ~{b.estimated_hours}h
                            </Badge>
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

      <AgentLaunchDialog
        build={launchBuild}
        open={!!launchBuild}
        onOpenChange={(open) => !open && setLaunchBuild(null)}
      />
    </>
  );
};

export default CategoryFeed;
