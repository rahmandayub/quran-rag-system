import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Amiri } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/i18n/context';

const amiri = Amiri({
    weight: ['400', '700'],
    subsets: ['arabic'],
    variable: '--font-amiri',
});

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export const metadata: Metadata = {
    title: 'Quran RAG - Platform Dakwah AI',
    description:
        "Tanya jawab Al-Qur'an dengan referensi ayat yang akurat menggunakan AI",
    keywords: ['Quran', "Al-Qur'an", 'Dakwah', 'AI', 'Islam', 'RAG'],
    authors: [{ name: 'Quran RAG Team' }],
    openGraph: {
        title: 'Quran RAG - Platform Dakwah AI',
        description:
            "Tanya jawab Al-Qur'an dengan referensi ayat yang akurat menggunakan AI",
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} antialiased`}
            >
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </body>
        </html>
    );
}
