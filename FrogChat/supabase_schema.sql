-- Run this in your Supabase SQL editor to set up FrogChat

-- Profiles (one per auth user, auto-created on signup)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_seed text not null default '',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_seed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Frog' || floor(random() * 9999)::text),
    new.id::text
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Chatrooms
create table if not exists public.chatrooms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  topic text not null,
  description text,
  emoji text default '💬',
  created_at timestamptz default now()
);

alter table public.chatrooms enable row level security;
create policy "Chatrooms are viewable by everyone" on public.chatrooms for select using (true);

-- Seed default chatrooms
insert into public.chatrooms (name, topic, description, emoji) values
  ('general',    'General',    'Chat about anything and everything',  '🐸'),
  ('gaming',     'Gaming',     'Video games, board games, all games', '🎮'),
  ('music',      'Music',      'Share tunes, artists, playlists',     '🎵'),
  ('movies',     'Movies',     'Films, series, and everything screen','🎬'),
  ('sports',     'Sports',     'Scores, teams, and sporting debates', '⚽'),
  ('tech',       'Tech',       'Coding, gadgets, and the future',     '💻'),
  ('food',       'Food',       'Recipes, restaurants, foodie talk',   '🍔'),
  ('travel',     'Travel',     'Destinations, tips, and adventures',  '✈️'),
  ('memes',      'Memes',      'The funniest corners of the internet','😂'),
  ('random',     'Random',     'Completely unhinged conversations',   '🎲')
on conflict (name) do nothing;

-- Chatroom messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chatroom_id uuid references public.chatrooms(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Messages viewable by everyone" on public.messages for select using (true);
create policy "Authenticated users can send messages" on public.messages for insert
  with check (auth.uid() = sender_id);

create index if not exists messages_chatroom_id_idx on public.messages(chatroom_id, created_at desc);

-- DM conversations
create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user1_id, user2_id)
);

alter table public.dm_conversations enable row level security;
create policy "Users can see their own DM conversations" on public.dm_conversations
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Authenticated users can create DM conversations" on public.dm_conversations
  for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- DM messages
create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.dm_conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.dm_messages enable row level security;
create policy "DM messages visible to conversation participants" on public.dm_messages
  for select using (
    exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id
        and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );
create policy "Authenticated users can send DM messages" on public.dm_messages
  for insert with check (auth.uid() = sender_id);

create index if not exists dm_messages_conv_idx on public.dm_messages(conversation_id, created_at desc);

-- Enable realtime for live chat
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.dm_messages;
