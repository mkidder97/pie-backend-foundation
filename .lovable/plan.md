

## Podcast Intelligence Engine (PIE) — Database Schema Setup

### Overview
Set up the complete Supabase schema for PIE with no UI changes. All work is database-side.

### Migrations (in order)

**Migration 1: Enable pgvector**
- `create extension if not exists vector;`

**Migration 2: Create Enums** *(per design brief, replacing loose text with enums)*
- `pie_source_type` enum: `'rss'`, `'youtube'`, `'both'`
- `pie_episode_status` enum: `'pending'`, `'transcribing'`, `'processing'`, `'completed'`, `'failed'`

**Migration 3: Create `pie_creators` table**
- Uses `pie_source_type` enum instead of text
- Adds `metadata jsonb` and `updated_at` columns per design brief

**Migration 4: Create `pie_episodes` table**
- Uses enums for `source_type` and `status`
- Adds `metadata jsonb` and `updated_at` columns per design brief
- Enforces `NOT NULL` on key fields (`source_url`, `source_guid`, `title`)

**Migration 5: Create `pie_chunks` table**
- `embedding vector(1536)` for OpenAI embeddings
- `NOT NULL` on `content` and `chunk_index`

**Migration 6: Create indexes**
- B-tree indexes on `episodes(creator_id)`, `episodes(status)`, `chunks(episode_id)`
- HNSW vector index on `chunks(embedding)` for semantic search

**Migration 7: Seed `pie_creators`**
- Insert the 6 podcast creators (Cognitive Revolution, Cole Medin, AI Jason, Matt Wolfe, Greg Isenberg, Low Down on Low Code)

**Migration 8: Enable RLS**
- Enable RLS on all 3 tables
- Public read access policies

### Design Brief Enhancements Applied
- Enums instead of text for `source_type` and `status` (prevents typos/invalid states)
- `metadata jsonb` columns for future-proofing
- `updated_at` columns with auto-update triggers
- HNSW vector index for better semantic search performance
- `NOT NULL` constraints on critical fields

### No UI Changes
No frontend code will be modified.

