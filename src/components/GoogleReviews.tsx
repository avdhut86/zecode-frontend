'use client';

import { useEffect, useState } from 'react';

interface GoogleReview {
    author_name: string;
    author_url?: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
}

interface PlaceData {
    rating?: number;
    user_ratings_total?: number;
    reviews?: GoogleReview[];
    url?: string;
}

interface GoogleReviewsProps {
    placeId?: string;
    storeName: string;
    storeAddress?: string;
}

export default function GoogleReviews({ placeId, storeName, storeAddress }: GoogleReviewsProps) {
    const [placeData, setPlaceData] = useState<PlaceData | null>(null);
    const [reviews, setReviews] = useState<GoogleReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPlaceData() {
            setLoading(true);
            setError(null);

            try {
                // Construct API URL
                let url = '/api/places?';
                if (placeId) {
                    url += `placeId=${encodeURIComponent(placeId)}`;
                } else if (storeAddress) {
                    url += `address=${encodeURIComponent(`${storeName}, ${storeAddress}`)}`;
                } else {
                    url += `name=${encodeURIComponent(storeName)}`;
                }

                const response = await fetch(url);
                const data = await response.json();

                if (data.success && data.data) {
                    setPlaceData(data.data);
                    setReviews(data.data.reviews || []);
                } else {
                    setError(data.error || 'Could not fetch place data');
                }
            } catch (err) {
                setError('Failed to load reviews');
                console.error('Error fetching place data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchPlaceData();
    }, [placeId, storeName, storeAddress]);

    if (loading) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '10px'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #C83232',
                    borderRadius: '50%',
                    margin: '0 auto 20px',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ fontSize: '16px', color: '#666' }}>
                    Loading reviews...
                </p>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Real Google Reviews Data */}
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '25px',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div>
                        <h4 style={{
                            fontSize: '24px',
                            color: '#000',
                            marginBottom: '5px',
                            fontWeight: 'bold'
                        }}>
                            Customer Reviews
                        </h4>
                        {placeData && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <div style={{ color: '#FFA500', fontSize: '20px' }}>
                                    {renderStars(placeData.rating || 0)}
                                </div>
                                <span style={{ fontSize: '16px', color: '#666' }}>
                                    {placeData.rating?.toFixed(1)} out of 5
                                </span>
                                <span style={{ fontSize: '14px', color: '#999' }}>
                                    ({placeData.user_ratings_total || 0} reviews)
                                </span>
                            </div>
                        )}
                    </div>
                    <a
                        href={placeData?.url || `https://search.google.com/local/writereview?placeid=${placeId || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#4285F4',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ⭐ Write a Review
                    </a>
                </div>

                {/* Review Cards */}
                {reviews.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gap: '20px'
                    }}>
                        {reviews.slice(0, 5).map((review, index) => (
                            <div key={index} style={{
                                padding: '20px',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '12px',
                                    gap: '15px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {review.profile_photo_url && (
                                            <img 
                                                src={review.profile_photo_url} 
                                                alt={review.author_name}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                        )}
                                        <div>
                                            <div style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                color: '#000',
                                                marginBottom: '2px'
                                            }}>
                                                {review.author_name}
                                            </div>
                                            <div style={{
                                                fontSize: '14px',
                                                color: '#666'
                                            }}>
                                                {review.relative_time_description}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        color: '#FFA500',
                                        fontSize: '16px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {renderStars(review.rating)}
                                    </div>
                                </div>
                                <p style={{
                                    fontSize: '15px',
                                    color: '#333',
                                    lineHeight: '1.6',
                                    margin: 0
                                }}>
                                    {review.text}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '10px'
                    }}>
                        <p style={{
                            fontSize: '16px',
                            color: '#666',
                            marginBottom: '15px'
                        }}>
                            No reviews available yet.
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: '#999'
                        }}>
                            Be the first to review this store!
                        </p>
                    </div>
                )}

                {/* View All Reviews Link */}
                {placeData?.url && reviews.length > 0 && (
                    <div style={{
                        marginTop: '25px',
                        textAlign: 'center'
                    }}>
                        <a
                            href={placeData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#4285F4',
                                textDecoration: 'none',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}
                        >
                            View all {placeData.user_ratings_total} reviews on Google →
                        </a>
                    </div>
                )}
            </div>

            {/* Setup Instructions (shown only if error or no API key) */}
            {error && (
                <div style={{
                    marginTop: '20px',
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    border: '2px solid #FFA500'
                }}>
                    <h3 style={{
                        fontSize: '22px',
                        color: '#FF6B00',
                        marginBottom: '15px',
                        fontWeight: 'bold'
                    }}>
                        ⚠️ Google Reviews Setup Required
                    </h3>
                    <p style={{
                        fontSize: '16px',
                        color: '#666',
                        marginBottom: '15px'
                    }}>
                        Error: {error}
                    </p>
                    <div style={{
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.8'
                    }}>
                        <p><strong>To display reviews:</strong></p>
                        <ol style={{ paddingLeft: '20px' }}>
                            <li>Add your Google Places API key to <code>.env.local</code></li>
                            <li>Ensure Places API is enabled in Google Cloud Console</li>
                            <li>Add Place IDs for each store in the stores data</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to render stars
function renderStars(rating: number) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
        <>
            {'★'.repeat(fullStars)}
            {hasHalfStar && '⯨'}
            {'☆'.repeat(emptyStars)}
        </>
    );
}
