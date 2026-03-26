# Add New Intelligence Fields to Types and Episode Detail

## File 1 — `src/types/pie.ts`

Add optional fields to existing interfaces:

- **BuilderEvolutionItem**: add `what_is_new?: string` and `workflow_breakdown?: { workflow_steps: string[]; tools_required: string[]; before_state: string; after_state: string; setup_time_hours: number; }`
- **AutonomyMultiplierItem**: add `before_state?: string`, `after_state?: string`, `time_saved_per_week_hours?: number`
- **EmergingStackItem**: add `what_it_is?: string`
- **ToolMentioned**: add `what_is_new_about_it?: string`
- **BuildThisWeekItem**: add `tools_involved?: string[]` (no `project` field exists to remove, so just add)

## File 2 — `src/components/pie/EpisodeDetail.tsx`

### Builder Evolution section (lines 94-107)

After the `tool_or_pattern` heading and score badge, add:

- If `what_is_new` exists: green left-border callout (`border-l-4 border-emerald-500 bg-emerald-500/10 p-2`) with "WHAT IS NEW" label and text
- If `workflow_breakdown` exists: "HOW TO IMPLEMENT" sub-section with:
  - Numbered `<ol>` of `workflow_steps`
  - BEFORE row: red left border, muted text showing `before_state`
  - AFTER row: green left border, green text showing `after_state`
  - `tools_required` as small pill badges (`Badge variant="secondary"`)
  - Setup time badge: `~Xh`

### Autonomy Multiplier section (lines 117-128)

After `steps_removed` line, add:

- If `before_state` and `after_state` exist: BEFORE/AFTER comparison (same red/green border pattern)
- If `time_saved_per_week_hours > 0`: badge showing `saves ~Xh/week`

### Build This Week section (lines 159-169)

- After `what` text, if `tools_involved` exists, render as small pill badges
- Keep `estimated_hours` badge as-is

### Tools Mentioned section (lines 179-194)

- After each tool name badge, if `what_is_new_about_it` is non-empty, show in `font-mono-pie text-[10px] text-muted-foreground` with a `Zap` icon prefix

Import: add `Wrench` from lucide-react if needed for workflow section (or reuse existing icons).  
  
For what_is_new_about_it — only render if the string exists 

AND has length > 0. The field will often be an empty string 

which should show nothing.