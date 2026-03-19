import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X } from "lucide-react";

interface IndexEntry {
  text: string;
  section: string;
  episode: string;
  creator: string;
  searchable: string; // lowercased concat for matching
}

type BadgeStyle = "default" | "secondary" | "outline";

const sectionBadge: Record<string, BadgeStyle> = {
  Actionable: "default",
  Build: "default",
  Tool: "secondary",
  Automation: "secondary",
  Summary: "outline",
  "Key Idea": "outline",
  "Mental Model": "outline",
  Quote: "outline",
  "Startup Idea": "outline",
};

function buildIndex(episodes: PieEpisode[]): IndexEntry[] {
  const entries: IndexEntry[] = [];

  for (const ep of episodes) {
    const s = ep.structured_summary as StructuredSummary | null;
    if (!s) continue;
    const creator = ep.pie_creators?.name ?? "Unknown";
    const episode = ep.title;

    const push = (section: string, text: string) => {
      entries.push({
        text,
        section,
        episode,
        creator,
        searchable: `${text} ${episode} ${creator}`.toLowerCase(),
      });
    };

    s.executive_summary?.forEach((t) => push("Summary", t));
    s.key_ideas?.forEach((k) => push("Key Idea", `${k.concept}: ${k.explanation}`));
    s.mental_models?.forEach((m) => push("Mental Model", `${m.model}: ${m.how_applied}`));
    s.actionable_insights?.forEach((t) => push("Actionable", t));
    s.tools_mentioned?.forEach((t) => push("Tool", `${t.name}: ${t.context}`));
    s.automation_opportunities?.forEach((a) => push("Automation", `${a.idea} (${a.complexity})`));
    s.startup_app_ideas?.forEach((i) => push("Startup Idea", `${i.concept}: ${i.why_interesting}`));
    s.notable_quotes?.forEach((t) => push("Quote", t));
    s.build_this_week?.forEach((t) => push("Build", t));
  }

  return entries;
}

function highlightText(text: string, terms: string[]) {
  if (terms.length === 0) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
}

const SearchPage = () => {
  const [query, setQuery] = useState("");

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["pie-search-all"],
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

  const index = useMemo(() => buildIndex(episodes ?? []), [episodes]);

  const terms = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query]
  );

  const results = useMemo(() => {
    if (terms.length === 0) return [];
    return index
      .filter((entry) => terms.every((t) => entry.searchable.includes(t)))
      .slice(0, 50);
  }, [index, terms]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search all processed content…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 font-mono-pie text-sm bg-card border-border"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stats line */}
      {isLoading ? (
        <Skeleton className="h-4 w-48" />
      ) : (
        <p className="text-xs text-muted-foreground">
          {index.length.toLocaleString()} indexed entries across {(episodes?.length ?? 0)} episodes
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && terms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Try{" "}
            {["n8n", "voice cloning", "automation", "API"].map((ex, i) => (
              <span key={ex}>
                {i > 0 && ", "}
                <button
                  onClick={() => setQuery(ex)}
                  className="text-primary hover:underline"
                >
                  "{ex}"
                </button>
              </span>
            ))}
          </p>
        </div>
      )}

      {/* No results */}
      {!isLoading && terms.length > 0 && results.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No results for "{query}"
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="flex items-start gap-3 p-4">
                <Badge
                  variant={sectionBadge[item.section] ?? "outline"}
                  className="shrink-0 text-[10px] font-medium"
                >
                  {item.section}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-mono-pie text-sm text-foreground leading-relaxed">
                    {highlightText(item.text, terms)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground truncate">
                    {item.creator} — {item.episode}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
