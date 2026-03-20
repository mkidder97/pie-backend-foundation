import { ExternalLink } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EpisodeDetailProps {
  episode: PieEpisode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <AccordionItem value={title}>
    <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
      {title}
    </AccordionTrigger>
    <AccordionContent>{children}</AccordionContent>
  </AccordionItem>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="font-mono-pie text-xs leading-relaxed text-foreground">
        <span className="mr-2 text-primary">→</span>
        {item}
      </li>
    ))}
  </ul>
);

const EpisodeDetail = ({ episode, open, onOpenChange }: EpisodeDetailProps) => {
  if (!episode) return null;

  const s: StructuredSummary = episode.structured_summary ?? {
    executive_summary: [],
    key_ideas: [],
    mental_models: [],
    actionable_insights: [],
    tools_mentioned: [],
    automation_opportunities: [],
    startup_app_ideas: [],
    notable_quotes: [],
    build_this_week: [],
    on_the_horizon: [],
    industry_shifts: [],
  };

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

        <Accordion type="multiple" defaultValue={["Executive Summary"]} className="w-full">
          {s.executive_summary.length > 0 && (
            <Section title="Executive Summary">
              <BulletList items={s.executive_summary} />
            </Section>
          )}

          {s.key_ideas.length > 0 && (
            <Section title="Key Ideas">
              <div className="space-y-3">
                {s.key_ideas.map((k, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-foreground">{k.concept}</p>
                    <p className="font-mono-pie text-xs text-muted-foreground">{k.explanation}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {s.mental_models.length > 0 && (
            <Section title="Mental Models">
              <div className="space-y-3">
                {s.mental_models.map((m, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-foreground">{m.model}</p>
                    <p className="font-mono-pie text-xs text-muted-foreground">{m.how_applied}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {s.actionable_insights.length > 0 && (
            <Section title="Actionable Insights">
              <BulletList items={s.actionable_insights} />
            </Section>
          )}

          {s.tools_mentioned.length > 0 && (
            <Section title="Tools Mentioned">
              <div className="space-y-2">
                {s.tools_mentioned.map((t, i) => (
                  <div key={i}>
                    <Badge variant="secondary" className="text-[10px]">{t.name}</Badge>
                    <p className="mt-0.5 font-mono-pie text-xs text-muted-foreground">{t.context}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {s.automation_opportunities.length > 0 && (
            <Section title="Automation Opportunities">
              <div className="space-y-2">
                {s.automation_opportunities.map((a, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <p className="font-mono-pie text-xs text-foreground">{a.idea}</p>
                    <Badge variant="outline" className="shrink-0 text-[10px]">{a.complexity}</Badge>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {s.startup_app_ideas.length > 0 && (
            <Section title="Startup Ideas">
              <div className="space-y-3">
                {s.startup_app_ideas.map((s, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-foreground">{s.concept}</p>
                    <p className="font-mono-pie text-xs text-muted-foreground">{s.why_interesting}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {s.notable_quotes.length > 0 && (
            <Section title="Notable Quotes">
              <div className="space-y-2">
                {s.notable_quotes.map((q, i) => (
                  <blockquote key={i} className="border-l-2 border-primary pl-3 font-mono-pie text-xs italic text-muted-foreground">
                    "{q}"
                  </blockquote>
                ))}
              </div>
            </Section>
          )}

          {s.build_this_week.length > 0 && (
            <Section title="Build This Week">
              <BulletList items={s.build_this_week} />
            </Section>
          )}

          {(s.on_the_horizon?.length ?? 0) > 0 && (
            <Section title="On the Horizon">
              <div className="space-y-3">
                {s.on_the_horizon!.map((h, i) => {
                  const timelineColors: Record<string, string> = {
                    days: "border-rose-500/40 text-rose-400",
                    weeks: "border-yellow-500/40 text-yellow-400",
                    months: "border-emerald-500/40 text-emerald-400",
                    unknown: "border-muted-foreground/40 text-muted-foreground",
                  };
                  return (
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
                  );
                })}
              </div>
            </Section>
          )}

          {(s.industry_shifts?.length ?? 0) > 0 && (
            <Section title="Industry Shifts">
              <div className="space-y-3">
                {s.industry_shifts!.map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-foreground">{item.shift}</p>
                    <p className="mt-0.5 font-mono-pie text-xs text-muted-foreground">{item.evidence}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </Accordion>

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
