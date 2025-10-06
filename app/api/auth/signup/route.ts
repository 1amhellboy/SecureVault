import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { UserDB, DatabaseError } from '@/lib/db-utils';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await UserDB.create(email, passwordHash);
      const token = generateToken({ userId: user.id, email: user.email });

      const response = NextResponse.json({ 
        success: true, 
        user: { id: user.id, email: user.email } 
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    } catch (error) {
      if (error instanceof DatabaseError && error.code === 'EMAIL_EXISTS') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
