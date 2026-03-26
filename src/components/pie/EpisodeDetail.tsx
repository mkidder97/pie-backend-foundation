import { ExternalLink, Zap, Star, Wrench } from "lucide-react";
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

const MiniLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`text-[9px] font-semibold uppercase tracking-wider ${className}`}>{children}</span>
);

const BeforeAfterBlock = ({ before, after }: { before: string; after: string }) => (
  <div className="space-y-1 mt-2">
    <div className="border-l-2 border-rose-500/40 pl-2">
      <MiniLabel className="text-rose-400">Before</MiniLabel>
      <p className="text-[11px] text-muted-foreground">{before}</p>
    </div>
    <div className="border-l-2 border-emerald-500/40 pl-2">
      <MiniLabel className="text-emerald-400">After</MiniLabel>
      <p className="text-[11px] text-emerald-400">{after}</p>
    </div>
  </div>
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

                    {item.what_is_new && (
                      <div className="border-l-4 border-emerald-500 bg-emerald-500/10 p-2 mt-2 rounded-sm">
                        <MiniLabel className="text-emerald-400">What Is New</MiniLabel>
                        <p className="text-[11px] text-foreground mt-0.5">{item.what_is_new}</p>
                      </div>
                    )}

                    {item.workflow_breakdown && (
                      <div className="mt-2 border border-border rounded p-2 bg-muted/30">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          <MiniLabel className="text-muted-foreground">How To Implement</MiniLabel>
                        </div>
                        <ol className="list-decimal list-inside space-y-0.5">
                          {item.workflow_breakdown.workflow_steps.map((step, si) => (
                            <li key={si} className="text-[11px] text-foreground">{step}</li>
                          ))}
                        </ol>
                        <BeforeAfterBlock
                          before={item.workflow_breakdown.before_state}
                          after={item.workflow_breakdown.after_state}
                        />
                        {item.workflow_breakdown.tools_required.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.workflow_breakdown.tools_required.map((tool, ti) => (
                              <Badge key={ti} variant="secondary" className="text-[9px]">{tool}</Badge>
                            ))}
                          </div>
                        )}
                        <Badge variant="outline" className="text-[9px] mt-1.5 border-emerald-500/40 text-emerald-400">
                          ~{item.workflow_breakdown.setup_time_hours}h setup
                        </Badge>
                      </div>
                    )}
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(item.time_saved_per_week_hours ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                            saves ~{item.time_saved_per_week_hours}h/week
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${scoreColor(item.score)}`}>
                          {item.score}/10
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">⚡ {item.steps_removed}</p>
                    <p className="font-mono-pie text-[11px] leading-relaxed text-muted-foreground mt-0.5">{item.current_friction_eliminated}</p>
                    {item.before_state && item.after_state && (
                      <BeforeAfterBlock before={item.before_state} after={item.after_state} />
                    )}
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
                    {item.what_it_is && (
                      <p className="text-[11px] text-foreground mb-0.5">{item.what_it_is}</p>
                    )}
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
                      {(item.tools_involved?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.tools_involved!.map((tool, ti) => (
                            <Badge key={ti} variant="secondary" className="text-[9px]">{tool}</Badge>
                          ))}
                        </div>
                      )}
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
              <div className="space-y-1.5">
                {s.tools_mentioned!.map((t, i) => (
                  <div key={i}>
                    <span className="inline-flex items-center gap-1">
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
                    {t.what_is_new_about_it && t.what_is_new_about_it.length > 0 && (
                      <p className="font-mono-pie text-[10px] text-muted-foreground mt-0.5 ml-1 flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 text-yellow-400 shrink-0" />
                        {t.what_is_new_about_it}
                      </p>
                    )}
                  </div>
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
