import { NextRequest, NextResponse } from 'next/server';
import { STORES } from '@/data/stores';

// GET all stores or single store by ID
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    try {
        if (id) {
            const store = STORES.find(s => s.id === parseInt(id));
            if (!store) {
                return NextResponse.json(
                    { error: 'Store not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(store);
        }

        if (slug) {
            const store = STORES.find(s => s.slug === slug);
            if (!store) {
                return NextResponse.json(
                    { error: 'Store not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(store);
        }

        // Return all stores
        return NextResponse.json({
            stores: STORES,
            total: STORES.length
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
