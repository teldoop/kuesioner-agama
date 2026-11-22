-- ============ TABEL ============
create extension if not exists pgcrypto;

create table if not exists survey_settings (
  id int primary key default 1 check (id = 1),
  title text not null default '',
  description text not null default '',
  estimated_minutes int not null default 2,
  is_open boolean not null default true,
  result_types jsonb not null default '[]'::jsonb
);

create table if not exists survey_questions (
  id uuid primary key default gen_random_uuid(),
  order_index int not null default 0,
  question_type text not null check (question_type in
    ('multiple_choice','slider','rating','card_swipe','branching_choice','open_text')),
  title text not null,
  subtitle text,
  options jsonb,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists survey_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  answers jsonb not null default '{}'::jsonb,
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_responses_created on survey_responses (created_at desc);

-- ============ HAK AKSES (GRANT) ============
grant usage on schema public to anon, authenticated;
grant select on survey_settings, survey_questions to anon;
grant insert on survey_responses to anon;
grant select, insert, update, delete on survey_settings, survey_questions, survey_responses to authenticated;

-- ============ RLS ============
alter table survey_settings  enable row level security;
alter table survey_questions enable row level security;
alter table survey_responses enable row level security;

create policy "public baca pengaturan" on survey_settings for select to anon, authenticated using (true);
create policy "admin kelola pengaturan" on survey_settings for all to authenticated using (true) with check (true);

create policy "public baca pertanyaan aktif" on survey_questions for select to anon using (is_active = true);
create policy "admin kelola pertanyaan" on survey_questions for all to authenticated using (true) with check (true);

create policy "public kirim jawaban" on survey_responses for insert to anon, authenticated
  with check (jsonb_typeof(answers) = 'object' and duration_seconds >= 0);
create policy "admin baca jawaban"  on survey_responses for select to authenticated using (true);
create policy "admin ubah jawaban"  on survey_responses for update to authenticated using (true) with check (true);
create policy "admin hapus jawaban" on survey_responses for delete to authenticated using (true);

-- ============ HASIL KOMUNITAS (agregat publik) ============
-- Hanya untuk pertanyaan yang ditandai "Tampilkan hasil komunitas" di admin. Tidak membuka data mentah.
create or replace function public.public_pulse() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare q record; counts jsonb; res jsonb := '[]'::jsonb;
begin
  for q in select id, title, question_type from survey_questions
           where is_active and coalesce((config ->> 'show_pulse')::boolean, false) order by order_index loop
    if q.question_type = 'multiple_choice' then
      select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) into counts from (
        select e as k, count(*) as n from survey_responses r,
          jsonb_array_elements_text(coalesce(r.answers -> q.id::text -> 'choices', '[]'::jsonb)) e group by e) t;
    elsif q.question_type = 'branching_choice' then
      select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) into counts from (
        select r.answers -> q.id::text ->> 'choice' as k, count(*) as n from survey_responses r
        where r.answers -> q.id::text ->> 'choice' is not null group by 1) t;
    elsif q.question_type = 'rating' then
      select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) into counts from (
        select r.answers ->> q.id::text as k, count(*) as n from survey_responses r
        where r.answers ->> q.id::text is not null group by 1) t;
    else
      continue;
    end if;
    res := res || jsonb_build_array(jsonb_build_object('id', q.id, 'title', q.title, 'type', q.question_type, 'counts', counts));
  end loop;
  return jsonb_build_object('total', (select count(*) from survey_responses), 'questions', res);
end $$;
grant execute on function public.public_pulse() to anon, authenticated;
-- Tidak ada data awal: judul, deskripsi, dan pertanyaan diisi sendiri lewat halaman admin.
