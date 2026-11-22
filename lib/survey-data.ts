import { cache } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { publicClient } from '@/lib/supabase/public';
import { KNOWN_TYPES } from '@/lib/qutil';
import type { Question, Settings } from '@/lib/types';

const EMPTY: Settings = { id: 1, title: '', description: '', estimated_minutes: 2, is_open: true, result_types: [] };

// Tanpa data bawaan: jika belum diisi di admin, hasilnya kosong
export const getSettings = cache(async (): Promise<Settings> => {
  noStore();
  try {
    const { data, error } = await publicClient().from('survey_settings').select('*').eq('id', 1).maybeSingle();
    if (error) console.error('getSettings', error.message);
    if (data) return { ...EMPTY, ...data, result_types: Array.isArray(data.result_types) ? data.result_types : [] } as Settings;
  } catch (e) { console.error('getSettings', e); }
  return EMPTY;
});

export const getQuestions = cache(async (): Promise<Question[]> => {
  noStore();
  try {
    const { data, error } = await publicClient().from('survey_questions').select('*').eq('is_active', true).order('order_index');
    if (error) console.error('getQuestions', error.message);
    return ((data ?? []) as Question[]).filter((q) => KNOWN_TYPES.includes(q.question_type));
  } catch (e) { console.error('getQuestions', e); }
  return [];
});
