'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Store } from '@/types/store';
import { STORES } from '@/data/stores';

export default function StoreAdminPage() {
    const [stores, setStores] = useState<Store[]>(STORES);
    const [isAddingStore, setIsAddingStore] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isFetchingPhotos, setIsFetchingPhotos] = useState(false);
    const [photosFetchStatus, setPhotosFetchStatus] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<Store>>({
        name: '',
        slug: '',
        address: '',
        city: '',
        state: 'Karnataka',
        pincode: '',
        phone: '',
        email: '',
        lat: 0,
        lng: 0,
        tags: [],
        workingHours: '10 AM to 10 PM',
        openedDate: '',
        placeId: '',
        photos: []
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        setFormData(prev => ({ ...prev, tags }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleFetchPhotos = async () => {
        if (!formData.placeId) {
            setPhotosFetchStatus('❌ Please enter a Place ID first');
            return;
        }

        setIsFetchingPhotos(true);
        setPhotosFetchStatus('⏳ Fetching photos from Google Maps...');

        try {
            // Fetch place details with photos
            const response = await fetch(`/api/places?placeId=${formData.placeId}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch place details');
            }

            const photos = data.data.photos || [];
            
            if (photos.length === 0) {
                setPhotosFetchStatus('⚠️ No photos found for this place');
                setIsFetchingPhotos(false);
                return;
            }

            // Generate photo URLs from photo references
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCMOQqKq24jDkr8ewS1F9M_V9Kyps6T4x0';
            const photoUrls = photos.slice(0, 10).map((photo: any) => 
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photo.photo_reference}&key=${apiKey}`
            );

            setFormData(prev => ({ ...prev, photos: photoUrls }));
            setPhotosFetchStatus(`✅ Successfully fetched ${photoUrls.length} photos!`);
        } catch (error) {
            console.error('Error fetching photos:', error);
            setPhotosFetchStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsFetchingPhotos(false);
            setTimeout(() => setPhotosFetchStatus(''), 5000);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingStore) {
            // Update existing store
            setStores(prev => prev.map(store => 
                store.id === editingStore.id ? { ...editingStore, ...formData } as Store : store
            ));
            setEditingStore(null);
        } else {
            // Add new store
            const newStore: Store = {
                id: Math.max(...stores.map(s => s.id)) + 1,
                name: formData.name || '',
                slug: formData.slug || generateSlug(formData.name || ''),
                address: formData.address || '',
                city: formData.city || '',
                state: formData.state || 'Karnataka',
                pincode: formData.pincode || '',
                phone: formData.phone || '',
                email: formData.email || '',
                lat: formData.lat || 0,
                lng: formData.lng || 0,
                tags: formData.tags || [],
                workingHours: formData.workingHours || '10 AM to 10 PM',
                openedDate: formData.openedDate || '',
                placeId: formData.placeId || ''
            };
            setStores(prev => [...prev, newStore]);
            setIsAddingStore(false);
        }

        // Reset form
        setFormData({
            name: '',
            slug: '',
            address: '',
            city: '',
            state: 'Karnataka',
            pincode: '',
            phone: '',
            email: '',
            lat: 0,
            lng: 0,
            tags: [],
            workingHours: '10 AM to 10 PM',
            openedDate: '',
            placeId: '',
            photos: []
        });
    };

    const handleEdit = (store: Store) => {
        setEditingStore(store);
        setFormData(store);
        setIsAddingStore(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this store?')) {
            setStores(prev => prev.filter(store => store.id !== id));
        }
    };

    const handleExportCSV = () => {
        const headers = ['id', 'name', 'slug', 'address', 'city', 'state', 'pincode', 'phone', 'email', 'lat', 'lng', 'tags', 'workingHours', 'openedDate', 'placeId'];
        const csvContent = [
            headers.join(','),
            ...stores.map(store => [
                store.id,
                `"${store.name}"`,
                store.slug,
                `"${store.address}"`,
                store.city,
                store.state,
                store.pincode,
                store.phone,
                store.email,
                store.lat,
                store.lng,
                `"${store.tags.join(';')}"`,
                `"${store.workingHours || ''}"`,
                `"${store.openedDate || ''}"`,
                `"${store.placeId || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zecode-stores-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',');

            const importedStores: Store[] = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));

                const store: Store = {
                    id: parseInt(cleanValues[0]) || 0,
                    name: cleanValues[1] || '',
                    slug: cleanValues[2] || '',
                    address: cleanValues[3] || '',
                    city: cleanValues[4] || '',
                    state: cleanValues[5] || '',
                    pincode: cleanValues[6] || '',
                    phone: cleanValues[7] || '',
                    email: cleanValues[8] || '',
                    lat: parseFloat(cleanValues[9]) || 0,
                    lng: parseFloat(cleanValues[10]) || 0,
                    tags: cleanValues[11]?.split(';').filter(t => t) || [],
                    workingHours: cleanValues[12] || '',
                    openedDate: cleanValues[13] || '',
                    placeId: cleanValues[14] || ''
                };

                importedStores.push(store);
            }

            setStores(importedStores);
            alert(`Successfully imported ${importedStores.length} stores!`);
        };

        reader.readAsText(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            fontFamily: '"DIN Condensed", sans-serif'
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: '#000000',
                color: 'white',
                padding: '20px 0',
                borderBottom: '4px solid #C83232'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        letterSpacing: '2px'
                    }}>
                        STORE ADMIN PANEL
                    </h1>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Link href="/store-locator" style={{
                            padding: '10px 20px',
                            backgroundColor: '#C83232',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontSize: '16px'
                        }}>
                            View Store Locator
                        </Link>
                    </div>
                </div>
            </header>

            <main style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '40px 20px'
            }}>
                {/* Action Buttons */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    marginBottom: '30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        marginBottom: '20px',
                        color: '#000'
                    }}>
                        Store Management
                    </h2>
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => setIsAddingStore(!isAddingStore)}
                            style={{
                                padding: '12px 30px',
                                backgroundColor: '#C83232',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {isAddingStore ? '✕ Cancel' : '+ Add New Store'}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            style={{
                                padding: '12px 30px',
                                backgroundColor: '#000000',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            📥 Export CSV
                        </button>
                        <label style={{
                            padding: '12px 30px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}>
                            📤 Import CSV
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleImportCSV}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    <p style={{
                        marginTop: '15px',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        Total Stores: <strong>{stores.length}</strong>
                    </p>
                </div>

                {/* Add/Edit Form */}
                {isAddingStore && (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        marginBottom: '30px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            marginBottom: '20px',
                            color: '#000'
                        }}>
                            {editingStore ? 'Edit Store' : 'Add New Store'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Slug (URL-friendly) *
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        placeholder="auto-generated from name"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Address *
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Pincode *
                                    </label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="+91-XXXXXXXXXX"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="store@zecode.com"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Latitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="lat"
                                        value={formData.lat}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="12.9716"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Longitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="lng"
                                        value={formData.lng}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="77.5946"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Nearby Areas (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tags?.join(', ')}
                                        onChange={handleTagsChange}
                                        placeholder="Area1, Area2, Area3"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Working Hours
                                    </label>
                                    <input
                                        type="text"
                                        name="workingHours"
                                        value={formData.workingHours}
                                        onChange={handleInputChange}
                                        placeholder="10 AM to 10 PM"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Opened Date
                                    </label>
                                    <input
                                        type="text"
                                        name="openedDate"
                                        value={formData.openedDate}
                                        onChange={handleInputChange}
                                        placeholder="DD/MM/YYYY"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        color: '#333'
                                    }}>
                                        Google Place ID (for reviews and photos)
                                    </label>
                                    <input
                                        type="text"
                                        name="placeId"
                                        value={formData.placeId}
                                        onChange={handleInputChange}
                                        placeholder="ChIJ..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                    <div style={{ marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={handleFetchPhotos}
                                            disabled={isFetchingPhotos || !formData.placeId}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: isFetchingPhotos ? '#999' : '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                fontSize: '14px',
                                                cursor: isFetchingPhotos || !formData.placeId ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {isFetchingPhotos ? '⏳ Fetching...' : '📸 Fetch Photos from Google Maps'}
                                        </button>
                                        {photosFetchStatus && (
                                            <span style={{
                                                marginLeft: '15px',
                                                fontSize: '14px',
                                                color: photosFetchStatus.includes('✅') ? '#4CAF50' : 
                                                       photosFetchStatus.includes('❌') ? '#C83232' : '#666'
                                            }}>
                                                {photosFetchStatus}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {formData.photos && formData.photos.length > 0 && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: 'bold',
                                            color: '#333'
                                        }}>
                                            Store Photos ({formData.photos.length})
                                        </label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                            gap: '10px',
                                            padding: '15px',
                                            backgroundColor: '#f9f9f9',
                                            borderRadius: '5px'
                                        }}>
                                            {formData.photos.map((photo, index) => (
                                                <div key={index} style={{
                                                    position: 'relative',
                                                    height: '100px',
                                                    backgroundColor: '#e0e0e0',
                                                    borderRadius: '5px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <img
                                                        src={photo}
                                                        alt={`Store photo ${index + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{
                                marginTop: '30px',
                                display: 'flex',
                                gap: '15px'
                            }}>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '12px 40px',
                                        backgroundColor: '#C83232',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {editingStore ? 'Update Store' : 'Add Store'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingStore(false);
                                        setEditingStore(null);
                                        setFormData({
                                            name: '',
                                            slug: '',
                                            address: '',
                                            city: '',
                                            state: 'Karnataka',
                                            pincode: '',
                                            phone: '',
                                            email: '',
                                            lat: 0,
                                            lng: 0,
                                            tags: [],
                                            workingHours: '10 AM to 10 PM',
                                            openedDate: '',
                                            placeId: ''
                                        });
                                    }}
                                    style={{
                                        padding: '12px 40px',
                                        backgroundColor: '#666',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stores List */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                    }}>
                        <thead>
                            <tr style={{
                                backgroundColor: '#000000',
                                color: 'white'
                            }}>
                                <th style={{ padding: '15px', textAlign: 'left' }}>ID</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>City</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Phone</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map((store, index) => (
                                <tr key={store.id} style={{
                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                                    borderBottom: '1px solid #eee'
                                }}>
                                    <td style={{ padding: '15px' }}>{store.id}</td>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{store.name}</td>
                                    <td style={{ padding: '15px' }}>{store.city}</td>
                                    <td style={{ padding: '15px' }}>{store.phone}</td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Link
                                                href={`/store/${store.slug}`}
                                                target="_blank"
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#4CAF50',
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    borderRadius: '3px',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleEdit(store)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#2196F3',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    fontSize: '14px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(store.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#f44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    fontSize: '14px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* CSV Format Instructions */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    marginTop: '30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{
                        fontSize: '20px',
                        marginBottom: '15px',
                        color: '#000'
                    }}>
                        CSV Import Format
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.6',
                        marginBottom: '15px'
                    }}>
                        Your CSV file should have the following columns in order:
                    </p>
                    <code style={{
                        display: 'block',
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '5px',
                        fontSize: '12px',
                        overflowX: 'auto',
                        whiteSpace: 'pre'
                    }}>
                        id,name,slug,address,city,state,pincode,phone,email,lat,lng,tags,workingHours,openedDate,placeId
                    </code>
                    <p style={{
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.6',
                        marginTop: '15px'
                    }}>
                        • Multiple tags should be separated with semicolons (;)<br />
                        • Wrap fields containing commas in double quotes<br />
                        • Export the current data as CSV to see the format
                    </p>
                </div>
            </main>
        </div>
    );
}
