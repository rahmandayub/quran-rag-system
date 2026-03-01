'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SurahData, SurahVerseData, VerseReference } from '@/types';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    Maximize2,
    Minimize2,
    BookOpen,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';
import { VerseCardSkeleton } from './VerseCardSkeleton';

interface FullSurahViewProps {
    surahNumber: number;
    onClose: () => void;
    references?: VerseReference[];
}

interface QuranAyah {
    number: number;
    text: string;
    numberInSurah: number;
}

// Swipe detection constants
const SWIPE_THRESHOLD = 50;
const SWIPE_MIN_DISTANCE = 30;

// Lazy loading verse component for FullSurahView
interface LazyFullSurahVerseProps {
    verse: SurahVerseData;
    index: number;
    surah: SurahData;
    isInitiallyVisible: boolean;
    selectedVerse: number | null;
    isArabicLarge: boolean;
    copiedVerse: number | null;
    expandedVerse: number | null;
    language: string;
    currentSurah: number;
    onSelectVerse: (verse: number | null) => void;
    onCopyVerse: (verse: SurahVerseData) => Promise<void>;
    onSetExpandedVerse: (verse: number | null) => void;
}

function LazyFullSurahVerse({
    verse,
    index,
    surah,
    isInitiallyVisible,
    selectedVerse,
    isArabicLarge,
    copiedVerse,
    expandedVerse,
    onSelectVerse,
    onCopyVerse,
    onSetExpandedVerse,
}: LazyFullSurahVerseProps) {
    const [shouldRender, setShouldRender] = useState(isInitiallyVisible);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only observe if not initially visible
        if (isInitiallyVisible) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldRender(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [isInitiallyVisible]);

    return (
        <div
            ref={elementRef}
            id={`verse-${verse.verse_number}`}
            className={`
                group relative overflow-hidden rounded-2xl sm:rounded-3xl 
                transition-all duration-300
                ${selectedVerse === verse.verse_number
                    ? 'border-2 border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-500/10 dark:border-emerald-600 dark:bg-emerald-900/20'
                    : 'border border-emerald-100/50 bg-white/60 hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/30 dark:bg-gray-800/60'
                }
                animate-fade-in
            `}
            style={{ animationDelay: isInitiallyVisible ? `${Math.min(index * 30, 300)}ms` : '0ms' }}
            onClick={() => onSelectVerse(verse.verse_number)}
        >
            {shouldRender ? (
                <>
                    {/* Verse header */}
                    <div className="flex items-center justify-between border-b border-emerald-100/50 bg-linear-to-r from-emerald-50/80 to-transparent px-3 py-2.5 dark:border-emerald-900/30 dark:from-emerald-900/10 sm:px-5 sm:py-3">
                        <div className="flex items-center gap-2.5">
                            <span
                                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-700 text-sm sm:text-base font-bold text-white shadow-md"
                                role="img"
                                aria-label={`Ayat ${verse.verse_number}`}
                            >
                                {verse.verse_number}
                            </span>
                            {/* Quick info on mobile */}
                            <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                                Juz {surah.revelation_place === 'makkah' ? 'Makkiyah' : 'Madaniyah'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {/* Expand/Collapse toggle for mobile */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetExpandedVerse(expandedVerse === verse.verse_number ? null : verse.verse_number);
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-emerald-100/50 hover:text-emerald-600 active:scale-95 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 sm:hidden"
                                aria-label={expandedVerse === verse.verse_number ? 'Sembunyikan terjemahan' : 'Tampilkan terjemahan'}
                            >
                                {expandedVerse === verse.verse_number ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </button>
                            {/* Copy button - Larger tap target */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopyVerse(verse);
                                }}
                                className="relative flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-emerald-100/50 hover:text-emerald-600 hover:scale-110 active:scale-90 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
                                aria-label="Salin ayat"
                            >
                                {copiedVerse === verse.verse_number ? (
                                    <Check className="h-5 w-5 text-emerald-500 animate-scale-in" />
                                ) : (
                                    <Copy className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Arabic text */}
                    <div className="px-3 py-5 sm:px-5 sm:py-8">
                        <p
                            className={`
                                font-amiri
                                leading-[2.2] sm:leading-[2.4]
                                text-emerald-900 dark:text-emerald-100
                                transition-all duration-300
                                break-all
                                ${isArabicLarge
                                    ? 'text-3xl sm:text-4xl md:text-5xl'
                                    : 'text-2xl sm:text-3xl md:text-4xl'
                                }
                            `}
                            dir="rtl"
                            lang="ar"
                            style={{
                                textAlign: 'right',
                                WebkitFontSmoothing: 'antialiased',
                                MozOsxFontSmoothing: 'grayscale',
                                fontFeatureSettings: '"liga" 1, "calt" 1',
                                textRendering: 'optimizeLegibility',
                            }}
                        >
                            {verse.verse_arabic}
                        </p>
                    </div>

                    {/* Translation - Collapsible on mobile */}
                    <div className={`
                        border-t border-emerald-100/50 bg-emerald-50/40 
                        px-3 py-4 sm:px-5 sm:py-5
                        dark:border-emerald-900/30 dark:bg-emerald-900/10
                        transition-all duration-300
                        ${expandedVerse === verse.verse_number || expandedVerse === null ? 'block' : 'hidden sm:block'}
                    `}>
                        <div className="flex items-start gap-2">
                            <div className="mt-1 h-4 w-1 shrink-0 rounded-full bg-emerald-400" />
                            <p className="text-[15px] sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
                                {verse.verse_indonesian}
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <VerseCardSkeleton variant="full" />
            )}
        </div>
    );
}

export function FullSurahView({ surahNumber, onClose, references }: FullSurahViewProps) {
    const { language } = useLanguage();

    // Get unique surah numbers from references and sort them (memoized)
    const referencedSurahs = useMemo(() =>
        references
            ? Array.from(new Set(references.map(ref => ref.surah_number))).sort((a, b) => a - b)
            : [],
        [references]
    );

    const [currentSurah, setCurrentSurah] = useState(surahNumber);
    const [surah, setSurah] = useState<SurahData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
    const [isArabicLarge, setIsArabicLarge] = useState(false);
    const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
    const [expandedVerse, setExpandedVerse] = useState<number | null>(null);
    const [isNavigating, setIsNavigating] = useState<'prev' | 'next' | null>(null);
    const [showVerseJump, setShowVerseJump] = useState(false);
    const [verseJumpInput, setVerseJumpInput] = useState('');
    const [renderedVerseCount, setRenderedVerseCount] = useState(15);

    // Touch/swipe handling
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);
    const touchStartTime = useRef<number>(0);
    const modalRef = useRef<HTMLDivElement>(null);
    const versesContainerRef = useRef<HTMLDivElement>(null);

    // Reset rendered verse count when surah changes
    useEffect(() => {
        setRenderedVerseCount(15);
    }, [currentSurah]);

    useEffect(() => {
        const fetchSurah = async () => {
            try {
                setLoading(true);
                // Fetch Arabic text
                const arResponse = await fetch(
                    `https://api.alquran.cloud/v1/surah/${currentSurah}/quran-uthmani`,
                );
                if (!arResponse.ok) {
                    throw new Error('Failed to fetch Arabic text');
                }
                const arData = await arResponse.json();

                // Fetch Indonesian translation
                const idResponse = await fetch(
                    `https://api.alquran.cloud/v1/surah/${currentSurah}/id.indonesian`,
                );
                if (!idResponse.ok) {
                    throw new Error('Failed to fetch Indonesian translation');
                }
                const idData = await idResponse.json();

                // Fetch English translation (optional but good for completeness)
                const enResponse = await fetch(
                    `https://api.alquran.cloud/v1/surah/${currentSurah}/en.asad`,
                );
                const enData = enResponse.ok ? await enResponse.json() : null;

                // Combine Arabic, Indonesian, and English
                const verses: SurahVerseData[] = arData.data.ayahs.map(
                    (ayah: QuranAyah, index: number) => ({
                        verse_number: ayah.numberInSurah,
                        verse_arabic: ayah.text,
                        verse_indonesian: idData.data.ayahs[index].text,
                        verse_english: enData
                            ? enData.data.ayahs[index].text
                            : '',
                    }),
                );

                // Remove Basmalah from first verse of surahs except Al-Fatiha (1)
                // For quran-uthmani, it's often at the very beginning of the first ayah text
                if (currentSurah !== 1 && verses.length > 0) {
                    const bismillah = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
                    if (verses[0].verse_arabic.startsWith(bismillah)) {
                        verses[0].verse_arabic = verses[0].verse_arabic
                            .substring(bismillah.length)
                            .trim();
                    }
                }

                const surahData: SurahData = {
                    surah_number: arData.data.number,
                    surah_name: arData.data.name, // Default to Arabic name (will be overridden by language selector)
                    surah_name_en: arData.data.englishNameTranslation,
                    surah_name_id: arData.data.englishName, // Indonesian uses Latin transliteration
                    surah_name_latin: arData.data.englishName, // Latin name (same as englishName)
                    surah_name_arabic: arData.data.name,
                    verses_count: arData.data.numberOfAyahs,
                    revelation_place:
                        arData.data.revelationType === 'Meccan'
                            ? 'makkah'
                            : 'madinah',
                    verses,
                };

                setSurah(surahData);
                setError(null);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
            } finally {
                setLoading(false);
            }
        };

        fetchSurah();
    }, [currentSurah]);

    // Swipe gesture handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX.current;
        const deltaY = touchEndY - touchStartY.current;
        const elapsedTime = Date.now() - touchStartTime.current;

        // Only process horizontal swipes that are faster than vertical movement
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_MIN_DISTANCE && elapsedTime < 300) {
            if (deltaX > SWIPE_THRESHOLD) {
                // Swipe right - go to previous surah
                if (referencedSurahs.length > 0) {
                    const currentIndex = referencedSurahs.indexOf(currentSurah);
                    if (currentIndex > 0) {
                        setIsNavigating('prev');
                        setCurrentSurah(referencedSurahs[currentIndex - 1]);
                        setTimeout(() => setIsNavigating(null), 300);
                    }
                } else if (currentSurah > 1) {
                    setIsNavigating('prev');
                    setCurrentSurah(currentSurah - 1);
                    setTimeout(() => setIsNavigating(null), 300);
                }
            } else if (deltaX < -SWIPE_THRESHOLD) {
                // Swipe left - go to next surah
                if (referencedSurahs.length > 0) {
                    const currentIndex = referencedSurahs.indexOf(currentSurah);
                    if (currentIndex < referencedSurahs.length - 1) {
                        setIsNavigating('next');
                        setCurrentSurah(referencedSurahs[currentIndex + 1]);
                        setTimeout(() => setIsNavigating(null), 300);
                    }
                } else if (currentSurah < 114) {
                    setIsNavigating('next');
                    setCurrentSurah(currentSurah + 1);
                    setTimeout(() => setIsNavigating(null), 300);
                }
            }
        }
    }, [currentSurah, referencedSurahs]);

    const handleCopyVerse = async (verse: SurahVerseData) => {
        const surahName = language === 'en' ? surah?.surah_name_en : language === 'ar' ? surah?.surah_name_arabic : surah?.surah_name_latin;
        const textToCopy = `QS ${surahName} (${currentSurah}):${verse.verse_number}\n${verse.verse_arabic}\n${verse.verse_indonesian}`;
        
        // Check if clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToCopy);
            setCopiedVerse(verse.verse_number);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopiedVerse(verse.verse_number);
            } catch (err) {
                console.error('Failed to copy text', err);
            }
            document.body.removeChild(textArea);
        }
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        setTimeout(() => setCopiedVerse(null), 2000);
    };

    const handlePreviousSurah = () => {
        if (referencedSurahs.length > 0) {
            // Find current index in referenced surahs
            const currentIndex = referencedSurahs.indexOf(currentSurah);
            // Navigate to previous surah in references
            if (currentIndex > 0) {
                setIsNavigating('prev');
                setCurrentSurah(referencedSurahs[currentIndex - 1]);
                setTimeout(() => setIsNavigating(null), 300);
            }
        } else if (currentSurah > 1) {
            // Fallback: no references, navigate all surahs
            setIsNavigating('prev');
            setCurrentSurah(currentSurah - 1);
            setTimeout(() => setIsNavigating(null), 300);
        }
    };

    const handleNextSurah = () => {
        if (referencedSurahs.length > 0) {
            // Find current index in referenced surahs
            const currentIndex = referencedSurahs.indexOf(currentSurah);
            // Navigate to next surah in references
            if (currentIndex < referencedSurahs.length - 1) {
                setIsNavigating('next');
                setCurrentSurah(referencedSurahs[currentIndex + 1]);
                setTimeout(() => setIsNavigating(null), 300);
            }
        } else if (currentSurah < 114) {
            // Fallback: no references, navigate all surahs
            setIsNavigating('next');
            setCurrentSurah(currentSurah + 1);
            setTimeout(() => setIsNavigating(null), 300);
        }
    };

    const handleVerseJump = () => {
        const verseNum = parseInt(verseJumpInput, 10);
        if (verseNum >= 1 && verseNum <= (surah?.verses_count || 0)) {
            const verseElement = document.getElementById(`verse-${verseNum}`);
            verseElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setSelectedVerse(verseNum);
            setShowVerseJump(false);
            setVerseJumpInput('');
        }
    };

    const getCurrentIndex = () => {
        if (referencedSurahs.length > 0) {
            return referencedSurahs.indexOf(currentSurah) + 1;
        }
        return currentSurah;
    };

    const getTotalCount = () => {
        if (referencedSurahs.length > 0) {
            return referencedSurahs.length;
        }
        return 114;
    };

    const canGoPrevious = referencedSurahs.length > 0 
        ? referencedSurahs.indexOf(currentSurah) > 0 
        : currentSurah > 1;

    const canGoNext = referencedSurahs.length > 0 
        ? referencedSurahs.indexOf(currentSurah) < referencedSurahs.length - 1 
        : currentSurah < 114;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 dark:bg-gray-800 shadow-2xl">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
                            <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                        </div>
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                            Memuat Surah...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !surah) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 dark:bg-gray-800 shadow-2xl">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-lg font-medium text-red-600 dark:text-red-400">
                            {error || 'Surah not found'}
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-white font-medium hover:bg-emerald-700 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 overflow-hidden"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Modal Container - Responsive sizing */}
            <div
                ref={modalRef}
                className={`
                    relative flex w-full sm:max-w-6xl flex-col
                    bg-linear-to-br from-cream-50 to-emerald-50/20
                    dark:from-gray-900 dark:to-teal-950
                    sm:rounded-3xl sm:shadow-2xl
                    overflow-hidden
                    h-dvh sm:h-[90dvh]
                    transition-all duration-300 ease-out
                    ${isNavigating === 'prev' ? 'sm:translate-x-4 sm:opacity-50' : ''}
                    ${isNavigating === 'next' ? 'sm:-translate-x-4 sm:opacity-50' : ''}
                    animate-slide-up
                `}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Gradient indicator at top for scroll hint */}
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-400/50 to-transparent" />

                {/* Header - Sticky with glass effect */}
                <header className="sticky top-0 z-20 shrink-0 border-b border-emerald-100/50 bg-white/80 backdrop-blur-xl dark:border-emerald-900/30 dark:bg-gray-900/80">
                    <div className="px-3 py-2 sm:px-6 sm:py-3">
                        {/* Main header row */}
                        <div className="relative flex items-center justify-between">
                            {/* Close button - Left side */}
                            <button
                                onClick={onClose}
                                className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-gray-600 transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-emerald-900/20"
                                aria-label="Tutup"
                            >
                                <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                            </button>

                            {/* Surah Info - Absolutely centered */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <h2 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {language === 'en' ? surah.surah_name_en : language === 'ar' ? surah.surah_name_arabic : surah.surah_name_latin}
                                </h2>
                                {language === 'ar' && (
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {surah.surah_name_latin}
                                    </span>
                                )}
                            </div>

                            {/* Navigation buttons - Right side, same width as close button */}
                            <div className="flex items-center gap-1.5 w-22 justify-end">
                                <button
                                    onClick={handlePreviousSurah}
                                    disabled={!canGoPrevious}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-emerald-600 transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-gray-800/60 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                    aria-label="Surah sebelumnya"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleNextSurah}
                                    disabled={!canGoNext}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-emerald-600 transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-gray-800/60 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                    aria-label="Surah berikutnya"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom row: Progress indicator (only for referenced surahs) */}
                        {referencedSurahs.length > 0 && (
                            <div className="mt-2 flex items-center justify-center">
                                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-1">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                        {getCurrentIndex()} / {getTotalCount()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Verses Container - Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                    <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
                        {/* Basmalah for all surahs except At-Tawbah (9) */}
                        {surahNumber !== 9 && (
                            <div className="mb-6 sm:mb-8 py-4 sm:py-6 text-center">
                                <div className="relative">
                                    {/* Decorative ornaments */}
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-16 sm:w-24 bg-linear-to-r from-emerald-400 to-transparent" />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-16 sm:w-24 bg-linear-to-l from-emerald-400 to-transparent" />
                                    <p className="font-amiri text-2xl sm:text-3xl md:text-4xl text-emerald-800 dark:text-emerald-200 leading-loose">
                                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Verse Cards */}
                        <div ref={versesContainerRef} className="space-y-3 sm:space-y-4 pb-20">
                            {surah.verses.map((verse, index) => (
                                <LazyFullSurahVerse
                                    key={verse.verse_number}
                                    verse={verse}
                                    index={index}
                                    surah={surah}
                                    isInitiallyVisible={index < renderedVerseCount}
                                    selectedVerse={selectedVerse}
                                    isArabicLarge={isArabicLarge}
                                    copiedVerse={copiedVerse}
                                    expandedVerse={expandedVerse}
                                    language={language}
                                    currentSurah={currentSurah}
                                    onSelectVerse={setSelectedVerse}
                                    onCopyVerse={handleCopyVerse}
                                    onSetExpandedVerse={setExpandedVerse}
                                />
                            ))}
                            {/* Load more trigger */}
                            {renderedVerseCount < surah.verses.length && (
                                <div className="flex justify-center py-4">
                                    <button
                                        onClick={() => setRenderedVerseCount(prev => Math.min(prev + 20, surah.verses.length))}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        Load More Verses ({surah.verses.length - renderedVerseCount} remaining)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Action Bar - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-linear-to-t from-cream-50 via-cream-50/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 pointer-events-none">
                    <div className="flex items-center justify-end gap-2 pointer-events-auto">
                        {/* Verse Jump Button */}
                        <button
                            onClick={() => setShowVerseJump(!showVerseJump)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-gray-600 shadow-lg backdrop-blur-sm transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-emerald-900/20"
                            aria-label="Lompat ke ayat"
                        >
                            <BookOpen className="h-5 w-5" />
                        </button>

                        {/* Arabic text size toggle */}
                        <button
                            onClick={() => setIsArabicLarge(!isArabicLarge)}
                            className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-medium text-emerald-600 shadow-lg backdrop-blur-sm transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95 dark:bg-gray-800/90 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        >
                            {isArabicLarge ? (
                                <>
                                    <Minimize2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Perkecil</span>
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Perbesar</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Verse Jump Input - Collapsible */}
                    {showVerseJump && (
                        <div className="absolute bottom-full right-0 mb-2 flex items-center gap-2 rounded-xl bg-white/95 p-2 shadow-xl backdrop-blur-sm dark:bg-gray-800/95 animate-scale-in">
                            <input
                                type="number"
                                value={verseJumpInput}
                                onChange={(e) => setVerseJumpInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerseJump()}
                                placeholder={`1-${surah.verses_count}`}
                                className="h-10 w-20 rounded-lg border border-emerald-200 bg-white px-3 text-center text-sm font-medium text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-gray-900 dark:text-white"
                                min={1}
                                max={surah.verses_count}
                                autoFocus
                            />
                            <button
                                onClick={handleVerseJump}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
                                aria-label="Lompat"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowVerseJump(false);
                                    setVerseJumpInput('');
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                                aria-label="Batal"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Scroll progress indicator */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-emerald-400 via-emerald-500 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            {/* Inline styles for animations */}
            <style>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out backwards;
                }

                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }

                @media (prefers-reduced-motion: reduce) {
                    .animate-slide-up,
                    .animate-fade-in,
                    .animate-scale-in {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
