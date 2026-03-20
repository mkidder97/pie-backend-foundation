

## Insert 13 New RSS Creators

**Current state:** 6 creators already in the database (3 YouTube, 3 both). Pipeline has 350 pending, 1 completed, 1 failed.

**What needs to happen:** Insert 13 new RSS-only creators into `pie_creators`. The read-only query tool cannot run INSERT statements, so this requires switching to implementation mode.

### Implementation

**Single step:** Use the Supabase client via an edge function or direct insert to add all 13 creators:

- The Rundown AI
- TLDR AI
- Ben's Bites
- One Useful Thing
- Latent Space
- Anthropic News
- Import AI
- Product Hunt Daily
- Hacker News launches
- OpenAI Blog
- Google DeepMind Blog
- The Verge AI
- MIT Technology Review AI

All will be inserted as `source_type: 'rss'` with their respective `rss_feed_url` values and `active: true`.

### Verification

After insert, run the two verification queries:
1. Confirm all 19 creators appear (6 existing + 13 new)
2. Pipeline health check across source types

### Note on Query 4 (Reset Failed)

The failed episode reset (`UPDATE ... SET status = 'pending' WHERE status = 'failed'`) will also be executed. You mentioned only running this after the n8n workflow fix is confirmed — approve the plan and I'll execute all operations.

