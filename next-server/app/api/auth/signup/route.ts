import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signup
 * Create a new user account
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual user creation logic
    // In production, this should:
    // 1. Check if user already exists in database
    // 2. Hash password using bcrypt
    // 3. Create new user record
    // 4. Send verification email (optional)
    
    // Mock user creation (remove in production)
    // Check if it's the test account
    if (email === 'test@example.com') {
      return NextResponse.json(
        { success: false, error: 'This email is already registered' },
        { status: 409 }
      );
    }

    // Simulate successful registration
    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please sign in.',
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
