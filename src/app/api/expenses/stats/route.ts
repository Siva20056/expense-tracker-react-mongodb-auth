import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses, categories } from '@/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication validation
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await auth.api.getSession({ 
      headers: { authorization: `Bearer ${token}` } 
    });

    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Calculate total spending
    const totalResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`.as('total')
      })
      .from(expenses)
      .where(eq(expenses.userId, userId));

    const total = totalResult[0]?.total || 0;

    // Calculate recent 30 days spending
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const recent30DaysResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`.as('total')
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, thirtyDaysAgoISO)
        )
      );

    const recent30Days = recent30DaysResult[0]?.total || 0;

    // Calculate spending by category
    const byCategoryResult = await db
      .select({
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`.as('totalAmount'),
        count: sql<number>`COUNT(${expenses.id})`.as('count')
      })
      .from(expenses)
      .innerJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.userId, userId))
      .groupBy(expenses.categoryId, categories.name);

    const byCategory = byCategoryResult.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      totalAmount: item.totalAmount,
      count: item.count,
      percentage: total > 0 ? Number(((item.totalAmount / total) * 100).toFixed(2)) : 0
    }));

    // Calculate spending by month
    const byMonthResult = await db
      .select({
        month: sql<string>`substr(${expenses.date}, 1, 7)`.as('month'),
        totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`.as('totalAmount'),
        count: sql<number>`COUNT(${expenses.id})`.as('count')
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(sql`substr(${expenses.date}, 1, 7)`)
      .orderBy(sql`substr(${expenses.date}, 1, 7) DESC`);

    const byMonth = byMonthResult.map(item => ({
      month: item.month,
      totalAmount: item.totalAmount,
      count: item.count
    }));

    // Return statistics
    return NextResponse.json({
      total,
      recent30Days,
      byCategory,
      byMonth
    }, { status: 200 });

  } catch (error) {
    console.error('GET statistics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}