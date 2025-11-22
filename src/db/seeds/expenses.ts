import { db } from '@/db';
import { expenses } from '@/db/schema';

async function main() {
    const sampleExpenses = [
        // November 2024 expenses
        {
            amount: 85.50,
            description: 'Grocery shopping at Whole Foods',
            categoryId: 1,
            date: new Date('2024-11-02').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-02').toISOString(),
        },
        {
            amount: 42.00,
            description: 'Uber ride to airport',
            categoryId: 2,
            date: new Date('2024-11-05').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-05').toISOString(),
        },
        {
            amount: 1200.00,
            description: 'Rent payment',
            categoryId: 5,
            date: new Date('2024-11-01').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-01').toISOString(),
        },
        {
            amount: 32.00,
            description: 'Lunch at Italian restaurant',
            categoryId: 1,
            date: new Date('2024-11-08').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-08').toISOString(),
        },
        {
            amount: 89.99,
            description: 'New running shoes',
            categoryId: 3,
            date: new Date('2024-11-12').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-12').toISOString(),
        },
        {
            amount: 15.99,
            description: 'Netflix subscription',
            categoryId: 4,
            date: new Date('2024-11-15').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-15').toISOString(),
        },
        {
            amount: 55.00,
            description: 'Gas station fill-up',
            categoryId: 2,
            date: new Date('2024-11-18').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-18').toISOString(),
        },
        {
            amount: 49.99,
            description: 'Gym membership',
            categoryId: 6,
            date: new Date('2024-11-20').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-20').toISOString(),
        },
        {
            amount: 125.00,
            description: 'Electric utility',
            categoryId: 5,
            date: new Date('2024-11-22').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-11-22').toISOString(),
        },
        // December 2024 expenses
        {
            amount: 45.20,
            description: 'Dinner delivery from UberEats',
            categoryId: 1,
            date: new Date('2024-12-03').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-03').toISOString(),
        },
        {
            amount: 1200.00,
            description: 'Rent payment',
            categoryId: 5,
            date: new Date('2024-12-01').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-01').toISOString(),
        },
        {
            amount: 95.00,
            description: 'Concert tickets',
            categoryId: 4,
            date: new Date('2024-12-07').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-07').toISOString(),
        },
        {
            amount: 120.00,
            description: 'Monthly parking permit',
            categoryId: 2,
            date: new Date('2024-12-10').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-10').toISOString(),
        },
        {
            amount: 125.50,
            description: 'Clothes shopping at H&M',
            categoryId: 3,
            date: new Date('2024-12-14').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-14').toISOString(),
        },
        {
            amount: 8.75,
            description: 'Coffee and pastry',
            categoryId: 1,
            date: new Date('2024-12-16').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-16').toISOString(),
        },
        {
            amount: 79.99,
            description: 'Internet bill',
            categoryId: 5,
            date: new Date('2024-12-18').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-18').toISOString(),
        },
        {
            amount: 25.00,
            description: 'Doctor copay',
            categoryId: 6,
            date: new Date('2024-12-21').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-21').toISOString(),
        },
        {
            amount: 149.00,
            description: 'Electronics - wireless headphones',
            categoryId: 3,
            date: new Date('2024-12-23').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2024-12-23').toISOString(),
        },
        // January 2025 expenses
        {
            amount: 28.50,
            description: 'Weekend brunch',
            categoryId: 1,
            date: new Date('2025-01-04').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2025-01-04').toISOString(),
        },
        {
            amount: 1200.00,
            description: 'Rent payment',
            categoryId: 5,
            date: new Date('2025-01-01').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2025-01-01').toISOString(),
        },
        {
            amount: 90.00,
            description: 'Bus pass',
            categoryId: 2,
            date: new Date('2025-01-08').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2025-01-08').toISOString(),
        },
        {
            amount: 42.50,
            description: 'Movie night with friends',
            categoryId: 4,
            date: new Date('2025-01-10').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2025-01-10').toISOString(),
        },
        {
            amount: 67.25,
            description: 'Home decor items',
            categoryId: 3,
            date: new Date('2025-01-13').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2025-01-13').toISOString(),
        },
        {
            amount: 18.50,
            description: 'Prescription medication',
            categoryId: 6,
            date: new Date('2025-01-16').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2025-01-16').toISOString(),
        },
        {
            amount: 65.00,
            description: 'Phone bill',
            categoryId: 5,
            date: new Date('2025-01-20').toISOString(),
            userId: 'test-user-123',
            createdAt: new Date('2025-01-20').toISOString(),
        },
    ];

    await db.insert(expenses).values(sampleExpenses);
    
    console.log('✅ Expenses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});