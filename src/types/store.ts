// Shared Store type definition
export interface Store {
    id: number;
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    lat: number;
    lng: number;
    tags: string[];
    workingHours?: string;
    openedDate?: string;
    placeId?: string; // Google Places ID for reviews
    photos?: string[]; // Array of photo URLs for the store gallery
    description?: string; // Store description
    featuredProducts?: number[]; // Array of product IDs
}

// Product type definition
export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    inStock: boolean;
    rating?: number;
    reviewCount?: number;
}
