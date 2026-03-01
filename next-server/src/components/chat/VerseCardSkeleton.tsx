'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

interface VerseCardSkeletonProps {
    variant?: 'compact' | 'full';
}

export function VerseCardSkeleton({ variant = 'compact' }: VerseCardSkeletonProps) {
    const isFull = variant === 'full';

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-emerald-100/50 bg-white/40 dark:border-emerald-900/30 dark:bg-gray-800/40">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-100/30 bg-linear-to-r from-emerald-600 to-emerald-800 px-5 py-4 dark:border-emerald-900/30">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                        <BookOpen className="h-4 w-4 text-white/60" />
                    </div>
                    <div className="h-5 w-32 rounded bg-white/20 animate-pulse" />
                </div>
                <div className="h-5 w-12 rounded bg-white/20 animate-pulse" />
            </div>

            {/* Arabic Text */}
            <div className="border-b border-emerald-100 px-5 py-6 dark:border-emerald-900/30">
                <div className="space-y-2">
                    <div className="h-6 w-full rounded bg-emerald-100/50 dark:bg-emerald-900/30 animate-pulse" />
                    <div className="h-6 w-5/6 rounded bg-emerald-100/50 dark:bg-emerald-900/30 animate-pulse" />
                    {isFull && (
                        <>
                            <div className="h-6 w-4/6 rounded bg-emerald-100/50 dark:bg-emerald-900/30 animate-pulse" />
                            <div className="h-6 w-3/4 rounded bg-emerald-100/50 dark:bg-emerald-900/30 animate-pulse" />
                        </>
                    )}
                </div>
            </div>

            {/* Translation */}
            <div className="bg-white/30 px-6 py-5 dark:bg-black/20">
                <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-gray-200/50 dark:bg-gray-700/50 animate-pulse" />
                    <div className="h-4 w-11/12 rounded bg-gray-200/50 dark:bg-gray-700/50 animate-pulse" />
                    {isFull && (
                        <div className="h-4 w-10/12 rounded bg-gray-200/50 dark:bg-gray-700/50 animate-pulse" />
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <div className="flex items-center gap-4">
                    <div className="h-4 w-16 rounded bg-emerald-200/50 dark:bg-emerald-800/50 animate-pulse" />
                    <div className="h-4 w-16 rounded bg-emerald-200/50 dark:bg-emerald-800/50 animate-pulse" />
                </div>
                <div className="h-4 w-24 rounded bg-emerald-200/50 dark:bg-emerald-800/50 animate-pulse" />
            </div>
        </div>
    );
}
