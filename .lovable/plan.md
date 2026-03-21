

# Filter Bad Episodes + Disable Product Hunt Daily

## Change 1 — Expand bad-content filter in CategoryFeed.tsx
**File:** `src/components/pie/CategoryFeed.tsx` (lines 53-56)

Replace the two individual `includes` checks with an array-based filter covering all 7 phrases:
- "no transcript"
- "unable to extract"
- "no relevance"
- "transcript contains only metadata"
- "transcript is nearly empty"
- "cannot extract"
- "no substantive content"

Uses `badPhrases.some(phrase => first.includes(phrase))` for clean extensibility.

## Change 2 — Disable Product Hunt Daily creator
Run a data update via the insert tool:
```sql
UPDATE pie_creators SET active = false WHERE name = 'Product Hunt Daily';
```

This prevents future ingestion of content-less Product Hunt Daily episodes.

## Technical Details
- **File modified:** `src/components/pie/CategoryFeed.tsx` — lines 53-56 replaced with array-based filter
- **Database update:** 1 row in `pie_creators` set to `active = false`
- No migration needed (data update only)

