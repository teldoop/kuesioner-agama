-- Jalankan SETELAH schema.sql (aman dijalankan ulang).

-- 1) Realtime: kirim perubahan survey_responses ke admin (tetap dibatasi RLS: hanya authenticated yang bisa SELECT)
do $$ begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'survey_responses') then
    alter publication supabase_realtime add table public.survey_responses;
  end if;
end $$;

-- 2) Langganan push milik admin
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
grant select, insert, update, delete on push_subscriptions to authenticated;
grant all on push_subscriptions to service_role;

drop policy if exists "admin kelola langganan sendiri" on push_subscriptions;
create policy "admin kelola langganan sendiri" on push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
