'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Breadcrumb from './Breadcrumb';
import { detectGarmentType, isGarmentTypeSupported } from '@/types/virtual-try-on';

// Dynamically import VirtualTryOn to avoid SSR issues with MediaPipe
const VirtualTryOn = dynamic(() => import('./VirtualTryOn'), {
    ssr: false,
    loading: () => null,
});

interface ProductDetail {
    id: number;
    name: string;
    category: string;
    categoryLabel?: string;
    price: number | null;
    originalPrice?: number;
    image: string;
    gallery?: string[];
    description: string;
    sizes?: string[];
    rating?: number;
    reviewCount?: number;
}

function formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined) return '';
    return `₹${value.toLocaleString()}`;
}

function buildShareLink(platform: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin' | 'email', url: string, title: string) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        case 'twitter':
            return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        case 'whatsapp':
            return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        case 'linkedin':
            return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
        case 'email':
            return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
        default:
            return url;
    }
}

function getStarFill(rating: number, index: number) {
    const starValue = rating - index;
    if (starValue >= 1) return 1;
    if (starValue > 0) return Math.max(0, Math.min(1, starValue));
    return 0;
}

// Social media icon SVGs
const FacebookIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const TwitterIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const InstagramIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);

const EmailIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
);

const TryOnIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export default function ProductDetailContent({ product }: { product: ProductDetail }) {
    const gallery = useMemo(() => (product.gallery && product.gallery.length > 0 ? product.gallery : [product.image]), [product.gallery, product.image]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const selectedImage = gallery[selectedImageIndex] ?? gallery[0];

    const [shareUrl, setShareUrl] = useState('');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewerName, setReviewerName] = useState('');
    const [reviewerEmail, setReviewerEmail] = useState('');
    const [reviewMessage, setReviewMessage] = useState('');
    const [submitMessage, setSubmitMessage] = useState('');
    const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);

    // Check if virtual try-on is supported for this product
    const garmentType = detectGarmentType(product.name, product.category);
    const vtoSupported = isGarmentTypeSupported(garmentType);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setShareUrl(window.location.href);
        }
    }, []);

    const ratingValue = product.rating ?? 0;
    const reviewCount = product.reviewCount ?? 0;

    const handleReviewSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (reviewRating === 0) {
            setSubmitMessage('Please select a rating');
            return;
        }

        // Here you would typically send the review to your backend
        console.log({
            name: reviewerName,
            email: reviewerEmail,
            rating: reviewRating,
            message: reviewMessage,
            productId: product.id
        });

        // Show success message
        setSubmitMessage('Thank you for your review! It will be published after review.');

        // Reset form
        setReviewerName('');
        setReviewerEmail('');
        setReviewRating(0);
        setReviewMessage('');

        // Clear success message after 5 seconds
        setTimeout(() => setSubmitMessage(''), 5000);
    };

    return (
        <main className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: 'Home', href: '/' },
                            { label: product.categoryLabel ?? product.category, href: `/${product.category}` },
                            { label: product.name, href: '#' }
                        ]}
                    />
                </div>

                {/* Two Column Layout - matching reference */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    {/* Left Column - Gallery */}
                    <div className="flex flex-col">
                        {/* Main Image */}
                        <div className="relative bg-gray-50 w-full" style={{ height: '500px' }}>
                            <Image
                                src={selectedImage}
                                alt={product.name}
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 500px"
                                className="object-contain"
                            />
                        </div>

                        {/* Thumbnail Gallery - Horizontal below main image */}
                        <div className="flex gap-2 mt-4">
                            {gallery.slice(0, 4).map((imageSrc, index) => {
                                const isActive = index === selectedImageIndex;
                                return (
                                    <button
                                        key={`${imageSrc}-${index}`}
                                        type="button"
                                        onClick={() => setSelectedImageIndex(index)}
                                        onMouseEnter={() => setSelectedImageIndex(index)}
                                        className={`relative overflow-hidden border transition-all flex-shrink-0 ${isActive
                                            ? 'border-gray-800 border-2'
                                            : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        style={{ width: '60px', height: '75px' }}
                                    >
                                        <Image
                                            src={imageSrc}
                                            alt={`${product.name} view ${index + 1}`}
                                            fill
                                            sizes="60px"
                                            className="object-cover"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column - Product Summary */}
                    <div className="space-y-5">
                        {/* Product Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-100 uppercase tracking-wide">
                            {product.name}
                        </h1>

                        {/* Price */}
                        <div className="text-xl font-semibold text-gray-900">
                            {formatCurrency(product.price)}
                        </div>

                        {/* Category */}
                        <div className="text-sm text-gray-600">
                            <span>Category: </span>
                            <Link
                                href={`/${product.category}`}
                                className="text-blue-600 hover:underline"
                            >
                                {product.categoryLabel ?? product.category}
                            </Link>
                        </div>

                        {/* Description */}
                        <p className="text-sm leading-relaxed text-gray-700">
                            {product.description}
                        </p>

                        {/* Virtual Try-On Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => setShowVirtualTryOn(true)}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                            >
                                <TryOnIcon />
                                Virtual Try-On
                                {!vtoSupported && (
                                    <span className="text-xs opacity-75">(Beta)</span>
                                )}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                See how it looks on you using your camera or photo
                            </p>
                        </div>

                        {/* Share Section */}
                        <div className="flex items-center gap-3 pt-4">
                            <span className="text-sm font-bold text-gray-900">Share:</span>
                            <div className="flex items-center gap-2 flex-wrap">
                                <a
                                    href={shareUrl ? buildShareLink('whatsapp', shareUrl, product.name) : '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="border border-gray-200 rounded p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                                    aria-label="Share on WhatsApp"
                                >
                                    <WhatsAppIcon />
                                </a>
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="border border-gray-200 rounded p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                                    aria-label="Share on Instagram"
                                >
                                    <InstagramIcon />
                                </a>
                                <a
                                    href={shareUrl ? buildShareLink('facebook', shareUrl, product.name) : '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="border border-gray-200 rounded p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                                    aria-label="Share on Facebook"
                                >
                                    <FacebookIcon />
                                </a>
                                <a
                                    href={shareUrl ? buildShareLink('email', shareUrl, product.name) : '#'}
                                    className="border border-gray-200 rounded p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                                    aria-label="Share via Email"
                                >
                                    <EmailIcon />
                                </a>
                                <Link
                                    href="/store-locator-map"
                                    className="border border-gray-200 rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors ml-2"
                                >
                                    Find in store
                                </Link>
                            </div>
                        </div>

                        {/* Rating Display */}
                        <div className="flex items-center gap-2 pt-2">
                            <div className="flex text-yellow-400">
                                {Array.from({ length: 5 }).map((_, index) => {
                                    const fill = getStarFill(ratingValue, index);
                                    return (
                                        <span key={index} className="relative inline-block text-lg">
                                            <span className="text-gray-300">★</span>
                                            <span
                                                className="absolute left-0 top-0 overflow-hidden text-yellow-400"
                                                style={{ width: `${fill * 100}%` }}
                                            >
                                                ★
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                            <span className="text-sm text-gray-600">
                                {ratingValue.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                        </div>

                        {/* Write a review Section */}
                        <div className="pt-6 border-t border-gray-200 bg-gray-50/50 p-6 rounded-lg mt-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide text-opacity-50">Write a review</h2>

                            <form className="space-y-4" onSubmit={handleReviewSubmit}>
                                <div>
                                    <label htmlFor="reviewer-name" className="block text-sm text-gray-700 mb-1">
                                        Name <span className="text-brand-red">*</span>
                                    </label>
                                    <input
                                        id="reviewer-name"
                                        type="text"
                                        required
                                        value={reviewerName}
                                        onChange={(e) => setReviewerName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-gray-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="reviewer-email" className="block text-sm text-gray-700 mb-1">
                                        Email <span className="text-brand-red">*</span>
                                    </label>
                                    <input
                                        id="reviewer-email"
                                        type="email"
                                        required
                                        value={reviewerEmail}
                                        onChange={(e) => setReviewerEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-gray-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">
                                        Rating <span className="text-brand-red">*</span>
                                    </label>
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, index) => {
                                            const value = index + 1;
                                            const isActive = reviewRating >= value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setReviewRating(value)}
                                                    className="text-xl transition-colors focus:outline-none"
                                                    aria-label={`${value} star${value > 1 ? 's' : ''}`}
                                                >
                                                    <span className={isActive ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}>★</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="review-message" className="block text-sm text-gray-700 mb-1">
                                        Your review <span className="text-brand-red">*</span>
                                    </label>
                                    <textarea
                                        id="review-message"
                                        rows={5}
                                        required
                                        value={reviewMessage}
                                        onChange={(e) => setReviewMessage(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-gray-500 transition-colors resize-none"
                                    />
                                </div>

                                {submitMessage && (
                                    <div className={`p-3 rounded text-sm ${submitMessage.includes('select') ? 'bg-red-50 text-brand-red' : 'bg-green-50 text-green-700'}`}>
                                        {submitMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-3 text-white font-medium rounded transition-colors"
                                    style={{ backgroundColor: '#C83232' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#a02828'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C83232'}
                                >
                                    Submit review
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Virtual Try-On Modal */}
            <VirtualTryOn
                productImage={selectedImage}
                productName={product.name}
                productCategory={product.category}
                isOpen={showVirtualTryOn}
                onClose={() => setShowVirtualTryOn(false)}
            />
        </main>
    );
}
