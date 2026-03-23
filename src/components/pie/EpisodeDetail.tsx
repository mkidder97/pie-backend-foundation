import { ExternalLink, Zap, Star } from "lucide-react";
import type { PieEpisode, StructuredSummary } from "@/types/pie";
import { getSourceBadge } from "@/pages/Feed";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface EpisodeDetailProps {
  episode: PieEpisode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function scoreColor(score: number): string {
  if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (score >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-muted text-muted-foreground border-border";
}

const timelineColors: Record<string, string> = {
  days: "border-rose-500/40 text-rose-400",
  weeks: "border-yellow-500/40 text-yellow-400",
  months: "border-emerald-500/40 text-emerald-400",
  unknown: "border-muted-foreground/40 text-muted-foreground",
};

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-mono-pie text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-6">
    {children}
  </h3>
);

const EpisodeDetail = ({ episode, open, onOpenChange }: EpisodeDetailProps) => {
  if (!episode) return null;

  const s: StructuredSummary = episode.structured_summary ?? { executive_summary: [] };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-4">
          <SheetDescription className="flex items-center gap-2 text-xs text-muted-foreground">
            {episode.pie_creators?.name}
            {(() => {
              const badge = getSourceBadge(episode);
              return (
                <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
                  {badge.label}
                </Badge>
              );
            })()}
          </SheetDescription>
          <SheetTitle className="text-base font-semibold leading-snug">
            {episode.title}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-0">
          {/* Key Insight */}
          {s.key_insight && (
            <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-500/10 p-3 mb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Key Insight</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-foreground">{s.key_insight}</p>
            </div>
          )}

          {/* Executive Summary */}
          {s.executive_summary.length > 0 && (
            <>
              <SectionHeader>Executive Summary</SectionHeader>
              <ul className="space-y-1.5">
                {s.executive_summary.map((item, i) => (
                  <li key={i} className="font-mono-pie text-xs leading-relaxed text-foreground">
                    <span className="mr-2 text-primary">→</span>{item}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Builder Evolution */}
          {(s.builder_evolution?.length ?? 0) > 0 && (
            <>
              <SectionHeader>Builder Evolution</SectionHeader>
              <div className="space-y-2">
                {s.builder_evolution!.map((item, i) => (
                  <div key={i} className="rounded border border-border bg-card p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.tool_or_pattern}</span>
                      <Badge variant="outline" className={`text-[10px] ${scoreColor(item.score)}`}>
                        {item.score}/10
                      </Badge>
                    </div>
                    {item.replaces_or_upgrades && (
                      <p className="text-[11px] text-muted-foreground">↗ {item.replaces_or_upgrades}</p>
                    )}
                    <p className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground mt-0.5">{item.why_it_matters}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Autonomy Multiplier */}
          {(s.autonomy_multiplier?.length ?? 0) > 0 && (
            <>
              <SectionHeader>Autonomy Multiplier</SectionHeader>
              <div className="space-y-2">
                {s.autonomy_multiplier!.map((item, i) => (
                  <div key={i} className="rounded border border-border bg-card p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.idea}</span>
                      <Badge variant="outline" className={`text-[10px] ${scoreColor(item.score)}`}>
                        {item.score}/10
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">⚡ {item.steps_removed}</p>
                    <p className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground mt-0.5">{item.current_friction_eliminated}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Emerging Stack */}
          {(s.emerging_stack?.length ?? 0) > 0 && (
            <>
              <SectionHeader>Emerging Stack</SectionHeader>
              <div className="space-y-2">
                {s.emerging_stack!.map((item, i) => (
                  <div key={i} className="rounded border border-border bg-card p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.tool_or_method}</span>
                      <Badge variant="outline" className={`text-[10px] ${scoreColor(item.score)}`}>
                        {item.score}/10
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Adopted by: {item.who_is_adopting}</p>
                    <p className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground mt-0.5">{item.why_ahead}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Build This Week */}
          {(s.build_this_week?.length ?? 0) > 0 && (
            <>
              <SectionHeader>Build This Week</SectionHeader>
              <div className="space-y-2">
                {s.build_this_week!.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{item.what}</p>
                      <p className="text-[11px] text-muted-foreground">{item.why_now}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] text-emerald-400 border-emerald-500/40">
                      ~{item.estimated_hours}h
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Tools Mentioned */}
          {(s.tools_mentioned?.length ?? 0) > 0 && (
            <>
              <SectionHeader>Tools Mentioned</SectionHeader>
              <div className="flex flex-wrap gap-1.5">
                {s.tools_mentioned!.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="secondary" className="text-[10px] hover:bg-accent cursor-pointer">
                          {t.name}
                        </Badge>
                      </a>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">{t.name}</Badge>
                    )}
                    {t.recon_worthy && (
                      <Star className="h-3 w-3 text-orange-400 fill-orange-400" />
                    )}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* On the Horizon */}
          {(s.on_the_horizon?.length ?? 0) > 0 && (
            <>
              <SectionHeader>On the Horizon</SectionHeader>
              <div className="space-y-3">
                {s.on_the_horizon!.map((h, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{h.feature}</p>
                      <Badge variant="outline" className={`text-[10px] ${timelineColors[h.timeline] ?? timelineColors.unknown}`}>
                        {h.timeline}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{h.source}</p>
                    <p className="mt-0.5 font-mono-pie text-xs text-muted-foreground">{h.why_it_matters}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <a
            href={episode.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View source
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EpisodeDetail;
