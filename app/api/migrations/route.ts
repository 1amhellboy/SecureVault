import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, rollbackMigrations, getMigrationStatus } from '@/lib/migrations';

export async function GET() {
  try {
    const status = await getMigrationStatus();
    return NextResponse.json({ 
      success: true, 
      migrations: status,
      count: status.length
    });
  } catch (error) {
    console.error('Get migration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get migration status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, targetVersion } = await request.json();
    
    if (action === 'migrate') {
      await runMigrations();
      return NextResponse.json({ 
        success: true, 
        message: 'Migrations completed successfully' 
      });
    }
    
    if (action === 'rollback') {
      const version = targetVersion || 0;
      await rollbackMigrations(version);
      return NextResponse.json({ 
        success: true, 
        message: `Rolled back to version ${version}` 
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "migrate" or "rollback"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Migration operation error:', error);
    return NextResponse.json(
      { error: 'Migration operation failed' },
      { status: 500 }
    );
  }
}
