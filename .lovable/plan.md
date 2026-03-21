# Create User Preferences Table

## Change 1 — Create `pie_user_preferences` table

Database migration to create the table with RLS enabled and a permissive public read/write policy. Uses a UNIQUE constraint on `(preference_type, preference_key)` and a weight column (1-10). The CHECK constraint is acceptable here since it validates a static integer range (no time-based logic).

## Change 2 — Seed preference data

Insert 20 rows covering category weights, source type weights, creator weights, and recency weights using the data insert tool.

## Technical Details

- **Migration**: Creates table, enables RLS, adds policy
- **Data insert**: Seeds all 20 preference rows in a single statement
- No frontend changes needed yet — this is a data foundation step
- The `updated_at` column has no auto-update trigger; will add one matching the existing `update_updated_at_column()` function  
  
  
******One gap — the seed data needs to match your exact creator names**
  When you submit, make sure the creator names in the seed INSERT exactly match what's in `pie_creators.name` in Supabase. A mismatch like `"Hacker News Launches"` vs `"Hacker News launches"` will mean the scoring node never finds a weight for that creator and defaults to 5.
  Run this first to get the exact names:
  sql
  ```sql
  SELECT name, category FROM pie_creators WHERE active = true ORDER BY category;
  ```
  Copy those exact names into your seed data before submitting to Lovable.*****
- &nbsp;