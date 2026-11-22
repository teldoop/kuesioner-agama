-- Migrasi untuk database yang dibuat dari versi lama. Aman dijalankan ulang.

-- 1) Jenis pertanyaan baru (baris lama tidak divalidasi ulang; hapus/ubah manual di admin)
alter table survey_questions drop constraint if exists survey_questions_question_type_check;
alter table survey_questions add constraint survey_questions_question_type_check
  check (question_type in ('multiple_choice','slider','rating','card_swipe','branching_choice','open_text')) not valid;

-- 2) Pengaturan: tipe hasil akhir diatur di admin
alter table survey_settings add column if not exists result_types jsonb not null default '[]'::jsonb;
alter table survey_settings alter column title set default '';
alter table survey_settings alter column description set default '';

-- 3) Tidak lagi mencatat status valid (berdasarkan durasi) maupun demografi
drop function if exists public.public_stats();
alter table survey_responses drop column if exists is_valid;
alter table survey_responses drop column if exists demographics;

-- 4) Hasil komunitas generik (agregat publik, hanya untuk pertanyaan yang diaktifkan di admin)
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


-- 5) OPSIONAL, hanya jika ingin mulai dari nol (menghapus pertanyaan, jawaban uji, dan pengaturan lama):
-- delete from survey_responses;
-- delete from survey_questions;
-- delete from survey_settings;
