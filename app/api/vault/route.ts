import { NextRequest, NextResponse } from 'next/server';
import { VaultItemDB } from '@/lib/db-utils';
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let items;
    if (search) {
      items = await VaultItemDB.search(user.userId, search);
    } else {
      items = await VaultItemDB.findByUserId(user.userId, category || undefined);
    }

    return NextResponse.json({ items });
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

    const { 
      encryptedTitle, 
      encryptedUsername, 
      encryptedPassword, 
      encryptedUrl, 
      encryptedNotes, 
      category = 'General' 
    } = await request.json();

    if (!encryptedTitle || !encryptedPassword) {
      return NextResponse.json(
        { error: 'Title and password are required' },
        { status: 400 }
      );
    }

    const item = await VaultItemDB.create(
      user.userId,
      encryptedTitle,
      encryptedPassword,
      encryptedUsername,
      encryptedUrl,
      encryptedNotes,
      category
    );

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Create vault item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
