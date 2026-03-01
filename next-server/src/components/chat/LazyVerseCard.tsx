'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { VerseReference } from '@/types';
import { VerseCard } from './VerseCard';
import { VerseCardSkeleton } from './VerseCardSkeleton';

interface LazyVerseCardProps {
    reference: VerseReference;
    onViewFullSurah?: (surahNumber: number) => void;
    rootMargin?: string;
}

export const LazyVerseCard = memo(({
    reference,
    onViewFullSurah,
    rootMargin = '200px',
}: LazyVerseCardProps) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [hasBeenObserved, setHasBeenObserved] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    const handleIntersection = useCallback(([entry]: IntersectionObserverEntry[]) => {
        if (entry.isIntersecting && !hasBeenObserved) {
            setHasBeenObserved(true);
            // Small delay to ensure smooth transition
            setTimeout(() => {
                setShouldRender(true);
            }, 50);
        }
    }, [hasBeenObserved]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersection, {
            root: null,
            rootMargin,
            threshold: 0,
        });

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
            observer.disconnect();
        };
    }, [handleIntersection, rootMargin]);

    return (
        <div
            ref={elementRef}
            className="w-full"
            style={{
                contain: shouldRender ? 'layout style' : 'none',
                contentVisibility: shouldRender ? 'auto' : 'visible',
            }}
        >
            {shouldRender ? (
                <VerseCard
                    reference={reference}
                    onViewFullSurah={onViewFullSurah}
                />
            ) : (
                <VerseCardSkeleton variant="compact" />
            )}
        </div>
    );
});

LazyVerseCard.displayName = 'LazyVerseCard';
