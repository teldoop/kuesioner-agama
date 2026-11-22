import type { Metadata } from 'next';
import Survey from '@/components/survey/Survey';
import { getQuestions, getSettings } from '@/lib/survey-data';
import { SITE_NAME, SITE_URL } from '@/lib/site';
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  // Judul = judul kuesioner, deskripsi = deskripsi halaman pembuka, gambar kartu dibuat otomatis di /og
  const title = s.title || SITE_NAME;
  const description = s.description || SITE_NAME;
  const image = { url: '/og', width: 1200, height: 630, alt: title };
  return {
    title, description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', url: SITE_URL, siteName: SITE_NAME, locale: 'id_ID', title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

export default async function Home() {
  const [settings, questions] = await Promise.all([getSettings(), getQuestions()]);
  return <Survey settings={settings} questions={questions} />;
}
