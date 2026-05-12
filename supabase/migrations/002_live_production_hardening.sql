-- Live production hardening migration.
-- Safe to run on a partially initialized Supabase project.

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  stream text default 'PCM',
  subjects text[] not null default array['physics','chemistry','mathematics','computer-science','english'],
  preferred_language text not null default 'en',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles add column if not exists email text;
alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists stream text default 'PCM';
alter table profiles add column if not exists subjects text[] not null default array['physics','chemistry','mathematics','computer-science','english'];
alter table profiles add column if not exists preferred_language text not null default 'en';
alter table profiles add column if not exists onboarding_completed boolean not null default false;
alter table profiles add column if not exists created_at timestamptz not null default now();
alter table profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_preferred_language_check'
  ) then
    alter table profiles
      add constraint profiles_preferred_language_check
      check (preferred_language in ('en','hi','both'));
  end if;
end $$;

create table if not exists documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb not null,
  embedding vector(384),
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  subject text,
  mode text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversations add column if not exists subject text;
alter table conversations add column if not exists title text;
alter table conversations add column if not exists mode text not null default 'doubt';
alter table conversations add column if not exists created_at timestamptz not null default now();
alter table conversations add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'conversations_mode_check'
  ) then
    alter table conversations
      add constraint conversations_mode_check
      check (mode in ('doubt','learning','practice','revision'));
  end if;
end $$;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null,
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  model_used text,
  tokens_used int,
  created_at timestamptz not null default now()
);

alter table messages add column if not exists citations jsonb not null default '[]'::jsonb;
alter table messages add column if not exists model_used text;
alter table messages add column if not exists tokens_used int;
alter table messages add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_role_check'
  ) then
    alter table messages
      add constraint messages_role_check
      check (role in ('user','assistant','system'));
  end if;
end $$;

create table if not exists practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint not null references documents(id),
  user_answer text,
  is_correct boolean,
  marks_awarded numeric(5,2),
  marks_total numeric(5,2),
  feedback text,
  attempted_at timestamptz not null default now()
);

alter table practice_attempts add column if not exists marks_awarded numeric(5,2);
alter table practice_attempts add column if not exists marks_total numeric(5,2);
alter table practice_attempts add column if not exists feedback text;
alter table practice_attempts add column if not exists attempted_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'practice_attempts_marks_awarded_check'
  ) then
    alter table practice_attempts
      add constraint practice_attempts_marks_awarded_check
      check (marks_awarded is null or marks_awarded >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'practice_attempts_marks_total_check'
  ) then
    alter table practice_attempts
      add constraint practice_attempts_marks_total_check
      check (marks_total is null or marks_total >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'practice_attempts_marks_order_check'
  ) then
    alter table practice_attempts
      add constraint practice_attempts_marks_order_check
      check (marks_awarded is null or marks_total is null or marks_awarded <= marks_total);
  end if;
end $$;

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint references documents(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bookmarks add column if not exists document_id bigint references documents(id) on delete cascade;
alter table bookmarks add column if not exists message_id uuid references messages(id) on delete cascade;
alter table bookmarks add column if not exists note text;
alter table bookmarks add column if not exists created_at timestamptz not null default now();
alter table bookmarks add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookmarks_document_or_message_check'
  ) then
    alter table bookmarks
      add constraint bookmarks_document_or_message_check
      check (document_id is not null or message_id is not null);
  end if;
end $$;

create index if not exists documents_embedding_hnsw_idx on documents using hnsw (embedding vector_cosine_ops);
create index if not exists documents_metadata_gin_idx on documents using gin (metadata);
create index if not exists documents_subject_idx on documents ((metadata->>'subject'));
create index if not exists documents_year_idx on documents ((
  case
    when metadata->>'year' ~ '^[0-9]+$' then (metadata->>'year')::int
    else null
  end
));
create index if not exists documents_language_idx on documents ((metadata->>'language'));
create index if not exists documents_set_idx on documents ((metadata->>'set'));
create index if not exists documents_chapter_idx on documents ((metadata->>'chapter'));
create unique index if not exists documents_ingestion_unique_idx on documents (
  (metadata->>'subject'),
  (metadata->>'year'),
  (metadata->>'set'),
  (metadata->>'q_no'),
  (metadata->>'language'),
  coalesce(metadata->>'or_variant', '')
);

create index if not exists conversations_user_updated_idx on conversations (user_id, updated_at desc);
create index if not exists conversations_user_subject_updated_idx on conversations (user_id, subject, updated_at desc);
create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at);
create index if not exists practice_attempts_user_attempted_idx on practice_attempts (user_id, attempted_at desc);
create index if not exists practice_attempts_user_document_idx on practice_attempts (user_id, document_id);
create index if not exists bookmarks_user_created_idx on bookmarks (user_id, created_at desc);
create unique index if not exists bookmarks_user_document_unique_idx on bookmarks (user_id, document_id) where document_id is not null;
create unique index if not exists bookmarks_user_message_unique_idx on bookmarks (user_id, message_id) where message_id is not null;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists conversations_set_updated_at on conversations;
create trigger conversations_set_updated_at
  before update on conversations
  for each row execute function set_updated_at();

drop trigger if exists bookmarks_set_updated_at on bookmarks;
create trigger bookmarks_set_updated_at
  before update on bookmarks
  for each row execute function set_updated_at();

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table documents enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table practice_attempts enable row level security;
alter table bookmarks enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on profiles;
create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = id);

drop policy if exists "documents_select_authenticated" on documents;
create policy "documents_select_authenticated" on documents
  for select to authenticated using (auth.role() = 'authenticated');

drop policy if exists "conversations_select_own" on conversations;
create policy "conversations_select_own" on conversations
  for select using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on conversations;
create policy "conversations_insert_own" on conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "conversations_update_own" on conversations;
create policy "conversations_update_own" on conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "conversations_delete_own" on conversations;
create policy "conversations_delete_own" on conversations
  for delete using (auth.uid() = user_id);

drop policy if exists "messages_select_own_conversation" on messages;
create policy "messages_select_own_conversation" on messages
  for select using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_own_conversation" on messages;
create policy "messages_insert_own_conversation" on messages
  for insert with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "messages_update_own_conversation" on messages;
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

drop policy if exists "messages_delete_own_conversation" on messages;
create policy "messages_delete_own_conversation" on messages
  for delete using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

drop policy if exists "practice_attempts_select_own" on practice_attempts;
create policy "practice_attempts_select_own" on practice_attempts
  for select using (auth.uid() = user_id);

drop policy if exists "practice_attempts_insert_own" on practice_attempts;
create policy "practice_attempts_insert_own" on practice_attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "practice_attempts_update_own" on practice_attempts;
create policy "practice_attempts_update_own" on practice_attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "practice_attempts_delete_own" on practice_attempts;
create policy "practice_attempts_delete_own" on practice_attempts
  for delete using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own" on bookmarks;
create policy "bookmarks_select_own" on bookmarks
  for select using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on bookmarks;
create policy "bookmarks_insert_own" on bookmarks
  for insert with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on bookmarks;
create policy "bookmarks_update_own" on bookmarks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on bookmarks;
create policy "bookmarks_delete_own" on bookmarks
  for delete using (auth.uid() = user_id);

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
