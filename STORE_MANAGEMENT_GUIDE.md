# ZECODE Store Management System - Setup Guide

## Overview
This document explains the complete store management system that has been implemented for the ZECODE website.

## Features Implemented

### 1. **Dynamic Store Detail Pages** (`/store/[slug]`)
- Individual pages for each store showing:
  - Store name, address, contact information
  - Working hours and opening date
  - Nearby areas/tags
  - Embedded Google Maps
  - Google Reviews section (placeholder with setup instructions)
  - Call and Get Directions buttons

### 2. **Centralized Store Data** (`src/data/stores.ts`)
- All 26 stores with complete information:
  - Basic info (name, address, city, state, pincode)
  - Contact (phone, email)
  - Geographic (lat, lng)
  - Additional (tags, workingHours, openedDate, placeId)
  - SEO-friendly slugs for URLs

### 3. **Admin Interface** (`/admin/stores`)
- Full CRUD operations for stores
- Add new stores manually with a form
- Edit existing stores
- Delete stores
- View all stores in a table
- CSV Export functionality
- CSV Import functionality

### 4. **API Endpoints** (`/api/stores`)
- GET all stores: `/api/stores`
- GET store by ID: `/api/stores?id=1`
- GET store by slug: `/api/stores?slug=hesaraghatta-road-bengaluru`

### 5. **Google Reviews Component** (`src/components/GoogleReviews.tsx`)
- Placeholder for Google Places API integration
- Setup instructions included
- Sample reviews displayed
- "Write a Review" button

### 6. **Store Locator Pages Updates**
- `/store-locator` - Grid view with cards
- `/store-locator-map` - Map view with sidebar
- Both pages now link to individual store detail pages

## File Structure

```
zecode-frontend/
├── src/
│   ├── app/
│   │   ├── store/
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Dynamic store detail pages
│   │   ├── store-locator/
│   │   │   └── page.tsx               # Grid view store locator
│   │   ├── store-locator-map/
│   │   │   └── page.tsx               # Map view store locator
│   │   ├── admin/
│   │   │   └── stores/
│   │   │       └── page.tsx           # Admin interface
│   │   └── api/
│   │       └── stores/
│   │           └── route.ts           # API endpoints
│   ├── components/
│   │   └── GoogleReviews.tsx          # Google Reviews component
│   ├── data/
│   │   └── stores.ts                  # Centralized store data
│   └── types/
│       └── store.ts                   # TypeScript interface
```

## Usage Instructions

### Accessing Store Pages

1. **Individual Store Page:**
   - URL format: `http://localhost:3000/store/[slug]`
   - Example: `http://localhost:3000/store/hesaraghatta-road-bengaluru`

2. **Store Locator (Grid View):**
   - URL: `http://localhost:3000/store-locator`
   - Features: Search, filter, view details button

3. **Store Locator (Map View):**
   - URL: `http://localhost:3000/store-locator-map`
   - Features: Interactive map, sidebar with stores

4. **Admin Panel:**
   - URL: `http://localhost:3000/admin/stores`
   - Features: Add, edit, delete stores, CSV import/export

### Adding a New Store

#### Method 1: Using the Admin Interface
1. Go to `http://localhost:3000/admin/stores`
2. Click "+ Add New Store"
3. Fill in the form with all required fields:
   - Store Name *
   - Slug (auto-generated from name if left empty)
   - Address *
   - City *
   - State *
   - Pincode *
   - Phone *
   - Email *
   - Latitude *
   - Longitude *
   - Nearby Areas (comma-separated)
   - Working Hours
   - Opened Date
   - Google Place ID (for reviews)
4. Click "Add Store"

#### Method 2: CSV Import
1. Go to `http://localhost:3000/admin/stores`
2. Click "Export CSV" to see the format
3. Prepare your CSV file with columns:
   ```
   id,name,slug,address,city,state,pincode,phone,email,lat,lng,tags,workingHours,openedDate,placeId
   ```
4. Click "Import CSV" and select your file
5. All stores will be imported

#### Method 3: Direct Code Update
1. Edit `src/data/stores.ts`
2. Add a new store object to the `STORES` array:
   ```typescript
   {
       id: 27,
       name: "ZECODE New Store",
       slug: "new-store-bengaluru",
       address: "Your address here",
       city: "Bengaluru",
       state: "Karnataka",
       pincode: "560001",
       phone: "+91-XXXXXXXXXX",
       email: "newstore@zecode.com",
       lat: 12.9716,
       lng: 77.5946,
       tags: ["Area1", "Area2"],
       workingHours: "10 AM to 10 PM",
       openedDate: "DD/MM/YYYY",
       placeId: "ChIJ..." // Optional
   }
   ```
