'use client';

import React, { useState } from 'react';
import { VerseReference } from '@/types';
import {
    Copy,
    Check,
    Maximize2,
    Minimize2,
    BookOpen,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

interface VerseCardProps {
    reference: VerseReference;
    onViewFullSurah?: (surahNumber: number) => void;
}

export const VerseCard = React.memo(({ reference, onViewFullSurah }: VerseCardProps) => {
    const { t, language } = useLanguage();
    const [isArabicLarge, setIsArabicLarge] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // Get the translation based on current language
    const verseTranslation = language === 'en'
        ? reference.verse_translation || reference.verse_indonesian
        : language === 'ar'
        ? reference.verse_translation || reference.verse_indonesian
        : reference.verse_translation || reference.verse_indonesian;

    const handleCopy = async () => {
        const referenceString = `QS ${reference.surah_name} (${reference.surah_number}):${reference.verse_number}`;
        const textToCopy = `${referenceString}\n${reference.verse_arabic}\n${verseTranslation}`;
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const relevancePercentage = Math.round(reference.relevance_score * 100);

    return (
        <div className="group w-full overflow-hidden rounded-2xl border border-emerald-100/50 bg-white/40 glass shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 dark:border-emerald-900/30 dark:bg-gray-800/40">
            {/* Header - Always visible */}
            <div
                className="flex items-center justify-between border-b border-emerald-100/30 bg-linear-to-r from-emerald-600 to-emerald-800 px-5 py-4 cursor-pointer select-none dark:border-emerald-900/30"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                        <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                            QS {language === 'en' ? reference.surah_name_latin : language === 'ar' ? reference.surah_name : reference.surah_name_id} (
                            {reference.surah_number}):{reference.verse_number}
                        </span>
                        {language === 'ar' && (
                            <span className="ml-2 text-xs text-emerald-100">
                                {reference.surah_name_latin}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Relevance badge */}
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                        <span className="text-xs font-semibold text-white">
                            {relevancePercentage}%
                        </span>
                    </div>
                    {/* Expand/Collapse indicator */}
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-white/80" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-white/80" />
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            <div
                className={`transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-500 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}
            >
                {/* Arabic Text with ornamental border */}
                <div className="relative border-b border-emerald-100 px-5 py-6 dark:border-emerald-900/30">
                    {/* Decorative corner ornaments */}
                    <div className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l-2 border-t-2 border-emerald-300 dark:border-emerald-700" />
                    <div className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r-2 border-t-2 border-emerald-300 dark:border-emerald-700" />
                    <div className="pointer-events-none absolute left-4 bottom-4 h-4 w-4 border-l-2 border-b-2 border-emerald-300 dark:border-emerald-700" />
                    <div className="pointer-events-none absolute right-4 bottom-4 h-4 w-4 border-r-2 border-b-2 border-emerald-300 dark:border-emerald-700" />

                    <p
                        className={`text-center font-amiri leading-loose text-emerald-900 transition-all duration-300 dark:text-emerald-100 ${
                            isArabicLarge ? 'text-4xl' : 'text-2xl'
                        }`}
                        dir="rtl"
                    >
                        {reference.verse_arabic}
                    </p>
                </div>

                {/* Translation */}
                <div className="bg-white/30 px-6 py-5 dark:bg-black/20">
                    <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 antialiased">
                        {verseTranslation}
                    </p>
                </div>

                {/* Footer actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsArabicLarge(!isArabicLarge)}
                            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                            {isArabicLarge ? (
                                <>
                                    <Minimize2 className="h-3.5 w-3.5" />
                                    {t('chat.collapse_arabic')}
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="h-3.5 w-3.5" />
                                    {t('chat.expand_arabic')}
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    {t('chat.copied')}
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    {t('chat.copy_verse')}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('chat.juz')} {reference.juz}
                        </span>
                        {onViewFullSurah && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewFullSurah(reference.surah_number);
                                }}
                                className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-md dark:bg-emerald-700 dark:hover:bg-emerald-600"
                            >
                                <BookOpen className="h-3.5 w-3.5" />
                                {t('chat.view_full_surah')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsed state preview */}
            {!isExpanded && (
                <div
                    className="border-t border-emerald-100 bg-emerald-50/30 px-4 py-3 text-sm text-gray-600 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-gray-400 cursor-pointer"
                    onClick={() => setIsExpanded(true)}
                >
                    <span className="line-clamp-2">
                        {verseTranslation}
                    </span>
                </div>
            )}
        </div>
    );
});

VerseCard.displayName = 'VerseCard';
