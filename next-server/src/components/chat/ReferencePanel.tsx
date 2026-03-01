'use client';

import React, { memo } from 'react';
import { VerseReference } from '@/types';
import { LazyVerseCard } from './LazyVerseCard';
import { X, BookOpen, Layers } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

interface ReferencePanelProps {
    references: VerseReference[];
    isOpen: boolean;
    onClose: () => void;
    onViewFullSurah?: (surahNumber: number) => void;
    variant?: 'mobile' | 'desktop';
}

export function ReferencePanel({
    references,
    isOpen,
    onClose,
    onViewFullSurah,
    variant = 'desktop',
}: ReferencePanelProps) {
    const { t, language } = useLanguage();
    const isMobile = variant === 'mobile';

    // Group references by surah
    const groupedBySurah = references.reduce((acc, ref) => {
        if (!acc[ref.surah_number]) {
            acc[ref.surah_number] = {
                surah_number: ref.surah_number,
                surah_name: ref.surah_name,
                surah_name_en: ref.surah_name_en,
                surah_name_id: ref.surah_name_id,
                surah_name_latin: ref.surah_name_latin || ref.surah_name_en,
                surah_name_arabic: ref.surah_name_arabic,
                verses: [],
            };
        }
        acc[ref.surah_number].verses.push(ref);
        return acc;
    }, {} as Record<number, { surah_number: number; surah_name: string; surah_name_en: string; surah_name_id: string; surah_name_latin: string; surah_name_arabic: string; verses: VerseReference[] }>);

    const surahGroups = Object.values(groupedBySurah);

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobile && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                    style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Panel Container */}
            <aside
                className={`${isMobile
                    ? `fixed bottom-0 left-0 right-0 z-50 h-[85dvh] rounded-t-2xl bg-white/80 shadow-2xl backdrop-blur-xl transition-transform duration-300 dark:bg-gray-900/80 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`
                    : `h-full w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl`
                }`}
                style={{ pointerEvents: isOpen || !isMobile ? 'auto' : 'none' }}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-emerald-100/20 bg-white/40 px-4 py-3 dark:border-emerald-900/10 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                                    {t('chat.references_title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {references.length} {t('chat.verse')} {language === 'en' ? 'from' : language === 'ar' ? 'من' : 'dari'} {surahGroups.length} {t('surah.unit')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
                            aria-label={t('common.close')}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* References List */}
                    <div className="flex-1 overflow-y-auto bg-emerald-50/30 px-4 py-4 dark:bg-emerald-950/20">
                        {references.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                    <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {t('chat.no_references')}
                                </h3>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {t('chat.references_title')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-4">
                                {surahGroups.map((group) => (
                                    <SurahCard
                                        key={group.surah_number}
                                        group={group}
                                        onViewFullSurah={onViewFullSurah}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

// Surah Card Component - Contains header and nested verses
interface SurahCardProps {
    group: {
        surah_number: number;
        surah_name: string;
        surah_name_en: string;
        surah_name_id: string;
        surah_name_latin: string;
        surah_name_arabic: string;
        verses: VerseReference[];
    };
    onViewFullSurah?: (surahNumber: number) => void;
}

const SurahCard = memo(({ group, onViewFullSurah }: SurahCardProps) => {
    const { t, language } = useLanguage();
    const verseNumbers = group.verses.map(v => v.verse_number).sort((a, b) => a - b);
    const displayVerses = verseNumbers.length === 1
        ? `${t('chat.verse')} ${verseNumbers[0]}`
        : verseNumbers.length === 2
            ? `${t('chat.verse')} ${verseNumbers[0]}-${verseNumbers[1]}`
            : `${t('chat.verse')} ${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]} (${verseNumbers.length} ${t('chat.verses')})`;

    return (
        <div className="overflow-hidden rounded-xl border border-emerald-100/30 bg-white/60 shadow-sm backdrop-blur-sm dark:border-emerald-900/30 dark:bg-gray-900/60">
            {/* Surah Header */}
            <div className="flex items-center gap-3 bg-linear-to-r from-emerald-50/80 to-transparent px-4 py-3 dark:from-emerald-900/30">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-500/30">
                    <span className="text-sm font-bold">{group.surah_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {language === 'en' ? group.surah_name_en : language === 'ar' ? group.surah_name_arabic : group.surah_name_latin}
                        </h3>
                        {language === 'ar' && (
                            <>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {group.surah_name_latin}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5">
                            <Layers className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                {displayVerses}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested Verses */}
            <div className="divide-y divide-emerald-100/20 dark:divide-emerald-900/20">
                {group.verses.map((ref) => (
                    <div key={`${ref.surah_number}:${ref.verse_number}`} className="p-3">
                        <LazyVerseCard
                            reference={ref}
                            onViewFullSurah={onViewFullSurah}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

SurahCard.displayName = 'SurahCard';
