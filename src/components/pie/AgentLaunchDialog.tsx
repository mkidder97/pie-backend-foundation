import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Save } from "lucide-react";

interface LaunchBuild {
  idea: string;
  episodeTitle: string;
  creatorName: string;
}

interface Props {
  build: LaunchBuild | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildPrompt(b: LaunchBuild) {
  return `You are an expert builder. Here is your mission:

${b.idea}

Context: This idea surfaced from "${b.episodeTitle}" by ${b.creatorName}.

Stack: n8n (mkidder97.app.n8n.cloud), Lovable (React/TypeScript/Tailwind/shadcn), Supabase (PostgreSQL + pgvector + Edge Functions), Claude API (claude-haiku-4-5-20251001).

Constraints: Solo builder, complete in under 8 hours.

Start by asking me any clarifying questions, then outline your build plan before writing any code.`;
}

const AgentLaunchDialog = ({ build, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && build) {
      setTitle(build.idea.slice(0, 60));
      setPrompt(buildPrompt(build));
    }
    onOpenChange(isOpen);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    toast({ title: "Copied!", description: "Paste into Claude Code or a Claude conversation." });
  };

  const handleSaveAndCopy = async () => {
    if (!build) return;
    setSaving(true);
    try {
      await navigator.clipboard.writeText(prompt);
      const { error } = await supabase.from("pie_agent_briefs" as any).insert({
        title,
        prompt,
        category: "build",
        source: `${build.creatorName} — ${build.episodeTitle}`,
      });
      if (error) throw error;
      toast({ title: "Saved to your Agent Briefs library" });
      onOpenChange(false);
    } catch {
      toast({ title: "Error saving brief", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Launch Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title"
            className="text-sm"
          />
          {build && (
            <p className="rounded border border-border bg-muted/50 p-2 font-mono-pie text-[11px] text-muted-foreground">
              ⚡ {build.idea}
            </p>
          )}
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={12}
            className="font-mono-pie text-xs leading-relaxed"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" />
              Copy Agent Brief
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSaveAndCopy} disabled={saving}>
              <Save className="h-3.5 w-3.5" />
              Save & Copy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentLaunchDialog;
