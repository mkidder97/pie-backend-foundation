

# Deactivate Low-Signal Creators

## What
Set `active = false` on 8 creators that are generating low-signal content:
- The Verge AI
- MIT Technology Review AI
- Federal Reserve News
- First Round Review
- Real Vision
- One Useful Thing
- Google DeepMind Blog
- OpenAI Blog

## How
Single database UPDATE using the insert tool:

```sql
UPDATE pie_creators SET active = false
WHERE name IN (
  'The Verge AI',
  'MIT Technology Review AI',
  'Federal Reserve News',
  'First Round Review',
  'Real Vision',
  'One Useful Thing',
  'Google DeepMind Blog',
  'OpenAI Blog'
);
```

No schema changes or code changes needed — the frontend already respects the `active` flag via creator queries. The ingestion pipeline will stop pulling new episodes for these creators.

