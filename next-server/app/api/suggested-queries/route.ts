import { NextResponse } from 'next/server';

/**
 * GET /api/suggested-queries
 * Return list of suggested search queries
 * Access: Public (guest accessible)
 */
export async function GET() {
  const suggestedQueries = [
    { text: "How to invite non-Muslims to Islam gently", category: "Da'wah" },
    { text: "Verses about Tawhid (Oneness of God)", category: "Faith" },
    { text: "Kindness and mercy in the Qur'an", category: "Ethics" },
    { text: "Why is shirk forbidden in Islam", category: "Faith" },
    { text: "What is the purpose of human creation", category: "Life" },
    { text: "Signs of Judgment Day", category: "Hereafter" },
    { text: "Patience and gratitude in trials", category: "Ethics" },
    { text: "Rules of inheritance in Islam", category: "Law" },
    { text: "Stories of prophets in the Qur'an", category: "Stories" },
    { text: "Guidance for family relationships", category: "Ethics" },
  ];

  return NextResponse.json({
    success: true,
    queries: suggestedQueries,
  });
}
