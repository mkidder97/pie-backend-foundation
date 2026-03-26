import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, ExternalLink, Zap } from "lucide-react";
import type { StructuredSummary, ToolMentioned } from "@/types/pie";

interface AggregatedTool {
  name: string;
  url: string | null;
  category: string;
  what_is_new_about_it: string;
  count: number;
}

function aggregateTools(episodes: { structured_summary: unknown }[]): AggregatedTool[] {
  const map = new Map<string, AggregatedTool>();

  for (const ep of episodes) {
    const s = ep.structured_summary as StructuredSummary | null;
    if (!s?.tools_mentioned) continue;
    for (const t of s.tools_mentioned) {
      const key = (t.name || "").toLowerCase();
      if (!key) continue;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (!existing.what_is_new_about_it && t.what_is_new_about_it) {
          existing.what_is_new_about_it = t.what_is_new_about_it;
        }
        if (!existing.url && t.url) existing.url = t.url;
      } else {
        map.set(key, {
          name: t.name,
          url: t.url || null,
          category: t.category || "",
          what_is_new_about_it: t.what_is_new_about_it || "",
          count: 1,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

const Tools = () => {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-episodes-tools-agg"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_episodes")
        .select("structured_summary")
        .eq("status", "completed");
      if (error) throw error;
      return data as { structured_summary: unknown }[];
    },
  });

  const tools = useMemo(() => aggregateTools(episodes ?? []), [episodes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tools;
    const q = search.toLowerCase();
    return tools.filter((t) => t.name.toLowerCase().includes(q));
  }, [tools, search]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Tools Mentioned
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => toast({ title: "Tool recon coming soon" })}
        >
          <Plus className="h-3 w-3" />
          Add Tool
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
          No tools found.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((tool) => (
            <Card key={tool.name} className="transition-colors hover:bg-accent/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tool.url ? (
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-foreground hover:text-primary flex items-center gap-1"
                        >
                          {tool.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{tool.name}</span>
                      )}
                      {tool.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          {tool.category}
                        </Badge>
                      )}
                    </div>
                    {tool.what_is_new_about_it && tool.what_is_new_about_it.length > 0 && (
                      <p className="font-mono-pie text-[10px] text-muted-foreground flex items-start gap-1">
                        <Zap className="h-3 w-3 shrink-0 mt-0.5 text-yellow-500" />
                        {tool.what_is_new_about_it}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {tool.count} ep
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tools;
