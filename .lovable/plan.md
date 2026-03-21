

# Agent Launchpad for PIE

## Overview
Add an "Agent Launchpad" layer: a new database table for saved agent briefs, plus 4 UI features that let you launch, save, and monitor AI agent missions directly from Feed, Relay, and Signals tabs.

## Step 0 — Database Migration
Create `pie_agent_briefs` table with columns: id (uuid PK), title (text), prompt (text), category (text, default 'all'), source (text), created_at (timestamptz). Enable RLS with a permissive public read/write policy.

## Step 1 — "Launch Agent" button on Build This Week items
**File:** `src/components/pie/CategoryFeed.tsx`

- Add a small "▶ Launch" button (Play icon, `text-[10px]`) next to each build idea in the expanded list
- `onClick` with `stopPropagation` opens a shadcn `Dialog` containing:
  - Pre-filled title (first 60 chars of build idea)
  - Build idea displayed as context
  - Editable textarea with the agent prompt template (includes build idea, episode title, creator name, full stack context)
  - "Copy Agent Brief" button — clipboard + toast
  - "Save & Copy" button — clipboard + insert into `pie_agent_briefs` (category: "build", source: "creator — title") + toast
- State: `launchBuild` object holding `{ idea, title, creator }` or null

## Step 2 — "Agent Brief" button on Relay tabs
**Files:** `src/components/pie/CategoryRelay.tsx` and `src/pages/Relay.tsx`

- Add an outline `Button` with `Bot` icon labeled "Agent Brief" next to the existing copy button in both files
- On click: prepend the structured agent preamble to the markdown, copy combined text, show toast
- After copying, show a "Save" button/link that inserts into `pie_agent_briefs` with category "relay", source "relay", title "Weekly Agent Brief — [range label]"
- Use state to track `agentCopied` and `agentSaved` booleans

## Step 3 — Saved Agent Briefs page
**New file:** `src/pages/SavedBriefs.tsx`

- Query `pie_agent_briefs` ordered by `created_at` desc using react-query key `["pie-agent-briefs"]`
- Each brief renders as a Card with: title, date, category badge (color-coded: build=emerald, relay=blue, monitor=amber, other=gray), source line, Copy button, Delete button (with `window.confirm`)
- Empty state message directing to Feed/Relay tabs
- Invalidate query on delete

**Routing:** Add `/saved` route in `App.tsx` inside PieLayout

**Nav:** Add "Agent Briefs" item with `Bookmark` icon to gear dropdown in `PieNav.tsx`, between Creators and Admin

## Step 4 — "Monitor" button on Signals horizon items
**File:** `src/components/pie/CategorySignals.tsx`

- Add an outline `Button` with `Eye` icon ("Monitor") in the top-right of each horizon item card (use `flex justify-between` on the header row)
- On click: insert into `pie_agent_briefs` with category "monitor", title "Monitor: [feature]", prompt template with feature/context/sources, source from first source entry
- After saving: swap button to `Check` icon + "Saved" text for 2 seconds via per-item state (use a `Set<string>` keyed by feature name)

## Technical Details

**Files to create:** `src/pages/SavedBriefs.tsx`
**Files to modify:** `src/components/pie/CategoryFeed.tsx`, `src/components/pie/CategoryRelay.tsx`, `src/pages/Relay.tsx`, `src/components/pie/CategorySignals.tsx`, `src/components/pie/PieNav.tsx`, `src/App.tsx`
**Migration:** 1 new table `pie_agent_briefs`
**Shared pattern:** All inserts use `supabase.from("pie_agent_briefs").insert(...)`, all clipboard ops use `navigator.clipboard.writeText()` + `useToast`

