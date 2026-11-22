'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ResponseRow } from '@/lib/types';

export interface LiveEvent { type: 'INSERT' | 'UPDATE' | 'DELETE'; row: ResponseRow; old: Partial<ResponseRow> }

/** Langganan perubahan survey_responses lewat Supabase Realtime (dibatasi RLS: hanya admin). */
export function useResponsesLive(handler: (e: LiveEvent) => void) {
  const [status, setStatus] = useState('CONNECTING');
  const ref = useRef(handler); ref.current = handler;
  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel('responses-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_responses' },
        (p: any) => ref.current({ type: p.eventType, row: p.new, old: p.old }))
      .subscribe((s) => setStatus(s));
    return () => { sb.removeChannel(ch); };
  }, []);
  return status;
}

export function applyLive(rows: ResponseRow[], e: LiveEvent): ResponseRow[] {
  if (e.type === 'INSERT') return rows.some((x) => x.id === e.row.id) ? rows : [e.row, ...rows];
  if (e.type === 'UPDATE') return rows.map((x) => (x.id === e.row.id ? e.row : x));
  return rows.filter((x) => x.id !== e.old.id);
}
