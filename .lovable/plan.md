

# PIE — 5 Targeted Fixes

## Fix 1: Filter empty/broken episodes in CategoryFeed.tsx
Add a `.filter()` after the source type filter to exclude episodes where `structured_summary` is null, `executive_summary` is missing/empty, or the first summary line contains "No transcript" / "Unable to extract".

## Fix 2: Make Relay the hero feature in CategoryRelay.tsx
- Change Copy button: `size="lg"`, green styling (`bg-emerald-600 hover:bg-emerald-700 text-white`), label → "Copy Briefing → Paste into Claude"
- Add subtitle text below the button explaining the workflow
- Add two new sections to the markdown output between "Build Ideas" and "Automation Opportunities":
  - `## Startup & App Ideas` — from `startup_app_ideas` (concept — why_interesting)
  - `## Notable Quotes` — from `notable_quotes`, up to 5

## Fix 3: Date range toggle + deduplication in CategorySignals.tsx
- Add state for `days` (default 30) with a segmented button toggle: 7 / 14 / 30 days
- Replace hardcoded `thirtyDaysAgo` with computed `since` based on selected days
- Deduplicate horizon items by `feature` name — group sources, show "X sources" badge, list each source as subtitle lines

## Fix 4: Default route — already done
The `"/" → "/all"` redirect already exists in App.tsx (line 23). No change needed.

## Fix 5: Episode count badges in PieNav.tsx
- Add a `useQuery` that fetches all completed episodes with `pie_creators!inner(category)`
- Count by category client-side into a `Record<string, number>`
- Map category slugs to DB values (e.g., `src-tools` → `src_tools`)
- Render a small numeric badge next to each nav label when count > 0

## Technical Details

**Files modified:**
1. `src/components/pie/CategoryFeed.tsx` — add filter chain after line 48
2. `src/components/pie/CategoryRelay.tsx` — restyle button, add markdown sections, add subtitle
3. `src/components/pie/CategorySignals.tsx` — add days state/toggle, deduplicate horizon items
4. `src/components/pie/PieNav.tsx` — add useQuery + badge rendering

**No database changes needed.** All fixes are frontend-only using existing data.

