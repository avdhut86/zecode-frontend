"use client";
import { useState } from "react";
import Link from "next/link";
import { STORES } from "@/data/stores";
import PageHeader from "@/components/PageHeader";

export default function StoreLocatorPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter stores based on search query
    const filteredStores = STORES.filter((store) => {
        const query = searchQuery.toLowerCase();
        return (
            store.name.toLowerCase().includes(query) ||
            store.city.toLowerCase().includes(query) ||
            store.address.toLowerCase().includes(query) ||
            store.tags.some(tag => tag.toLowerCase().includes(query))
        );
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Header Section */}
            <PageHeader pageKey="store-locator" defaultTitle="ZECODE NEAR YOU" subtitle="Find a store near you" />

            {/* Search Bar Section */}
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '24px 32px',
                borderBottom: '1px solid #e5e7eb'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ 
                        maxWidth: '600px', 
                        margin: '0 auto',
                        position: 'relative'
                    }}>
                        <input
                            type="text"
                            placeholder="Search by location, area, or store name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 50px 12px 16px',
                                fontSize: '16px',
                                border: '2px solid #d1d5db',
                                borderRadius: '8px',
                                outline: 'none',
                                fontFamily: 'Inter, sans-serif'
                            }}
                        />
                        <button
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: '#000000',
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Store Grid */}
            <div style={{ padding: '60px 32px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '32px'
                    }}>
                        {filteredStores.map((store) => (
                            <div
                                key={store.id}
                                style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                className="store-card"
                            >
                                {/* Store Name */}
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    marginBottom: '12px',
                                    color: '#000000',
                                    fontFamily: '"DIN Condensed", "League Gothic", system-ui, sans-serif',
                                    letterSpacing: '0.5px'
                                }}>
                                    {store.name}
                                </h2>

                                {/* Address */}
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start',
                                    marginBottom: '12px',
                                    gap: '8px'
                                }}>
                                    <span style={{ color: '#6b7280', fontSize: '14px', flexShrink: 0 }}>📍</span>
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#4b5563',
                                        margin: 0,
                                        lineHeight: '1.6'
                                    }}>
                                        {store.address}, {store.city}, {store.state} {store.pincode}
                                    </p>
                                </div>

                                {/* Tags */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    marginBottom: '16px'
                                }}>
                                    {store.tags.slice(0, 4).map((tag, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                color: '#6b7280',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Contact Info */}
                                <div style={{ 
                                    borderTop: '1px solid #e5e7eb',
                                    paddingTop: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px' }}>📞</span>
                                        <a 
                                            href={`tel:${store.phone}`}
                                            style={{
                                                fontSize: '14px',
                                                color: '#3b82f6',
                                                textDecoration: 'none',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {store.phone}
                                        </a>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px' }}>✉️</span>
                                        <a 
                                            href={`mailto:${store.email}`}
                                            style={{
                                                fontSize: '14px',
                                                color: '#3b82f6',
                                                textDecoration: 'none',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {store.email}
                                        </a>
                                    </div>
                                </div>

                                {/* View Details Link */}
                                <Link 
                                    href={`/store/${store.slug}`}
                                    style={{
                                        display: 'block',
                                        marginTop: '16px',
                                        padding: '12px 20px',
                                        backgroundColor: '#C83232',
                                        color: 'white',
                                        textAlign: 'center',
                                        textDecoration: 'none',
                                        borderRadius: '5px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        transition: 'background-color 0.3s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#a82828'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#C83232'}
                                >
                                    VIEW STORE DETAILS →
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* No Results */}
                    {filteredStores.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#6b7280'
                        }}>
                            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No stores found</p>
                            <p style={{ fontSize: '14px' }}>Try adjusting your search criteria</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .store-card:hover {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
