-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- User profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  stream text default 'PCM',
  subjects text[] not null default array['physics','chemistry','mathematics','computer-science','english'],
  preferred_language text not null default 'en' check (preferred_language in ('en','hi','both')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Knowledge base
create table documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb not null,
  embedding vector(384),
  created_at timestamptz not null default now()
);

create index documents_embedding_hnsw_idx on documents using hnsw (embedding vector_cosine_ops);
create index documents_metadata_gin_idx on documents using gin (metadata);
create index documents_subject_idx on documents ((metadata->>'subject'));
create index documents_year_idx on documents ((
  case
    when metadata->>'year' ~ '^[0-9]+$' then (metadata->>'year')::int
    else null
  end
));
create index documents_language_idx on documents ((metadata->>'language'));
create index documents_set_idx on documents ((metadata->>'set'));
create index documents_chapter_idx on documents ((metadata->>'chapter'));
create unique index documents_ingestion_unique_idx on documents (
  (metadata->>'subject'),
  (metadata->>'year'),
  (metadata->>'set'),
  (metadata->>'q_no'),
  (metadata->>'language'),
  coalesce(metadata->>'or_variant', '')
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  subject text,
  mode text not null check (mode in ('doubt','learning','practice','revision')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_updated_idx on conversations (user_id, updated_at desc);
create index conversations_user_subject_updated_idx on conversations (user_id, subject, updated_at desc);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  model_used text,
  tokens_used int,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx on messages (conversation_id, created_at);

-- Practice attempts
create table practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint not null references documents(id),
  user_answer text,
  is_correct boolean,
  marks_awarded numeric(5,2),
  marks_total numeric(5,2),
  feedback text,
  attempted_at timestamptz not null default now(),
  check (marks_awarded is null or marks_awarded >= 0),
  check (marks_total is null or marks_total >= 0),
  check (marks_awarded is null or marks_total is null or marks_awarded <= marks_total)
);

create index practice_attempts_user_attempted_idx on practice_attempts (user_id, attempted_at desc);
create index practice_attempts_user_document_idx on practice_attempts (user_id, document_id);

-- Bookmarks
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint references documents(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (document_id is not null or message_id is not null)
);

create index bookmarks_user_created_idx on bookmarks (user_id, created_at desc);
create unique index bookmarks_user_document_unique_idx on bookmarks (user_id, document_id) where document_id is not null;
create unique index bookmarks_user_message_unique_idx on bookmarks (user_id, message_id) where message_id is not null;

-- Shared updated_at trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger conversations_set_updated_at
  before update on conversations
  for each row execute function set_updated_at();

create trigger bookmarks_set_updated_at
  before update on bookmarks
  for each row execute function set_updated_at();

-- Create a profile as soon as a Supabase auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table documents enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table practice_attempts enable row level security;
alter table bookmarks enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = id);

create policy "documents_select_authenticated" on documents
  for select to authenticated using (auth.role() = 'authenticated');

create policy "conversations_select_own" on conversations
  for select using (auth.uid() = user_id);

create policy "conversations_insert_own" on conversations
  for insert with check (auth.uid() = user_id);

create policy "conversations_update_own" on conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "conversations_delete_own" on conversations
  for delete using (auth.uid() = user_id);

create policy "messages_select_own_conversation" on messages
  for select using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "messages_insert_own_conversation" on messages
  for insert with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "messages_update_own_conversation" on messages
  for update using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "messages_delete_own_conversation" on messages
  for delete using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "practice_attempts_select_own" on practice_attempts
  for select using (auth.uid() = user_id);

create policy "practice_attempts_insert_own" on practice_attempts
  for insert with check (auth.uid() = user_id);

create policy "practice_attempts_update_own" on practice_attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "practice_attempts_delete_own" on practice_attempts
  for delete using (auth.uid() = user_id);

create policy "bookmarks_select_own" on bookmarks
  for select using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on bookmarks
  for insert with check (auth.uid() = user_id);

create policy "bookmarks_update_own" on bookmarks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bookmarks_delete_own" on bookmarks
  for delete using (auth.uid() = user_id);

-- Vector search RPC. RLS applies for anon/authenticated callers; service role bypasses it.
create or replace function match_documents(
  query_embedding vector(384),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
) returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql
stable
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.embedding is not null
    and documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Summary RPC for subject/year selectors and ingestion checks.
create or replace function documents_by_subject()
returns table (subject text, year int, document_count bigint, latest_created_at timestamptz)
language sql
stable
as $$
  select
    documents.metadata->>'subject' as subject,
    case
      when documents.metadata->>'year' ~ '^[0-9]+$' then (documents.metadata->>'year')::int
      else null
    end as year,
    count(*) as document_count,
    max(documents.created_at) as latest_created_at
  from documents
  where documents.metadata ? 'subject'
  group by 1, 2
  order by 1, 2 desc nulls last;
$$;
