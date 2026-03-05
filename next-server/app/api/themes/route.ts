import { NextRequest, NextResponse } from 'next/server';
import { getAllThemes } from '@/lib/qdrant';

/**
 * GET /api/themes
 * List all themes with verse counts
 * Access: Public (guest accessible)
 * 
 * Query Parameters:
 * - limit?: number - Maximum number of themes to return (default: all)
 * - include_arabic?: boolean - Include Arabic names (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const includeArabic = searchParams.get('include_arabic') !== 'false';

    // Parse limit
    let limit: number | undefined = undefined;
    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid limit parameter',
          },
          { status: 400 }
        );
      }
    }

    // Get themes from Qdrant
    const allThemes = await getAllThemes();

    // Apply limit if specified
    const themes = limit ? allThemes.slice(0, limit) : allThemes;

    // Format response
    const formattedThemes = themes.map((theme) => ({
      name: theme.name,
      arabic: includeArabic ? theme.arabic : undefined,
      count: theme.count,
    }));

    return NextResponse.json({
      success: true,
      themes: formattedThemes,
      total: formattedThemes.length,
    });
  } catch (error) {
    console.error('Themes API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch themes',
      },
      { status: 500 }
    );
  }
}
