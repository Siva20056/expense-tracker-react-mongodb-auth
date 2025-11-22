import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
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

    return session.user.id;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const conditions = [eq(expenses.userId, userId)];

    if (startDate) {
      conditions.push(gte(expenses.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(expenses.date, endDate));
    }

    if (categoryId) {
      const categoryIdInt = parseInt(categoryId);
      if (!isNaN(categoryIdInt)) {
        conditions.push(eq(expenses.categoryId, categoryIdInt));
      }
    }

    const results = await db.select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { amount, description, categoryId, date } = body;

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT' 
      }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Description must be a non-empty string',
        code: 'INVALID_DESCRIPTION' 
      }, { status: 400 });
    }

    if (!categoryId || typeof categoryId !== 'number' || !Number.isInteger(categoryId)) {
      return NextResponse.json({ 
        error: 'CategoryId must be a valid integer',
        code: 'INVALID_CATEGORY_ID' 
      }, { status: 400 });
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ 
        error: 'Date must be a valid ISO date string',
        code: 'INVALID_DATE' 
      }, { status: 400 });
    }

    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ 
          error: 'Date must be a valid ISO date string',
          code: 'INVALID_DATE' 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Date must be a valid ISO date string',
        code: 'INVALID_DATE' 
      }, { status: 400 });
    }

    const newExpense = await db.insert(expenses)
      .values({
        amount,
        description: description.trim(),
        categoryId,
        date,
        userId,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newExpense[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(expenses)
      .where(and(
        eq(expenses.id, parseInt(id)),
        eq(expenses.userId, userId)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Expense not found',
        code: 'EXPENSE_NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: any = {};

    if ('amount' in body) {
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return NextResponse.json({ 
          error: 'Amount must be a positive number',
          code: 'INVALID_AMOUNT' 
        }, { status: 400 });
      }
      updates.amount = body.amount;
    }

    if ('description' in body) {
      if (typeof body.description !== 'string' || body.description.trim().length === 0) {
        return NextResponse.json({ 
          error: 'Description must be a non-empty string',
          code: 'INVALID_DESCRIPTION' 
        }, { status: 400 });
      }
      updates.description = body.description.trim();
    }

    if ('categoryId' in body) {
      if (typeof body.categoryId !== 'number' || !Number.isInteger(body.categoryId)) {
        return NextResponse.json({ 
          error: 'CategoryId must be a valid integer',
          code: 'INVALID_CATEGORY_ID' 
        }, { status: 400 });
      }
      updates.categoryId = body.categoryId;
    }

    if ('date' in body) {
      if (typeof body.date !== 'string') {
        return NextResponse.json({ 
          error: 'Date must be a valid ISO date string',
          code: 'INVALID_DATE' 
        }, { status: 400 });
      }
      try {
        const parsedDate = new Date(body.date);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json({ 
            error: 'Date must be a valid ISO date string',
            code: 'INVALID_DATE' 
          }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: 'Date must be a valid ISO date string',
          code: 'INVALID_DATE' 
        }, { status: 400 });
      }
      updates.date = body.date;
    }

    const updated = await db.update(expenses)
      .set(updates)
      .where(and(
        eq(expenses.id, parseInt(id)),
        eq(expenses.userId, userId)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Expense not found',
        code: 'EXPENSE_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(expenses)
      .where(and(
        eq(expenses.id, parseInt(id)),
        eq(expenses.userId, userId)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Expense not found',
        code: 'EXPENSE_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(expenses)
      .where(and(
        eq(expenses.id, parseInt(id)),
        eq(expenses.userId, userId)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Expense not found',
        code: 'EXPENSE_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Expense deleted successfully',
      expense: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}