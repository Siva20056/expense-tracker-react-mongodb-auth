import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const session = await auth.api.getSession({ headers: { authorization: `Bearer ${token}` } });
    if (!session || !session.user) {
      return null;
    }
    return session.user;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id))
      .orderBy(desc(categories.createdAt));

    return NextResponse.json(userCategories, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { error: 'User ID cannot be provided in request body', code: 'USER_ID_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    const { name, color, icon } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!color || typeof color !== 'string' || color.trim() === '') {
      return NextResponse.json(
        { error: 'Color is required and must be a non-empty string', code: 'MISSING_COLOR' },
        { status: 400 }
      );
    }

    if (!icon || typeof icon !== 'string' || icon.trim() === '') {
      return NextResponse.json(
        { error: 'Icon is required and must be a non-empty string', code: 'MISSING_ICON' },
        { status: 400 }
      );
    }

    const newCategory = await db
      .insert(categories)
      .values({
        name: name.trim(),
        color: color.trim(),
        icon: icon.trim(),
        userId: user.id,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { error: 'User ID cannot be provided in request body', code: 'USER_ID_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    const existingCategory = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, parseInt(id)), eq(categories.userId, user.id)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: { name?: string; color?: string; icon?: string } = {};

    if (body.name && typeof body.name === 'string' && body.name.trim() !== '') {
      updates.name = body.name.trim();
    }

    if (body.color && typeof body.color === 'string' && body.color.trim() !== '') {
      updates.color = body.color.trim();
    }

    if (body.icon && typeof body.icon === 'string' && body.icon.trim() !== '') {
      updates.icon = body.icon.trim();
    }

    const updatedCategory = await db
      .update(categories)
      .set(updates)
      .where(and(eq(categories.id, parseInt(id)), eq(categories.userId, user.id)))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCategory[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingCategory = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, parseInt(id)), eq(categories.userId, user.id)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedCategory = await db
      .delete(categories)
      .where(and(eq(categories.id, parseInt(id)), eq(categories.userId, user.id)))
      .returning();

    if (deletedCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Category deleted successfully',
        category: deletedCategory[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}