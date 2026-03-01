'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, VerseReference } from '@/types';
import { ChatInput } from '@/components/chat/ChatInput';
import {
    ChatMessage,
    ChatMessageSkeleton,
} from '@/components/chat/ChatMessage';
import { FullSurahView } from '@/components/chat/FullSurahView';
import { ReferencePanel } from '@/components/chat/ReferencePanel';
import { LanguageSwitcher } from '@/components/chat/LanguageSwitcher';
import {
    BookOpen,
    MessageCircle,
    AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/i18n/context';

// Streaming event types
interface StreamEvent {
    type: 'status' | 'chunk' | 'complete' | 'references' | 'error';
    message?: string;
    content?: string;
    answer?: string;
    references?: VerseReference[];
    query?: string;
}

export default function Home() {
    const { language, t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamStatus, setStreamStatus] = useState<string>('');
    const [viewingSurah, setViewingSurah] = useState<number | null>(null);
    const [activeReferences, setActiveReferences] = useState<VerseReference[]>(
        [],
    );
    const [isReferencesPanelOpen, setIsReferencesPanelOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    
    // Hydration fix: Initialize with empty strings so SSR and initial CSR match
    // useEffect will set the actual translations after localStorage is read
    const [welcomeTitle, setWelcomeTitle] = useState('');
    const [welcomeSubtitle, setWelcomeSubtitle] = useState('');
    const [tryQueriesLabel, setTryQueriesLabel] = useState('');
    const [exampleQueries, setExampleQueries] = useState({
        patience: '',
        knowledge: '',
        moses: '',
        charity: '',
    });
    const [disclaimer, setDisclaimer] = useState('');
    
    // Update translations when language changes (after localStorage is read)
    useEffect(() => {
        setWelcomeTitle(t('home.welcome_title'));
        setWelcomeSubtitle(t('home.welcome_subtitle'));
        setTryQueriesLabel(t('home.try_queries'));
        setExampleQueries({
            patience: t('example_queries.patience'),
            knowledge: t('example_queries.knowledge'),
            moses: t('example_queries.moses'),
            charity: t('example_queries.charity'),
        });
        setDisclaimer(t('home.disclaimer'));
    }, [t, language]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (isAutoScrolling) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streamStatus, isAutoScrolling]);

    // Detect manual scroll to disable auto-scroll
    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsAutoScrolling(isAtBottom);
    };

    const handleToggleReferences = (refs: VerseReference[]) => {
        // If clicking the same refs that are already open, toggle close
        if (
            isReferencesPanelOpen &&
            JSON.stringify(refs) === JSON.stringify(activeReferences)
        ) {
            setIsReferencesPanelOpen(false);
        } else {
            setActiveReferences(refs);
            setIsReferencesPanelOpen(true);
        }
    };

    const handleSendMessage = async (query: string) => {
        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: query,
            timestamp: new Date(),
        };

        // Include the new message with existing messages for context
        const messagesToSend = [...messages, userMessage];
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);
        // Don't set status here - let the API decide what status to show
        // Status will be shown only when tool calls are made

        // Create a placeholder for the assistant message
        const assistantMessageId = `assistant-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
            },
        ]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Important: Disable caching for streaming responses
                    'Cache-Control': 'no-cache',
                },
                // Send full conversation history for context along with language preference
                body: JSON.stringify({
                    query,
                    messages: messagesToSend,
                    language, // Send current language to API
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            // Read the streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            let accumulatedContent = '';
            let finalAnswer = '';
            let finalReferences: VerseReference[] = [];
            let buffer = ''; // Buffer to handle partial JSON lines

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // Decode the chunk and add to buffer
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process complete lines from the buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    try {
                        const event: StreamEvent = JSON.parse(trimmedLine);

                        if (event.type === 'status') {
                            setStreamStatus(event.message || '');
                        } else if (event.type === 'references') {
                            // Set references first, before the AI response streaming
                            finalReferences = event.references || [];
                            setActiveReferences(finalReferences);
                            setIsReferencesPanelOpen(true);
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMessageId
                                        ? {
                                              ...msg,
                                              references: finalReferences,
                                          }
                                        : msg,
                                ),
                            );
                        } else if (event.type === 'chunk') {
                            // Stream the content chunk by chunk
                            accumulatedContent += event.content || '';
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMessageId
                                        ? {
                                              ...msg,
                                              content: accumulatedContent,
                                          }
                                        : msg,
                                ),
                            );
                        } else if (event.type === 'complete') {
                            // Final response (references already set earlier)
                            finalAnswer = event.answer || accumulatedContent;
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMessageId
                                        ? { ...msg, content: finalAnswer }
                                        : msg,
                                ),
                            );
                        } else if (event.type === 'error') {
                            throw new Error(event.message);
                        }
                    } catch (parseError) {
                        console.error(
                            'Error parsing stream event:',
                            parseError,
                            'Line:',
                            trimmedLine,
                        );
                    }
                }
            }

            // Process any remaining data in buffer
            if (buffer.trim()) {
                try {
                    const event: StreamEvent = JSON.parse(buffer.trim());
                    if (event.type === 'references') {
                        finalReferences = event.references || [];
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId
                                    ? { ...msg, references: finalReferences }
                                    : msg,
                            ),
                        );
                    } else if (event.type === 'complete') {
                        finalAnswer = event.answer || accumulatedContent;
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: finalAnswer }
                                    : msg,
                            ),
                        );
                    }
                } catch (parseError) {
                    console.error('Error parsing final buffer:', parseError);
                }
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
            // Remove the placeholder message on error
            setMessages((prev) =>
                prev.filter((msg) => msg.id !== assistantMessageId),
            );
        } finally {
            setIsLoading(false);
            setStreamStatus('');
        }
    };

    return (
        <div className="relative flex h-dvh flex-col overflow-hidden">
            {/* Islamic Pattern Background */}
            <div className="islamic-pattern" />

            {/* Header - Mobile (Hidden on large screens) */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-100/20 bg-white/60 px-6 py-4 shadow-sm backdrop-blur-xl dark:border-emerald-900/10 dark:bg-emerald-950/40 lg:hidden">
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
                        <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            Quran <span className="gradient-text">RAG</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600/80 dark:text-emerald-400/80">
                            Platform Dakwah AI
                        </p>
                    </div>
                </div>
                <LanguageSwitcher />
            </header>

            {/* Header - Desktop (Hidden on mobile) */}
            <header className="hidden lg:sticky lg:top-0 lg:z-50 lg:flex lg:items-center lg:justify-between lg:border-b lg:border-emerald-100/20 lg:bg-white/60 lg:px-8 lg:py-3 lg:shadow-sm lg:backdrop-blur-xl lg:dark:border-emerald-900/10 lg:dark:bg-emerald-950/40">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
                        <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                            Quran <span className="gradient-text">RAG</span>
                        </h1>
                        <p className="text-[9px] uppercase tracking-wider font-semibold text-emerald-600/80 dark:text-emerald-400/80">
                            Platform Dakwah AI
                        </p>
                    </div>
                </div>
                <LanguageSwitcher />
            </header>

            <div className="relative flex flex-1 overflow-hidden">
                {/* Main Chat Area - Full width when panel closed, 3/5 when open */}
                <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${isReferencesPanelOpen ? 'lg:flex-3' : 'lg:flex-1'}`} style={isReferencesPanelOpen ? { flex: '3' } : { flex: '1' }}>
                    {/* Messages Area */}
                    <main
                        ref={mainRef}
                        onScroll={handleScroll}
                        className="relative z-10 flex-1 overflow-y-auto scroll-smooth pb-[max(0.25rem,env(safe-area-inset-bottom))]"
                    >
                        <div className="mx-auto max-w-3xl px-4 py-8">
                            {messages.length === 0 ? (
                                <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 text-center animate-fade-in">
                                    {/* Hero Icon */}
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10" />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-emerald-100 to-emerald-200 shadow-2xl shadow-emerald-500/20 dark:from-emerald-900/40 dark:to-emerald-800/40">
                                            <BookOpen className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </div>

                                    {/* Welcome Text - Uses suppressHydrationWarning because translations are client-side */}
                                    <h2 className="mb-4 text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight" suppressHydrationWarning>
                                        {welcomeTitle}{' '}
                                        <span className="gradient-text">
                                            Quran RAG
                                        </span>
                                    </h2>
                                    <p className="mb-10 max-w-md text-lg text-gray-600 dark:text-gray-400 font-medium" suppressHydrationWarning>
                                        {welcomeSubtitle}
                                    </p>

                                    {/* Example Queries - Refined Grid */}
                                    <div className="w-full max-w-2xl space-y-4 text-left rtl:text-right">
                                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60" suppressHydrationWarning>
                                            {tryQueriesLabel}
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <ExampleQuery
                                                query={exampleQueries.patience}
                                                onSend={handleSendMessage}
                                            />
                                            <ExampleQuery
                                                query={exampleQueries.knowledge}
                                                onSend={handleSendMessage}
                                            />
                                            <ExampleQuery
                                                query={exampleQueries.moses}
                                                onSend={handleSendMessage}
                                            />
                                            <ExampleQuery
                                                query={exampleQueries.charity}
                                                onSend={handleSendMessage}
                                            />
                                        </div>
                                    </div>
                                    {isLoading && (
                                        <div className="mt-8 animate-fade-in">
                                            <ChatMessageSkeleton />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6 pb-4">
                                    {messages
                                        .filter((message) => {
                                            // Skip empty assistant messages while loading
                                            if (isLoading && message.role === 'assistant' && message.content === '') {
                                                return false;
                                            }
                                            return true;
                                        })
                                        .map((message) => (
                                        <div key={message.id}>
                                            <ChatMessage
                                                message={message}
                                                onViewFullSurah={
                                                    setViewingSurah
                                                }
                                                onToggleReferences={
                                                    handleToggleReferences
                                                }
                                                isReferencesOpen={
                                                    isReferencesPanelOpen &&
                                                    JSON.stringify(
                                                        message.references,
                                                    ) ===
                                                        JSON.stringify(
                                                            activeReferences,
                                                        )
                                                }
                                            />
                                        </div>
                                    ))}
                                    {isLoading &&
                                        messages[messages.length - 1]?.content === '' && (
                                            <ChatMessageSkeleton />
                                        )}
                                    {streamStatus && (
                                        <div className="flex justify-center">
                                            <div className="flex items-center gap-2 rounded-full glass-pill px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm dark:text-emerald-300">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                                </span>
                                                {streamStatus}
                                            </div>
                                        </div>
                                    )}
                                    {error && (
                                        <div className="flex justify-center">
                                            <div className="flex items-center gap-2 rounded-xl bg-red-50/50 border border-red-100 px-4 py-3 text-sm text-red-700 shadow-sm dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-300">
                                                <AlertCircle className="h-5 w-5" />
                                                {error}
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Input Area - Floating Glass */}
                    <footer className="relative z-20 px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-6 transition-all duration-300 focus-within:pb-8 lg:px-20">
                        <div className="mx-auto max-w-3xl">
                            <div className="relative">
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    disabled={isLoading}
                                />

                                <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-tighter text-gray-400 dark:text-gray-500" suppressHydrationWarning>
                                    {disclaimer}
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>

                {/* Side Panel for References - 2/5 of available space (3:2 ratio) */}
                {isReferencesPanelOpen && (
                    <>
                        {/* Desktop Panel - integrated into flex layout */}
                        <div className="hidden lg:block" style={{ flex: '2' }}>
                            <ReferencePanel
                                references={activeReferences}
                                isOpen={isReferencesPanelOpen}
                                onClose={() => setIsReferencesPanelOpen(false)}
                                onViewFullSurah={setViewingSurah}
                                variant="desktop"
                            />
                        </div>

                        {/* Mobile Panel - fixed positioning overlay */}
                        <div className="lg:hidden fixed inset-0 z-50">
                            <ReferencePanel
                                references={activeReferences}
                                isOpen={isReferencesPanelOpen}
                                onClose={() => setIsReferencesPanelOpen(false)}
                                onViewFullSurah={setViewingSurah}
                                variant="mobile"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Full Surah View Modal */}
            {viewingSurah && (
                <FullSurahView
                    surahNumber={viewingSurah}
                    onClose={() => setViewingSurah(null)}
                    references={activeReferences}
                />
            )}
        </div>
    );
}

// Example query chip component
function ExampleQuery({
    query,
    onSend,
}: {
    query: string;
    onSend: (q: string) => void;
}) {
    return (
        <button
            onClick={() => onSend(query)}
            className="group relative overflow-hidden rounded-2xl glass px-6 py-4 text-sm font-semibold text-gray-700 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 dark:text-gray-200"
        >
            <span className="relative z-10 flex items-center gap-4 text-left rtl:text-right rtl:flex-row-reverse" suppressHydrationWarning>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                    <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                </div>
                {query}
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </button>
    );
}
