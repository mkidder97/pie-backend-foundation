

## PIE — Podcast Intelligence Engine Dashboard

### Overview
Build a read-only, dark-themed intelligence dashboard with 3 pages (`/feed`, `/build`, `/tools`) plus a top navigation bar. All data comes from existing `pie_episodes` and `pie_creators` tables via the Supabase client.

### Design System Changes
**File: `src/index.css`** — Override the `.dark` theme variables to create a dark, minimal aesthetic. Set dark mode as default on the `<html>` tag in `index.html`. Add a monospace font utility class.

### Files to Create

1. **`src/components/pie/PieNav.tsx`** — Top navigation bar with "PIE" branding + Feed / Build / Tools links using NavLink for active state styling. Minimal, dark, no decorative elements.

2. **`src/components/pie/PieLayout.tsx`** — Layout wrapper with PieNav + outlet content area.

3. **`src/pages/Feed.tsx`** — Default page at `/feed`:
   - Fetches completed episodes joined with creators, sorted by `published_at` desc
   - Renders card-based feed: creator name, title, source type badge, date, first 3 executive_summary bullets, build_this_week count badge
   - Click opens a Drawer/Dialog with full structured_summary sections (Executive Summary, Key Ideas, Mental Models, Actionable Insights, Tools Mentioned, Automation Opportunities, Startup Ideas, Notable Quotes, Build This Week) + source link

4. **`src/pages/Build.tsx`** — `/build` page:
   - Fetches completed episodes from last 14 days with their creators
   - Extracts and groups `build_this_week` items by creator name, with episode title as subtitle

5. **`src/pages/Tools.tsx`** — `/tools` page:
   - Fetches completed episodes from last 30 days
   - Extracts all `tools_mentioned`, counts frequency across episodes
   - Ranked list by mention count, expandable to show context from each episode

6. **`src/types/pie.ts`** — TypeScript interfaces for the `structured_summary` JSON shape (key_ideas, mental_models, tools_mentioned, etc.)

### Files to Modify

- **`src/App.tsx`** — Add routes: `/` redirects to `/feed`, `/feed`, `/build`, `/tools` all wrapped in PieLayout
- **`src/index.css`** — Dark theme CSS variables, monospace font class
- **`index.html`** — Add `class="dark"` to `<html>` tag

### Data Fetching Approach
- Use `@tanstack/react-query` for all queries
- Supabase client: `supabase.from('pie_episodes').select('*, pie_creators(name)').eq('status', 'completed')`
- No write operations, no auth required
- All aggregation (tool frequency, grouping by creator) done client-side since the dataset is small

### Technical Details
- Dark theme via Tailwind's `dark` class strategy (already configured in tailwind.config.ts)
- Monospace: `font-mono` Tailwind class for summaries/quotes
- Episode detail: Sheet component (slide-in from right) for information density
- Badges: existing Badge component for source type and build count
- Collapsible sections in episode detail for each summary category

