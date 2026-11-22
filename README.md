# Survei Boikot & Preferensi Konsumen
1. `npm install`
2. Jalankan `supabase/schema.sql` di Supabase SQL Editor.
3. Salin `.env.example` ke `.env.local`, isi URL & anon key.
4. Supabase > Authentication: buat user admin (Add user), lalu matikan "Allow new users to sign up".
5. `npm run dev` -> `/` (responden), `/admin/login` (admin).
6. Deploy ke Vercel: set 2 env var yang sama.
