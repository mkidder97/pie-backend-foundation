
-- Migration 1: Enable pgvector
create extension if not exists vector;

-- Migration 2: Create enums
create type public.pie_source_type as enum ('rss', 'youtube', 'both');
create type public.pie_episode_status as enum ('pending', 'transcribing', 'processing', 'completed', 'failed');

-- Migration 3: Create pie_creators table
create table public.pie_creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type public.pie_source_type not null,
  rss_feed_url text,
  youtube_channel_handle text,
  apple_podcast_id text,
  active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration 4: Create pie_episodes table
create table public.pie_episodes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.pie_creators(id) on delete cascade not null,
  source_type public.pie_source_type,
  source_url text not null,
  source_guid text unique not null,
  title text not null,
  published_at timestamptz,
  duration_seconds int,
  raw_transcript text,
  structured_summary jsonb,
  notion_page_id text,
  status public.pie_episode_status not null default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration 5: Create pie_chunks table
create table public.pie_chunks (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid references public.pie_episodes(id) on delete cascade not null,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- Migration 6: Create indexes
create index idx_pie_episodes_creator_id on public.pie_episodes(creator_id);
create index idx_pie_episodes_status on public.pie_episodes(status);
create index idx_pie_episodes_source_guid on public.pie_episodes(source_guid);
create index idx_pie_chunks_episode_id on public.pie_chunks(episode_id);
create index idx_pie_chunks_embedding on public.pie_chunks using hnsw (embedding vector_cosine_ops);

-- Migration 7: Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger update_pie_creators_updated_at
  before update on public.pie_creators
  for each row execute function public.update_updated_at_column();

create trigger update_pie_episodes_updated_at
  before update on public.pie_episodes
  for each row execute function public.update_updated_at_column();

-- Migration 8: Enable RLS with public read policies
alter table public.pie_creators enable row level security;
alter table public.pie_episodes enable row level security;
alter table public.pie_chunks enable row level security;

create policy "Public read access on pie_creators"
  on public.pie_creators for select
  using (true);

create policy "Public read access on pie_episodes"
  on public.pie_episodes for select
  using (true);

create policy "Public read access on pie_chunks"
  on public.pie_chunks for select
  using (true);
