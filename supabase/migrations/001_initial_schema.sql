-- Enable pgvector
create extension if not exists vector;

-- profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  stream text default 'PCM',
  subjects text[] default array['physics','chemistry','math','cs','english'],
  preferred_language text default 'en' check (preferred_language in ('en','hi','both')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- documents table (knowledge base)
create table documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb not null,
  embedding vector(384),
  created_at timestamptz default now()
);

create index on documents using hnsw (embedding vector_cosine_ops);
create index on documents using gin (metadata);
create index on documents ((metadata->>'subject'));
create index on documents ((metadata->>'language'));
create index on documents ((metadata->>'set'));
create index on documents ((metadata->>'chapter'));

-- conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  mode text not null check (mode in ('doubt','learning','practice','revision')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on conversations (user_id, updated_at desc);

-- messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  citations jsonb default '[]',
  model_used text,
  tokens_used int,
  created_at timestamptz default now()
);

create index on messages (conversation_id, created_at);

-- practice attempts
create table practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint not null references documents(id),
  user_answer text,
  is_correct boolean,
  feedback text,
  attempted_at timestamptz default now()
);

-- bookmarks
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint references documents(id),
  message_id uuid references messages(id),
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table practice_attempts enable row level security;
alter table bookmarks enable row level security;
alter table documents enable row level security;

create policy "users own profile" on profiles for all using (auth.uid() = id);
create policy "users own conversations" on conversations for all using (auth.uid() = user_id);
create policy "users own messages" on messages for all using (
  auth.uid() = (select user_id from conversations where id = conversation_id)
);
create policy "users own practice" on practice_attempts for all using (auth.uid() = user_id);
create policy "users own bookmarks" on bookmarks for all using (auth.uid() = user_id);
create policy "documents readable by all" on documents for select using (true);

-- match_documents RPC
create or replace function match_documents(
  query_embedding vector(384),
  match_count int default 5,
  filter jsonb default '{}'
) returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
  return query
  select d.id, d.content, d.metadata,
         1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
end; $$;
