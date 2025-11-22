import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'Food',
            color: '#FF6B6B',
            icon: 'utensils',
            userId: 'test-user-123',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Transport',
            color: '#4ECDC4',
            icon: 'car',
            userId: 'test-user-123',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Shopping',
            color: '#FFE66D',
            icon: 'shopping-bag',
            userId: 'test-user-123',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Entertainment',
            color: '#95E1D3',
            icon: 'film',
            userId: 'test-user-123',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Bills',
            color: '#A8DADC',
            icon: 'file-text',
            userId: 'test-user-123',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Health',
            color: '#F38181',
            icon: 'heart',
            userId: 'test-user-123',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});