import { Message } from '../types';

/**
 * OpenAI message format for API calls
 */
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Maximum number of messages to keep in context
 * This prevents token overflow while maintaining conversation coherence
 */
const MAX_CONTEXT_MESSAGES = 20;

/**
 * Maximum characters per message to prevent individual large payloads
 */
const MAX_MESSAGE_LENGTH = 4000;

/**
 * Truncate a message if it exceeds the maximum length
 */
function truncateMessage(content: string, maxLength: number = MAX_MESSAGE_LENGTH): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 100) + '\n\n[...truncated for length...]';
}

/**
 * Convert client-side Message[] to OpenAI format
 * - Filters out system messages (we add our own)
 * - Truncates long messages
 * - Maintains conversation order
 */
export function convertToOpenAIMessages(messages: Message[]): OpenAIMessage[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: truncateMessage(msg.content),
  }));
}

/**
 * Prepare conversation history for OpenAI API
 * - Keeps the most recent messages to stay within token limits
 * - Preserves the first user message for context continuity
 * - Always includes the most recent exchanges
 */
export function prepareContextHistory(
  messages: Message[],
  maxMessages: number = MAX_CONTEXT_MESSAGES
): Message[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep the first message (initial context) and the most recent messages
  const firstMessage = messages[0];
  const recentMessages = messages.slice(-(maxMessages - 1));
  
  return [firstMessage, ...recentMessages];
}

/**
 * Build the complete message array for OpenAI API
 * Includes system prompt and prepared context history
 */
export function buildOpenAIMessages(
  messages: Message[],
  systemPrompt: string
): OpenAIMessage[] {
  const contextHistory = prepareContextHistory(messages);
  const openAIMessages = convertToOpenAIMessages(contextHistory);
  
  // Add system prompt at the beginning
  const messagesWithSystem: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...openAIMessages,
  ];
  
  return messagesWithSystem;
}

/**
 * Estimate token count from messages (rough approximation)
 * OpenAI uses ~4 characters per token on average for English
 * This is a conservative estimate to prevent hitting limits
 */
export function estimateTokenCount(messages: OpenAIMessage[]): number {
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  // Conservative estimate: 3 chars per token (accounts for Arabic text which may use more)
  return Math.ceil(totalChars / 3);
}

/**
 * Check if messages need truncation based on estimated token count
 * GPT-4o-mini has 128K context window, but we stay well under for safety
 */
export function needsTruncation(messages: OpenAIMessage[], maxTokens: number = 100000): boolean {
  return estimateTokenCount(messages) > maxTokens;
}

/**
 * Aggressively truncate messages if token count is too high
 * Keeps only the most recent messages while preserving system prompt
 */
export function truncateToTokenLimit(
  messages: OpenAIMessage[],
  maxTokens: number = 100000
): OpenAIMessage[] {
  if (messages.length <= 2) return messages; // System + 1 message minimum
  
  // Remove oldest messages (after system prompt) until under limit
  const systemMessage = messages[0];
  const conversationMessages = messages.slice(1);
  
  let truncated = [...conversationMessages];
  while (needsTruncation([systemMessage, ...truncated], maxTokens) && truncated.length > 1) {
    // Remove the oldest message (index 0 of conversation messages)
    truncated = truncated.slice(1);
  }
  
  return [systemMessage, ...truncated];
}
