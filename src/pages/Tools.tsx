import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, ExternalLink, User } from "lucide-react";

interface ToolRecon {
  id: string;
  tool_name: string;
  website_url: string | null;
  builder_evolution_score: number | null;
  builder_evolution_reason: string | null;
  autonomy_multiplier_score: number | null;
  autonomy_multiplier_reason: string | null;
  emerging_stack_score: number | null;
  emerging_stack_reason: string | null;
  total_score: number | null;
  replaces_or_upgrades: string | null;
  integrations: string[] | null;
  use_cases: string[] | null;
  solo_viable: boolean | null;
  verdict: string | null;
  recon_summary: string | null;
}

function totalScoreColor(score: number): string {
  if (score >= 23) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (score >= 15) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-muted text-muted-foreground border-border";
}

function miniBar(score: number | null, label: string) {
  const s = score ?? 0;
  const pct = (s / 10) * 100;
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="w-8 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${s >= 8 ? "bg-emerald-500" : s >= 5 ? "bg-yellow-500" : "bg-muted-foreground"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-muted-foreground">{s}</span>
    </div>
  );
}

const Tools = () => {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [toolName, setToolName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: tools, isLoading } = useQuery({
    queryKey: ["pie-tool-recon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pie_tool_recon")
        .select("*")
        .order("total_score", { ascending: false });
      if (error) throw error;
      return data as unknown as ToolRecon[];
    },
  });

  const filtered = useMemo(() => {
    if (!tools) return [];
    if (!search.trim()) return tools;
    const q = search.toLowerCase();
    return tools.filter(
      (t) =>
        t.tool_name.toLowerCase().includes(q) ||
        t.integrations?.some((i) => i.toLowerCase().includes(q))
    );
  }, [tools, search]);

  const handleAddTool = async () => {
    if (!toolName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("https://mkidder97.app.n8n.cloud/webhook/pie-tool-recon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: toolName.trim(),
          website_url: websiteUrl.trim() || null,
          source_episode_id: null,
          manually_added: true,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Tool submitted for recon" });
      setToolName("");
      setWebsiteUrl("");
      setAddOpen(false);
    } catch {
      toast({ title: "Error submitting tool", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-mono-pie text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Tool Recon
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter tools or integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Tool for Recon</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs">Tool Name</Label>
                <Input value={toolName} onChange={(e) => setToolName(e.target.value)} placeholder="e.g. Windsurf" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Website URL (optional)</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." className="mt-1" />
              </div>
              <Button onClick={handleAddTool} disabled={submitting || !toolName.trim()} className="w-full">
                {submitting ? "Submitting..." : "Submit for Recon"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center font-mono-pie text-sm text-muted-foreground">
          No tools found.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((tool) => (
            <Card key={tool.id} className="transition-colors hover:bg-accent/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {tool.website_url ? (
                        <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:text-primary flex items-center gap-1">
                          {tool.tool_name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{tool.tool_name}</span>
                      )}
                      {tool.solo_viable && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                          <User className="h-2.5 w-2.5 mr-0.5" />
                          Solo Viable
                        </Badge>
                      )}
                    </div>
                    {tool.replaces_or_upgrades && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">↗ {tool.replaces_or_upgrades}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs font-bold ${totalScoreColor(tool.total_score ?? 0)}`}>
                    {tool.total_score ?? 0}/30
                  </Badge>
                </div>

                <div className="space-y-1 mb-2">
                  {miniBar(tool.builder_evolution_score, "BLD")}
                  {miniBar(tool.autonomy_multiplier_score, "AUT")}
                  {miniBar(tool.emerging_stack_score, "EMG")}
                </div>

                {tool.verdict && (
                  <p className="text-xs italic text-muted-foreground mb-1">{tool.verdict}</p>
                )}
                {tool.recon_summary && (
                  <p className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground mb-2">{tool.recon_summary}</p>
                )}

                {(tool.integrations?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tool.integrations!.map((int, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{int}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tools;