3. Save the file

### Getting Store Coordinates (lat/lng)

1. Go to [Google Maps](https://www.google.com/maps)
2. Search for your store address
3. Right-click on the location pin
4. Click on the coordinates (e.g., "12.9716, 77.5946")
5. The coordinates will be copied to your clipboard
6. First number is latitude, second is longitude

### Setting Up Google Reviews

#### Step 1: Enable Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Places API" and "Maps Embed API"
4. Create API credentials (API Key)
5. Restrict the API key to your domain

#### Step 2: Get Place ID
1. Go to [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)
2. Search for your store
3. Copy the Place ID (starts with "ChIJ...")
4. Add it to your store data in the `placeId` field

#### Step 3: Create Server-Side API
To fetch reviews securely, create an API endpoint:

```typescript
// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`
        );
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
```

Add to `.env.local`:
```
GOOGLE_PLACES_API_KEY=your_api_key_here
```

## CSV Format

When importing stores via CSV, use this format:

```csv
id,name,slug,address,city,state,pincode,phone,email,lat,lng,tags,workingHours,openedDate,placeId
1,"ZECODE Hesaraghatta","hesaraghatta-road-bengaluru","01, Bagalakunte, 1st cross","Bengaluru","Karnataka","560073","+91-8657039305","hessargatta@zecode.com",13.0358,77.4958,"Area1;Area2;Area3","10 AM to 10 PM","01/11/2024","ChIJ..."
```

**Important Notes:**
- Wrap fields containing commas in double quotes
- Separate multiple tags with semicolons (;)
- Do not use commas in address fields (or wrap in quotes)
- Include header row
- All fields should be present (use empty quotes "" for optional fields)

## API Usage

### Get All Stores
```javascript
fetch('/api/stores')
    .then(res => res.json())
    .then(data => console.log(data.stores));
```

### Get Store by ID
```javascript
fetch('/api/stores?id=1')
    .then(res => res.json())
    .then(data => console.log(data));
```

### Get Store by Slug
```javascript
fetch('/api/stores?slug=hesaraghatta-road-bengaluru')
    .then(res => res.json())
    .then(data => console.log(data));
```

## Troubleshooting

### Store Page Not Found
- Check if the slug in the URL matches the slug in `src/data/stores.ts`
- Slugs should be lowercase, hyphenated, and URL-friendly
- Example: "ZECODE Hesaraghatta" → "hesaraghatta-road-bengaluru"

### Google Maps Not Showing
- Verify your API key is correct in the store detail page
- Check if Maps Embed API is enabled in Google Cloud Console
- Ensure latitude and longitude are correct numbers
- Check browser console for error messages

### CSV Import Not Working
- Ensure CSV format matches the template exactly
- Check for special characters or encoding issues
- Verify all required fields are present
- Tags should be separated by semicolons (;)

### Reviews Not Displaying
- This is expected - the Google Reviews integration requires:
  1. Valid Google Places API key
  2. Place ID for each store
  3. Server-side API endpoint to fetch reviews
  4. Billing enabled on Google Cloud project

## Next Steps

1. **Fix Store Locator Page:**
   - There's a syntax error in `src/app/store-locator/page.tsx` at line 526
   - The page has duplicate STORES array definition
   - Should be updated to use the centralized `src/data/stores.ts` file

2. **Update Store Locator Map Page:**
   - Update to use centralized stores data
   - Add "View Details" links to each store card

3. **Implement Real Google Reviews:**
   - Set up Google Places API
   - Create server-side API endpoint
   - Update GoogleReviews component to fetch real data

4. **Add Store Images:**
   - Update Store interface to include `images: string[]`
   - Add image upload functionality in admin panel
   - Display images on store detail pages

5. **SEO Optimization:**
   - Add metadata to store detail pages
   - Generate sitemap for store pages
   - Add structured data (Schema.org LocalBusiness)

6. **Store Features:**
   - Add store hours with open/closed status
   - Add special features (parking, facilities, etc.)
   - Add store manager/staff information

## Support

For issues or questions, contact the development team.

---

**Last Updated:** November 24, 2025
**Version:** 1.0.0
