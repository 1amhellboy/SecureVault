import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await pool.query(
      'SELECT id, encrypted_title, encrypted_username, encrypted_password, encrypted_url, encrypted_notes, created_at, updated_at FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC',
      [user.userId]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Get vault items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { encryptedTitle, encryptedUsername, encryptedPassword, encryptedUrl, encryptedNotes } = await request.json();

    if (!encryptedTitle || !encryptedPassword) {
      return NextResponse.json(
        { error: 'Title and password are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO vault_items (user_id, encrypted_title, encrypted_username, encrypted_password, encrypted_url, encrypted_notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.userId, encryptedTitle, encryptedUsername, encryptedPassword, encryptedUrl, encryptedNotes]
    );

    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Create vault item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
