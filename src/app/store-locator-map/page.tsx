'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { STORES } from '@/data/stores';
import { Store } from '@/types/store';
import PageHeader from '@/components/PageHeader';

export default function StoreLocatorMapPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    const stores = STORES;

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Google Maps embed URL with all markers
    const getMapUrl = () => {
        const baseUrl = "https://www.google.com/maps/embed/v1/place";
        const apiKey = "AIzaSyCMOQqKq24jDkr8ewS1F9M_V9Kyps6T4x0";
        
        if (selectedStore) {
            return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(selectedStore.address)}&zoom=15`;
        }
        
        // Default to Karnataka center
        return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=12.9716,77.5946&zoom=10`;
    };

    return (
        <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            fontFamily: 'var(--font-din-condensed), sans-serif'
        }}>
            {/* Header Section */}
            <PageHeader pageKey="store-locator-map" defaultTitle="STORE LOCATOR" subtitle="Find a ZECODE store near you" />

            {/* Main Content - Map and Store List */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 350px',
                height: 'calc(100vh - 100px)',
                gap: '0'
            }}>
                {/* Map Section - Now on the left */}
                <div style={{
                    backgroundColor: '#e5e7eb',
                    position: 'relative'
                }}>
                    <iframe
                        src={getMapUrl()}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                        }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Store locations map"
                    />
                </div>

                {/* Store List Sidebar - Now on the right with search */}
                <div style={{
                    backgroundColor: '#ffffff',
                    overflowY: 'auto',
                    borderLeft: '1px solid #e5e7eb'
                }}>
                    {/* Search Bar in Sidebar */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                    }}>
                        <input
                            type="text"
                            placeholder="Search by city, area, or store name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{
                        padding: '16px',
                        borderBottom: '2px solid #000000',
                        backgroundColor: '#f9fafb'
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-din-condensed)',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            margin: '0'
                        }}>
                            {filteredStores.length} Stores Found
                        </h2>
                    </div>

                    {filteredStores.length === 0 ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#6b7280'
                        }}>
                            <p>No stores found matching your search</p>
                        </div>
                    ) : (
                        filteredStores.map((store) => (
                            <div
                                key={store.id}
                                onClick={() => setSelectedStore(store)}
                                style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    backgroundColor: selectedStore?.id === store.id ? '#f3f4f6' : '#ffffff',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedStore?.id !== store.id) {
                                        e.currentTarget.style.backgroundColor = '#f9fafb';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedStore?.id !== store.id) {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                    }
                                }}
                            >
                                <h3 style={{
                                    fontFamily: 'var(--font-din-condensed)',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    color: selectedStore?.id === store.id ? '#C83232' : '#111827'
                                }}>
                                    {store.name}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    marginBottom: '8px',
                                    lineHeight: '1.5'
                                }}>
                                    📍 {store.address}
                                </p>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    fontSize: '13px',
                                    color: '#4b5563'
                                }}>
                                    <div>📞 <a href={`tel:${store.phone}`} style={{ color: '#4b5563', textDecoration: 'none' }}>{store.phone}</a></div>
                                    <div>✉️ <a href={`mailto:${store.email}`} style={{ color: '#4b5563', textDecoration: 'none' }}>{store.email}</a></div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '6px',
                                    marginTop: '12px'
                                }}>
                                    {store.tags.slice(0, 3).map((tag, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                fontSize: '11px',
                                                padding: '4px 8px',
                                                backgroundColor: '#e5e7eb',
                                                borderRadius: '4px',
                                                color: '#4b5563'
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <Link
                                    href={`/store/${store.slug}`}
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        backgroundColor: '#C83232',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#a02828';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#C83232';
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    VIEW STORE DETAILS →
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
