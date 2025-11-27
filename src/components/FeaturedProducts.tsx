'use client';

import { Product } from '@/types/store';
import Image from 'next/image';

interface FeaturedProductsProps {
    products: Product[];
    storeName: string;
}

export default function FeaturedProducts({ products, storeName }: FeaturedProductsProps) {
    if (!products || products.length === 0) {
        return null;
    }

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={`full-${i}`} style={{ color: '#FFD700' }}>★</span>);
        }
        if (hasHalfStar) {
            stars.push(<span key="half" style={{ color: '#FFD700' }}>½</span>);
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} style={{ color: '#ddd' }}>★</span>);
        }
        return stars;
    };

    return (
        <section style={{
            marginBottom: '60px'
        }}>
            <h2 style={{
                fontSize: '32px',
                color: '#C83232',
                marginBottom: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }}>
                POPULAR PRODUCTS AT THIS STORE
            </h2>
            <p style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '30px'
            }}>
                Best-selling items at {storeName}
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '25px'
            }}>
                {products.map((product) => (
                    <div
                        key={product.id}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                    >
                        {/* Product Image */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '250px',
                            backgroundColor: '#f0f0f0',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                color: '#999',
                                fontSize: '14px'
                            }}>
                                Product Image
                            </div>
                            
                            {/* Discount Badge */}
                            {product.originalPrice && product.originalPrice > product.price && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    backgroundColor: '#C83232',
                                    color: 'white',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                </div>
                            )}

                            {/* Stock Badge */}
                            {!product.inStock && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    backgroundColor: '#666',
                                    color: 'white',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    Out of Stock
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div style={{
                            padding: '20px'
                        }}>
                            {/* Category */}
                            <div style={{
                                fontSize: '12px',
                                color: '#999',
                                textTransform: 'uppercase',
                                marginBottom: '8px',
                                fontWeight: '600'
                            }}>
                                {product.category}
                            </div>

                            {/* Product Name */}
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#000',
                                marginBottom: '8px',
                                lineHeight: '1.3'
                            }}>
                                {product.name}
                            </h3>

                            {/* Description */}
                            <p style={{
                                fontSize: '14px',
                                color: '#666',
                                marginBottom: '12px',
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {product.description}
                            </p>

                            {/* Rating */}
                            {product.rating && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ fontSize: '16px', lineHeight: '1' }}>
                                        {renderStars(product.rating)}
                                    </div>
                                    <span style={{
                                        fontSize: '13px',
                                        color: '#666'
                                    }}>
                                        ({product.reviewCount})
                                    </span>
                                </div>
                            )}

                            {/* Price */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '15px'
                            }}>
                                <span style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#C83232'
                                }}>
                                    ₹{product.price}
                                </span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <span style={{
                                        fontSize: '16px',
                                        color: '#999',
                                        textDecoration: 'line-through'
                                    }}>
                                        ₹{product.originalPrice}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
