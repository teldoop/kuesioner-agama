'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ResponseRow } from '@/lib/types';

export interface LiveEvent<T = any> { type: 'INSERT' | 'UPDATE' | 'DELETE'; row: T; old: Partial<T> & { id?: string } }

/** Langganan perubahan sebuah tabel lewat Supabase Realtime (dibatasi RLS). */
export function useTableLive<T = any>(table: string, handler: (e: LiveEvent<T>) => void) {
  const [status, setStatus] = useState('CONNECTING');
  const ref = useRef(handler); ref.current = handler;
  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel(`${table}-` + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table },
        (p: any) => ref.current({ type: p.eventType, row: p.new, old: p.old }))
      .subscribe((s) => setStatus(s));
    return () => { sb.removeChannel(ch); };
  }, [table]);
  return status;
}

export const useResponsesLive = (handler: (e: LiveEvent<ResponseRow>) => void) => useTableLive<ResponseRow>('survey_responses', handler);

export function applyLive<T extends { id: string }>(rows: T[], e: LiveEvent<T>): T[] {
  if (e.type === 'INSERT') return rows.some((x) => x.id === e.row.id) ? rows : [e.row, ...rows];
  if (e.type === 'UPDATE') return rows.map((x) => (x.id === e.row.id ? e.row : x));
  return rows.filter((x) => x.id !== e.old.id);
}
