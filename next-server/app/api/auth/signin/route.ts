import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signin
 * Sign in with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual authentication logic
    // For now, return a mock response
    // In production, this should:
    // 1. Look up user in database by email
    // 2. Verify password hash using bcrypt
    // 3. Create session or JWT token
    
    // Mock authentication (remove in production)
    if (email === 'test@example.com' && password === 'password123') {
      const response = NextResponse.json({
        success: true,
        user: {
          id: '1',
          email: email,
          name: 'Test User',
          role: 'user',
        },
      });
      
      // Set session cookie
      response.cookies.set('auth-token', 'mock-jwt-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
        path: '/',
      });
      
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}
