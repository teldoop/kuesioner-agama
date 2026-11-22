import { createClient } from '@supabase/supabase-js';

// Next.js menyimpan hasil fetch() sisi server di Data Cache (folder .next/cache) dan supabase-js memakai fetch.
// Paksa tanpa cache agar perubahan dari admin langsung terlihat.
const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });

// Klien anon untuk Server Component / Route Handler (tanpa sesi)
export const publicClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  });
