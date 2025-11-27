# Directus Backend Setup Guide

This guide explains how to set up Directus collections to manage all images and text content on the website.

## Required Collections

### 1. **globals** (Singleton)
Already exists. Manages header, footer, and site-wide settings.

**Fields:**
- `site_name` (String)
- `site_logo` (File/Image)
- `header_nav` (JSON) - Array of {label, href}
- `footer_nav` (JSON) - Array of {label, href}
- `social_links` (JSON) - Array of {label, href, icon}
- `footer_text` (String)

### 2. **hero_slides** (Collection)
Manages all hero slider images and content.

**Fields to Create:**
- `id` (Primary Key)
- `image` (File/Image) - Hero image
- `title` (String) - Main heading
- `subtitle` (String) - Subheading
- `cta` (String) - Button text
- `link` (String) - Button URL
- `sort` (Integer) - Display order

**Example Data:**
```
1. image: /hero/hero1.png, title: "YOUR NEW FASHION CODE", subtitle: "Urban Clothing Stores in India", cta: "FIND YOUR CODE", link: "/store-locator", sort: 1
2. image: /hero/hero2.png, title: "LATEST ARRIVALS", subtitle: "Street-inspired fits", cta: "SHOP MEN", link: "/men", sort: 2
3. image: /hero/hero3.png, title: "SUMMER COLLECTION", subtitle: "Breezy. Bold. You.", cta: "SHOP WOMEN", link: "/women", sort: 3
```

### 3. **categories** (Collection)
Manages main categories (Men, Women, Kids).

**Fields to Create:**
- `id` (Primary Key)
- `title` (String) - Category name (e.g., "MEN")
- `slug` (String) - URL-friendly name (e.g., "men")
- `image` (File/Image) - Category hero image
- `link` (String) - Category page URL (e.g., "/men")
- `sort` (Integer) - Display order

**Example Data:**
```
1. title: "MEN", slug: "men", image: /categories/men.png, link: "/men", sort: 1
2. title: "WOMEN", slug: "women", image: /categories/women.png, link: "/women", sort: 2
3. title: "KIDS", slug: "kids", image: /categories/kids.png, link: "/kids", sort: 3
```

### 4. **subcategories** (Collection)
Manages subcategories within each main category.

**Fields to Create:**
- `id` (Primary Key)
- `title` (String) - Subcategory name (e.g., "T-SHIRTS")
- `slug` (String) - URL-friendly name (e.g., "tshirts")
- `image` (File/Image) - Subcategory hero image
- `link` (String) - Subcategory page URL (e.g., "/men/tshirts")
- `category_id` (Many-to-One Relation to categories)
- `sort` (Integer) - Display order within category

**Example Data for Men:**
```
1. title: "T-SHIRTS", slug: "tshirts", image: /categories/men-tshirts.png, link: "/men/tshirts", category_id: 1, sort: 1
2. title: "SHIRTS", slug: "shirts", image: /categories/men-shirts.png, link: "/men/shirts", category_id: 1, sort: 2
3. title: "JEANS", slug: "jeans", image: /categories/men-jeans.png, link: "/men/jeans", category_id: 1, sort: 3
4. title: "TROUSERS", slug: "trousers", image: /categories/men-trousers.png, link: "/men/trousers", category_id: 1, sort: 4
5. title: "JACKETS", slug: "jackets", image: /categories/men-jackets.png, link: "/men/jackets", category_id: 1, sort: 5
6. title: "SHOES", slug: "shoes", image: /categories/men-shoes.png, link: "/men/shoes", category_id: 1, sort: 6
```

### 5. **Relationship Setup**

In the **categories** collection, add a relationship field:
- Field name: `subcategories`
- Type: One-to-Many (O2M)
- Related Collection: `subcategories`
- Foreign Key: `category_id`

This allows you to fetch all subcategories when querying a category.

## How to Set Up in Directus

### Step 1: Create Collections

1. Go to **Settings** → **Data Model**
2. Click **Create Collection**
3. Create each collection with the fields listed above

### Step 2: Add Relations

1. In **categories** collection settings
2. Add **One-to-Many** relation field named `subcategories`
3. Point it to the `subcategories` collection

### Step 3: Upload Images

1. Go to **File Library**
2. Upload all hero images to `/hero/` folder
3. Upload all category images to `/categories/` folder
4. Reference these images in your collection items

### Step 4: Add Content

1. Go to each collection
2. Add items with the example data above
3. Make sure to upload actual images or use placeholder images

## What's Editable from Backend

✅ **Hero Slider:**
- All slide images
- All slide text (title, subtitle, CTA button)
- Slide order
- Slide links

✅ **Categories:**
- Category names
- Category images
- Category order

✅ **Subcategories:**
- Subcategory names
- Subcategory images
- Subcategory order
- Which category they belong to

✅ **Header & Footer:**
- Navigation links
- Social media links
- Footer text
- Site logo

## Fallback System

The website uses a **smart fallback system**:
- If Directus is unavailable or not configured, it uses MOCK_DATA
- No errors or crashes if backend is down
- Seamless transition when backend comes online

## Testing

1. Start Directus: `cd infra && docker-compose up`
2. Access Directus: http://localhost:8055
3. Create collections and add data
4. Refresh website to see changes

## Image Management

All images can be:
- Uploaded through Directus File Library
- Organized in folders (hero/, categories/, etc.)
- Resized and optimized automatically
- Replaced without code changes
