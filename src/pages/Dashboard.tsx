import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PieEpisode, StructuredSummary, ToolMentioned, AutomationOpportunity, HorizonItem } from "@/types/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Lightbulb, Zap, Wrench, Radar } from "lucide-react";
import { subDays } from "date-fns";

const now = () => new Date();

const usePieEpisodes = (daysAgo: number, queryKey: string) =>
  useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const since = subDays(now(), daysAgo).toISOString();
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("id, title, source_url, source_type, published_at, status, structured_summary, creator_id, pie_creators(name)")
        .eq("status", "completed")
        .gte("published_at", since)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PieEpisode[];
    },
  });

// --- Stats helpers ---
function countBuildIdeas(episodes: PieEpisode[]) {
  return episodes.reduce((sum, ep) => {
    const s = ep.structured_summary as StructuredSummary | null;
    return sum + (s?.build_this_week?.length ?? 0);
  }, 0);
}

function countAutomations(episodes: PieEpisode[]) {
  return episodes.reduce((sum, ep) => {
    const s = ep.structured_summary as StructuredSummary | null;
    return sum + (s?.automation_opportunities?.length ?? 0);
  }, 0);
}

function countUniqueTools(episodes: PieEpisode[]) {
  const names = new Set<string>();
  episodes.forEach((ep) => {
    const s = ep.structured_summary as StructuredSummary | null;
    s?.tools_mentioned?.forEach((t) => names.add(t.name.toLowerCase()));
  });
  return names.size;
}

// --- "What Matters" uses actionable_insights from 14d ---
interface InsightItem {
  text: string;
  creator: string;
  episode: string;
}

function extractInsights(episodes: PieEpisode[], limit = 5): InsightItem[] {
  const items: InsightItem[] = [];
  for (const ep of episodes) {
    const s = ep.structured_summary as StructuredSummary | null;
    const creator = ep.pie_creators?.name ?? "Unknown";
    s?.actionable_insights?.forEach((text) =>
      items.push({ text, creator, episode: ep.title })
    );
  }
  return items.slice(0, limit);
}

// --- Coming Soon: top on_the_horizon from 7d ---
interface ComingSoonItem {
  feature: string;
  timeline: HorizonItem["timeline"];
  why_it_matters: string;
  creator: string;
}

const TIMELINE_ORDER: Record<string, number> = { days: 0, weeks: 1, months: 2, unknown: 3 };
const TIMELINE_STYLE: Record<string, string> = {
  days: "border-rose-500/40 text-rose-400",
  weeks: "border-yellow-500/40 text-yellow-400",
  months: "border-emerald-500/40 text-emerald-400",
  unknown: "border-muted-foreground/40 text-muted-foreground",
};

function extractComingSoon(episodes: PieEpisode[], limit = 3): ComingSoonItem[] {
  const items: ComingSoonItem[] = [];
  for (const ep of episodes) {
    const s = ep.structured_summary as StructuredSummary | null;
    const creator = ep.pie_creators?.name ?? "Unknown";
    s?.on_the_horizon?.forEach((h) =>
      items.push({ feature: h.feature, timeline: h.timeline, why_it_matters: h.why_it_matters, creator })
    );
  }
  items.sort((a, b) => (TIMELINE_ORDER[a.timeline] ?? 3) - (TIMELINE_ORDER[b.timeline] ?? 3));
  return items.slice(0, limit);
}

// --- Trending tools ---
interface TrendingTool {
  name: string;
  count: number;
  latestContext: string;
}

function extractTrendingTools(episodes: PieEpisode[], limit = 8): TrendingTool[] {
  const map = new Map<string, { count: number; latestContext: string; latestDate: string }>();

  for (const ep of episodes) {
    const s = ep.structured_summary as StructuredSummary | null;
    s?.tools_mentioned?.forEach((t: ToolMentioned) => {
      const key = t.name.toLowerCase();
      const existing = map.get(key);
      const pubDate = ep.published_at ?? "";
      if (!existing) {
        map.set(key, { count: 1, latestContext: t.context, latestDate: pubDate });
      } else {
        existing.count++;
        if (pubDate > existing.latestDate) {
          existing.latestContext = t.context;
          existing.latestDate = pubDate;
        }
      }
    });
  }

  return Array.from(map.entries())
    .map(([name, v]) => ({ name, count: v.count, latestContext: v.latestContext }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// --- Stat card ---
function StatCard({ icon: Icon, value, label, loading }: { icon: React.ElementType; value: number; label: string; loading: boolean }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          {loading ? (
            <Skeleton className="h-7 w-10 mb-1" />
          ) : (
            <p className="font-mono-pie text-2xl font-bold text-foreground">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main ---
const Dashboard = () => {
  const { data: recent14d, isLoading: loading14d } = usePieEpisodes(14, "pie-dashboard-14d");
  const { data: recent7d, isLoading: loading7d } = usePieEpisodes(7, "pie-dashboard-7d");

  const ep14d = recent14d ?? [];
  const ep7d = recent7d ?? [];

  const insights = extractInsights(ep14d, 5);
  const trending = extractTrendingTools(ep7d);
  const comingSoon = extractComingSoon(ep7d, 3);

  const isEmpty = !loading14d && !loading7d && ep14d.length === 0 && ep7d.length === 0;

  return (
    <div className="space-y-8">
      {/* Section 1: Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Clock} value={ep14d.length} label="Episodes (14d)" loading={loading14d} />
        <StatCard icon={Lightbulb} value={countBuildIdeas(ep7d)} label="Build Ideas (7d)" loading={loading7d} />
        <StatCard icon={Zap} value={countAutomations(ep7d)} label="Automations (7d)" loading={loading7d} />
        <StatCard icon={Wrench} value={countUniqueTools(ep7d)} label="Tools Tracked (7d)" loading={loading7d} />
      </div>

      {isEmpty && (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No completed episodes yet. Your morning briefing will appear here once episodes are processed.</p>
          </CardContent>
        </Card>
      )}

      {/* Section 2: What Matters Right Now */}
      {(loading14d || insights.length > 0) && (
        <section>
          <h2 className="font-mono-pie text-sm font-bold text-foreground mb-3 tracking-wide">
            What Matters Right Now
          </h2>
          {loading14d ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((item, i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-4">
                    <p className="font-mono-pie text-sm text-foreground leading-relaxed">{item.text}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground truncate">
                      {item.creator} — {item.episode}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Section 3: Trending Tools */}
      {(loading7d || trending.length > 0) && (
        <section>
          <h2 className="font-mono-pie text-sm font-bold text-foreground mb-3 tracking-wide">
            Trending Tools This Week
          </h2>
          {loading7d ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {trending.map((tool) => (
                <Card key={tool.name} className="border-border bg-card">
                  <CardContent className="flex items-start gap-3 p-3">
                    <Badge variant="secondary" className="shrink-0 font-mono-pie text-[10px]">
                      {tool.count}x
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground capitalize">{tool.name}</p>
                      <p className="font-mono-pie text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {tool.latestContext}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Section 4: Coming Soon */}
      {comingSoon.length > 0 && (
        <section>
          <h2 className="font-mono-pie text-sm font-bold text-foreground mb-3 tracking-wide flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            Coming Soon
          </h2>
          <div className="space-y-2">
            {comingSoon.map((item, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{item.feature}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${TIMELINE_STYLE[item.timeline] ?? TIMELINE_STYLE.unknown}`}
                    >
                      {item.timeline}
                    </Badge>
                  </div>
                  <p className="font-mono-pie text-xs text-muted-foreground leading-relaxed">
                    {item.why_it_matters}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{item.creator}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
