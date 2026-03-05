import type { Metadata, Viewport } from 'next';
import { Amiri, Lateef, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

// Font configurations
const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-amiri',
  display: 'swap',
});

const lateef = Lateef({
  weight: ['400', '600', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-lateef',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-cormorant',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf7f2',
};

export const metadata: Metadata = {
  title: 'QuranInsight - Intelligent Qur\'anic Knowledge',
  description:
    'A semantic knowledge platform for da\'wah. Search verses, uncover thematic connections, and build understanding rooted in authentic tafsir.',
  keywords: [
    'Quran',
    'Al-Qur\'an',
    'Tafsir',
    'Da\'wah',
    'Islamic Knowledge',
    'Semantic Search',
    'AI',
    'Islam',
  ],
  authors: [{ name: 'QuranInsight Team' }],
  openGraph: {
    title: 'QuranInsight - Intelligent Qur\'anic Knowledge',
    description:
      'Explore the Qur\'an with depth and clarity',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${amiri.variable} ${lateef.variable} ${cormorantGaramond.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
