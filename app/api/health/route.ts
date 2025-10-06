import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const connectionTest = await testConnection();
    
    const response = {
      status: connectionTest ? 'healthy' : 'unhealthy',
      database: {
        connected: connectionTest,
        lastCheck: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, {
      status: connectionTest ? 200 : 503
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: {
          connected: false,
          error: 'Health check failed'
        },
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
