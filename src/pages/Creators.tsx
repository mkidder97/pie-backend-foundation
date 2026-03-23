import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { User, Video, Rss, Lightbulb, Hammer } from "lucide-react";
import { format } from "date-fns";

interface Creator {
  id: string;
  name: string;
  source_type: string;
  active: boolean | null;
}

interface CreatorStats {
  creator: Creator;
  episodeCount: number;
  insights: number;
  builds: number;
  topTools: { name: string; count: number }[];
  latestDate: string | null;
  episodes: PieEpisode[];
}

function computeStats(creators: Creator[], episodes: PieEpisode[]): CreatorStats[] {
  return creators.map((c) => {
    const eps = episodes.filter((ep) => ep.creator_id === c.id);
    let insights = 0, builds = 0;
    const toolMap = new Map<string, number>();
    let latestDate: string | null = null;

    for (const ep of eps) {
      const s = ep.structured_summary as StructuredSummary | null;
      if (!s) continue;
      insights += (s.builder_evolution?.length ?? 0) + (s.autonomy_multiplier?.length ?? 0) + (s.emerging_stack?.length ?? 0);
      builds += s.build_this_week?.length ?? 0;
      s.tools_mentioned?.forEach((t) => {
        const key = t.name.toLowerCase();
        toolMap.set(key, (toolMap.get(key) ?? 0) + 1);
      });
      if (ep.published_at && (!latestDate || ep.published_at > latestDate)) {
        latestDate = ep.published_at;
      }
    }

    const topTools = Array.from(toolMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { creator: c, episodeCount: eps.length, insights, builds, topTools, latestDate, episodes: eps };
  }).sort((a, b) => b.episodeCount - a.episodeCount);
}

function SourceBadge({ type }: { type: string }) {
  if (type === "youtube") return <Badge variant="outline" className="text-[10px] gap-1 border-rose-500/40 text-rose-400"><Video className="h-3 w-3" />Video</Badge>;
  if (type === "rss") return <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/40 text-blue-400"><Rss className="h-3 w-3" />Newsletter</Badge>;
  return <Badge variant="outline" className="text-[10px]">Both</Badge>;
}

const Creators = () => {
  const [selected, setSelected] = useState<CreatorStats | null>(null);

  const { data: creators, isLoading: loadingCreators } = useQuery({
    queryKey: ["pie-creators-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_creators")
        .select("id, name, source_type, active")
        .order("name");
      if (error) throw error;
      return data as Creator[];
    },
  });

  const { data: episodes, isLoading: loadingEps } = useQuery({
    queryKey: ["pie-episodes-all-creators"],
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

  const isLoading = loadingCreators || loadingEps;
  const stats = useMemo(() => computeStats(creators ?? [], episodes ?? []), [creators, episodes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono-pie text-lg font-bold text-foreground">Creators</h1>
        {!isLoading && (
          <p className="text-xs text-muted-foreground mt-1">
            {stats.length} creators tracked — tap for episode history
          </p>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && stats.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No creators configured yet.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && stats.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stats.map((s) => (
            <Card
              key={s.creator.id}
              className="border-border bg-card cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setSelected(s)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{s.creator.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SourceBadge type={s.creator.source_type} />
                    <Badge variant="outline" className="text-[10px]">{s.episodeCount} ep</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" />{s.insights} insights</span>
                  <span className="flex items-center gap-1"><Hammer className="h-3 w-3" />{s.builds} builds</span>
                </div>

                {s.topTools.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.topTools.map((t) => (
                      <span key={t.name} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}

                {s.latestDate && (
                  <p className="text-[11px] text-muted-foreground">
                    Latest: {format(new Date(s.latestDate), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-border bg-background">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono-pie text-foreground">{selected.creator.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {selected.episodes.slice(0, 20).map((ep) => {
                  const s = ep.structured_summary as StructuredSummary | null;
                  const tools = s?.tools_mentioned?.slice(0, 3) ?? [];
                  return (
                    <Card key={ep.id} className="border-border bg-card">
                      <CardContent className="p-3 space-y-1.5">
                        <p className="text-sm font-medium text-foreground leading-snug">{ep.title}</p>
                        {ep.published_at && (
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(ep.published_at), "MMM d, yyyy")}
                          </p>
                        )}
                        {s?.executive_summary?.[0] && (
                          <p className="font-mono-pie text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {s.executive_summary[0]}
                          </p>
                        )}
                        {tools.length > 0 && (
                          <div className="flex gap-1 pt-0.5">
                            {tools.map((t) => (
                              <Badge key={t.name} variant="outline" className="text-[9px]">{t.name}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Creators;
