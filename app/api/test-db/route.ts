import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const connected = await testConnection();
    return NextResponse.json({ 
      connected,
      message: connected ? 'Database connected successfully' : 'Database connection failed'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      connected: false,
      error: error.message,
      message: 'Database connection failed with error'
    });
  }
}
