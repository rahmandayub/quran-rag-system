'use client';

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Message, VerseReference } from '@/types';
import { ScrollText, Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

interface ChatMessageProps {
    message: Message;
    onViewFullSurah?: (surahNumber: number) => void;
    onToggleReferences?: (references: VerseReference[]) => void;
    isReferencesOpen?: boolean;
}

// Memoize the component to prevent unnecessary re-renders
export const ChatMessage = memo(function ChatMessage({
    message,
    onToggleReferences,
    isReferencesOpen,
}: ChatMessageProps) {
    const { t } = useLanguage();
    const isUser = message.role === 'user';
    const timestamp = message.timestamp.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const hasReferences =
        !isUser && message.references && message.references.length > 0;

    return (
        <div
            className={`flex w-full animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`flex max-w-[85%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
            >
                {/* Message bubble */}
                <div
                    className={`relative overflow-hidden px-5 py-3.5 transition-all duration-300 ${
                        isUser
                            ? 'rounded-2xl rounded-tr-none bg-linear-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-500/20'
                            : 'rounded-2xl rounded-tl-none glass text-gray-900 dark:text-gray-100'
                    }`}
                >
                    {isUser ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                        </div>
                    ) : (
                        <div className="text-sm leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    p: (props) => (
                                        <p
                                            className="text-sm leading-relaxed mb-2"
                                            {...props}
                                        />
                                    ),
                                    h1: (props) => (
                                        <h1
                                            className="text-lg font-bold mt-4 mb-2"
                                            {...props}
                                        />
                                    ),
                                    h2: (props) => (
                                        <h2
                                            className="text-base font-bold mt-3 mb-2"
                                            {...props}
                                        />
                                    ),
                                    h3: (props) => (
                                        <h3
                                            className="text-base font-semibold mt-2 mb-1"
                                            {...props}
                                        />
                                    ),
                                    h4: (props) => (
                                        <h4
                                            className="text-sm font-semibold mt-2 mb-1"
                                            {...props}
                                        />
                                    ),
                                    strong: (props) => (
                                        <strong
                                            className="font-bold"
                                            {...props}
                                        />
                                    ),
                                    em: (props) => (
                                        <em className="italic" {...props} />
                                    ),
                                    ul: (props) => (
                                        <ul
                                            className="list-disc list-outside ml-6 my-2 space-y-1"
                                            {...props}
                                        />
                                    ),
                                    ol: (props) => (
                                        <ol
                                            className="list-decimal list-outside ml-6 my-2 space-y-1"
                                            {...props}
                                        />
                                    ),
                                    li: (props) => (
                                        <li
                                            className="text-sm leading-relaxed"
                                            {...props}
                                        />
                                    ),
                                    blockquote: (props) => (
                                        <blockquote
                                            className="border-l-4 border-emerald-500 pl-4 my-2 italic text-gray-600 dark:text-gray-400"
                                            {...props}
                                        />
                                    ),
                                    code: ({
                                        inline,
                                        children,
                                        ...props
                                    }: {
                                        inline?: boolean;
                                        children?: React.ReactNode;
                                    }) =>
                                        inline ? (
                                            <code
                                                className="bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm text-emerald-800 dark:text-emerald-300"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        ) : (
                                            <code
                                                className="block bg-gray-50 dark:bg-gray-900 p-3 rounded-xl my-2 overflow-x-auto text-sm border border-gray-100 dark:border-gray-700"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        ),
                                    a: (props) => (
                                        <a
                                            className="text-emerald-600 hover:underline dark:text-emerald-400"
                                            {...props}
                                        />
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Footer actions: Toggle references */}
                {hasReferences && (
                    <div className="mt-1">
                        <button
                            onClick={() =>
                                onToggleReferences?.(message.references!)
                            }
                            className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 ${
                                isReferencesOpen
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            }`}
                        >
                            <ScrollText className="h-3 w-3" />
                            {t('chat.references_count', { count: message.references!.length })}
                        </button>
                    </div>
                )}

                {/* Timestamp */}
                <span
                    className={`text-[10px] uppercase font-bold tracking-tight text-gray-400 dark:text-gray-500`}
                >
                    {timestamp}
                </span>
            </div>
        </div>
    );
});

// Loading skeleton component for SSR - Animated thinking indicator
export function ChatMessageSkeleton() {
    const { t } = useLanguage();
    
    return (
        <div className="flex w-full animate-fade-in-up justify-start">
            <div className="flex max-w-[85%] flex-col gap-2 items-start">
                {/* Thinking indicator with animated dots */}
                <div className="rounded-2xl rounded-tl-none glass px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {t('chat.thinking')}
                        </span>
                        <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
