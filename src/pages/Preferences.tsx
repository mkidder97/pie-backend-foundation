import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

interface Preference {
  id: string;
  preference_type: string;
  preference_key: string;
  weight: number;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  category: "Category Priorities",
  creator: "Creator Priorities",
  source_type: "Source Type",
  recency: "Recency",
};

const KEY_LABELS: Record<string, string> = {
  stack_watch: "Stack Watch",
  src_tools: "SRC Tools",
  opportunities: "Opportunities",
  finance: "Finance",
  all: "All / General",
  rss: "Newsletter",
  youtube: "YouTube",
  last_24h: "Last 24 Hours",
  last_7d: "Last 7 Days",
  last_30d: "Last 30 Days",
  older: "Older",
};

const TYPE_ORDER = ["category", "creator", "source_type", "recency"];

const Preferences = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<string | null>(null);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["pie-user-preferences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_user_preferences")
        .select("*")
        .order("weight", { ascending: false });
      if (error) throw error;
      return data as unknown as Preference[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ type, key, weight }: { type: string; key: string; weight: number }) => {
      const { error } = await supabase
        .from("pie_user_preferences")
        .update({ weight } as any)
        .eq("preference_type", type)
        .eq("preference_key", key);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pie-user-preferences"] });
      const id = `${variables.type}-${variables.key}`;
      setSaved(id);
      toast({ title: "Saved ✓" });
      setTimeout(() => setSaved(null), 1500);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const grouped = new Map<string, Preference[]>();
  for (const p of prefs ?? []) {
    const arr = grouped.get(p.preference_type) ?? [];
    arr.push(p);
    grouped.set(p.preference_type, arr);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Preferences
      </h1>

      {TYPE_ORDER.map((type) => {
        const items = grouped.get(type);
        if (!items?.length) return null;

        return (
          <section key={type}>
            <h2 className="font-mono-pie text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {TYPE_LABELS[type] ?? type}
            </h2>
            <div className="space-y-3">
              {items.map((p) => {
                const id = `${p.preference_type}-${p.preference_key}`;
                const label = KEY_LABELS[p.preference_key] ?? p.preference_key;
                return (
                  <div key={p.id} className="rounded border border-border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-foreground min-w-0 flex-1 truncate">
                        {label}
                      </span>
                      <div className="w-32 sm:w-48">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[p.weight]}
                          onValueCommit={(val) => {
                            updateMutation.mutate({ type: p.preference_type, key: p.preference_key, weight: val[0] });
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono-pie text-muted-foreground w-8 text-right shrink-0">
                        {saved === id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 inline" />
                        ) : (
                          `${p.weight}/10`
                        )}
                      </span>
                    </div>
                    {p.notes && (
                      <p className="mt-1 text-[10px] text-muted-foreground">{p.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Preferences;
