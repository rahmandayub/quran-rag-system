'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useLanguage } from '@/i18n/context';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({
    onSendMessage,
    disabled = false,
}: ChatInputProps) {
    const { t } = useLanguage();
    const [input, setInput] = useState('');
    const [placeholder, setPlaceholder] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Set placeholder after mount to avoid hydration mismatch
    useEffect(() => {
        setPlaceholder(t('chat.input_placeholder'));
    }, [t]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="group relative flex items-end gap-2 rounded-3xl glass p-1.5 transition-all duration-300 focus-within:-translate-y-1 focus-within:shadow-2xl focus-within:shadow-emerald-500/20">
                {/* Glow effect on focus */}
                <div className="absolute -inset-1 rounded-[34px] bg-linear-to-r from-emerald-500/20 to-gold-500/20 opacity-0 blur-lg transition-opacity duration-500 group-focus-within:opacity-100" />

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Tanyakan tentang Al-Qur'an..."}
                    disabled={disabled}
                    rows={1}
                    className="relative flex-1 resize-none bg-transparent px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500 disabled:opacity-50"
                    style={{ minHeight: '52px', maxHeight: '200px' }}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || disabled}
                    className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 transition-all duration-500 hover:scale-110 hover:shadow-emerald-500/50 disabled:scale-100 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none dark:disabled:from-gray-800 dark:disabled:to-gray-900"
                >
                    <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
            </div>
        </form>
    );
}
