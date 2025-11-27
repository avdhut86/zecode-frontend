# Store Photo Gallery Guide

## Overview
The store detail pages now include a photo gallery feature that displays store images in an interactive grid with a lightbox viewer.

## Features
- ✅ Responsive grid layout for photo thumbnails
- ✅ Click to open full-size lightbox view
- ✅ Navigate between photos with prev/next buttons
- ✅ Close lightbox with X button or by clicking outside
- ✅ Photo counter (e.g., "2 / 4")
- ✅ Smooth hover effects on thumbnails

## Adding Photos to Stores

### Method 1: Edit stores.ts Directly

1. Open `src/data/stores.ts`
2. Add a `photos` array to any store:

```typescript
{
    id: 1,
    name: "ZECODE Hesaraghatta",
    slug: "hesaraghatta-road-bengaluru",
    // ... other fields ...
    photos: [
        "/placeholders/store-exterior.jpg",
        "/placeholders/store-interior.jpg",
        "/placeholders/store-products.jpg",
        "/placeholders/store-counter.jpg"
    ]
}
```

### Method 2: Upload Photos and Update

1. **Upload photos to the public folder:**
   - Create a folder: `public/stores/[store-slug]/`
   - Example: `public/stores/hesaraghatta-road-bengaluru/`
   - Add your photos: `photo1.jpg`, `photo2.jpg`, etc.

2. **Update the store data:**
```typescript
photos: [
    "/stores/hesaraghatta-road-bengaluru/photo1.jpg",
    "/stores/hesaraghatta-road-bengaluru/photo2.jpg",
    "/stores/hesaraghatta-road-bengaluru/photo3.jpg"
]
```

### Method 3: Use External URLs (CDN/Cloud Storage)

If you host images on a CDN or cloud storage:

```typescript
photos: [
    "https://your-cdn.com/stores/hesaraghatta/exterior.jpg",
    "https://your-cdn.com/stores/hesaraghatta/interior.jpg"
]
```

## Photo Recommendations

### Image Specifications
- **Format:** JPG or PNG
- **Resolution:** Minimum 1200x800 pixels
- **Aspect Ratio:** 3:2 or 16:9 recommended
- **File Size:** Keep under 500KB per image (optimize for web)
- **Quality:** High-quality, well-lit photos

### Photo Types to Include
1. **Store Exterior** - Front facade, signage, entrance
2. **Store Interior** - Main shopping area, layout
3. **Product Display** - Shelves, featured products
4. **Counter Area** - Checkout, customer service area
5. **Special Features** - Kids' zone, seating area, etc.

### Photography Tips
- Use good lighting (natural light preferred)
- Keep the store clean and organized
- Avoid clutter in frame
- Include ZECODE branding prominently
- Take photos during non-busy hours
- Shoot from multiple angles

## Current Implementation

### Stores with Photos
Currently, only **ZECODE Hesaraghatta** has sample placeholder photos configured.

### Adding Photos to All Stores

To add photos to all 26 stores:

1. Organize your photos by store
2. Upload to `public/stores/[store-slug]/`
3. Update each store entry in `src/data/stores.ts`

Example script to bulk update:
```typescript
// In stores.ts, add photos field to each store:
photos: [
    `/stores/${store.slug}/exterior.jpg`,
    `/stores/${store.slug}/interior.jpg`,
    `/stores/${store.slug}/products.jpg`
]
```

## Component Details

### StorePhotoGallery Component
Located at: `src/components/StorePhotoGallery.tsx`

**Props:**
- `photos: string[]` - Array of photo URLs
- `storeName: string` - Name of the store for alt text

**Features:**
- Automatic grid layout (responsive)
- Lightbox with keyboard navigation (← →)
- Image optimization with Next.js Image component
- Mobile-friendly touch gestures

## Customization

### Changing Gallery Layout

Edit `StorePhotoGallery.tsx`:

```typescript
// Change grid columns
gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'

// Make it 3 columns fixed:
gridTemplateColumns: 'repeat(3, 1fr)'

// Make it 2 columns:
gridTemplateColumns: 'repeat(2, 1fr)'
```

### Changing Thumbnail Height

```typescript
height: '200px' // Change this value
```

### Styling Options

You can modify:
- Border radius
- Hover effects
- Gap between images
- Shadow effects
- Lightbox background color

## API Integration (Future)

To fetch photos from Google Places API:

1. Update `src/app/api/places/route.ts` to include photo references
2. Use Google Places Photo API to generate URLs
3. Automatically populate the `photos` array

## Troubleshooting

### Photos Not Displaying
1. Check file path is correct
2. Ensure images are in `public` folder
3. Verify file names match exactly (case-sensitive)
4. Check browser console for 404 errors

### Images Look Stretched
- Use consistent aspect ratios
- Adjust `objectFit: 'cover'` to `'contain'` if needed

### Performance Issues
- Optimize image file sizes
- Use WebP format for better compression
- Consider lazy loading for many images

## Next Steps

1. **Capture photos of all 26 stores**
2. **Upload to appropriate folders**
3. **Update stores.ts with photo paths**
4. **Test on different devices**
5. **Optional: Add more photos per store (recommended 4-8 photos)**

## Support

For any issues with the photo gallery feature, check:
- Console errors in browser DevTools
- Network tab for failed image requests
- File permissions in the public folder
