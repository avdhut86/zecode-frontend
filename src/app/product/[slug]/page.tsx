import ProductDetailContent from '@/components/ProductDetailContent';
import { MOCK_DATA } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const productSlug = slug;
    const product = MOCK_DATA.products.find((p) => p.slug === productSlug);

    if (!product) {
        notFound();
    }

    return <ProductDetailContent product={product} />;
}
