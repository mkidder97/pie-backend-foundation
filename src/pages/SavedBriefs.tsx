import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  build: "border-emerald-500/40 text-emerald-400",
  relay: "border-blue-500/40 text-blue-400",
  monitor: "border-amber-500/40 text-amber-400",
};

const SavedBriefs = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: briefs, isLoading } = useQuery({
    queryKey: ["pie-agent-briefs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_agent_briefs" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const handleCopy = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    toast({ title: "Copied to clipboard" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this agent brief?")) return;
    const { error } = await supabase.from("pie_agent_briefs" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["pie-agent-briefs"] });
    toast({ title: "Brief deleted" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono-pie text-lg font-bold text-foreground">Agent Briefs</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Your library of saved agent missions
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !briefs?.length ? (
        <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
          No saved briefs yet. Launch an agent from the Feed or Relay tabs to save your first brief.
        </p>
      ) : (
        <div className="space-y-3">
          {briefs.map((b: any) => (
            <Card key={b.id} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{b.title}</h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${categoryColors[b.category] ?? "border-muted-foreground/40 text-muted-foreground"}`}
                      >
                        {b.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {b.created_at && <span>{format(new Date(b.created_at), "MMM d, yyyy")}</span>}
                      {b.source && <span>· {b.source}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleCopy(b.prompt)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedBriefs;
