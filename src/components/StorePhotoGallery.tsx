'use client';

import { useState } from 'react';
import Image from 'next/image';

interface StorePhotoGalleryProps {
    photos: string[];
    storeName: string;
}

export default function StorePhotoGallery({ photos, storeName }: StorePhotoGalleryProps) {
    const [selectedPhoto, setSelectedPhoto] = useState<number>(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    if (!photos || photos.length === 0) {
        return null;
    }

    const openLightbox = (index: number) => {
        setSelectedPhoto(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
    };

    const nextPhoto = () => {
        setSelectedPhoto((prev) => (prev + 1) % photos.length);
    };

    const prevPhoto = () => {
        setSelectedPhoto((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return (
        <>
            <section style={{
                marginBottom: '40px'
            }}>
                <h2 style={{
                    fontSize: '28px',
                    color: '#C83232',
                    marginBottom: '20px',
                    fontWeight: 'bold'
                }}>
                    STORE PHOTOS
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '15px'
                }}>
                    {photos.map((photo, index) => (
                        <div
                            key={index}
                            onClick={() => openLightbox(index)}
                            style={{
                                position: 'relative',
                                height: '200px',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                            }}
                        >
                            <Image
                                src={photo}
                                alt={`${storeName} - Photo ${index + 1}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    onClick={closeLightbox}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10000
                        }}
                    >
                        ×
                    </button>

                    {/* Previous Button */}
                    {photos.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                prevPhoto();
                            }}
                            style={{
                                position: 'absolute',
                                left: '20px',
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '50px',
                                height: '50px',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10000
                            }}
                        >
                            ‹
                        </button>
                    )}

                    {/* Image */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            width: 'auto',
                            height: 'auto'
                        }}
                    >
                        <img
                            src={photos[selectedPhoto]}
                            alt={`${storeName} - Photo ${selectedPhoto + 1}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '10px'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '-30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: 'white',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                        }}>
                            {selectedPhoto + 1} / {photos.length}
                        </div>
                    </div>

                    {/* Next Button */}
                    {photos.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                nextPhoto();
                            }}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '50px',
                                height: '50px',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10000
                            }}
                        >
                            ›
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
