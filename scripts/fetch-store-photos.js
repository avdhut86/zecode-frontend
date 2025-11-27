const fs = require('fs');
const path = require('path');

// Google Places API configuration
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyCMOQqKq24jDkr8ewS1F9M_V9Kyps6T4x0';

// Store to fetch photos for
const STORE = {
    id: 1,
    name: "ZECODE Hesaraghatta",
    slug: "hesaraghatta-road-bengaluru",
    placeId: "ChIJMZMHeHcjrjsR1vSRgUCbrbc"
};

async function fetchStorePhotos() {
    try {
        console.log(`\nFetching photos for: ${STORE.name}`);
        console.log(`Place ID: ${STORE.placeId}\n`);

        // Fetch place details with photos
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${STORE.placeId}&fields=name,photos&key=${API_KEY}`;
        
        const response = await fetch(detailsUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            const photos = data.result.photos || [];
            
            console.log(`✓ Found ${photos.length} photos`);

            if (photos.length > 0) {
                // Generate photo URLs (max 10 photos)
                const photoUrls = photos.slice(0, 10).map((photo, index) => {
                    // Google Places Photo API URL
                    // maxwidth can be up to 4800
                    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photo.photo_reference}&key=${API_KEY}`;
                    
                    console.log(`  Photo ${index + 1}: ${photo.width}x${photo.height}`);
                    console.log(`    Reference: ${photo.photo_reference.substring(0, 50)}...`);
                    console.log(`    URL: ${photoUrl}\n`);
                    
                    return photoUrl;
                });

                // Save results
                const results = {
                    storeId: STORE.id,
                    storeName: STORE.name,
                    slug: STORE.slug,
                    placeId: STORE.placeId,
                    photoCount: photoUrls.length,
                    photos: photoUrls,
                    photoReferences: photos.slice(0, 10).map(p => ({
                        reference: p.photo_reference,
                        width: p.width,
                        height: p.height,
                        attributions: p.html_attributions
                    })),
                    fetchedAt: new Date().toISOString()
                };

                const outputPath = path.join(__dirname, 'hesaraghatta-photos.json');
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
                
                console.log(`\n✓ Results saved to: ${outputPath}`);
                console.log(`\n📸 Photo URLs to add to stores.ts:`);
                console.log(`\nphotos: [`);
                photoUrls.forEach(url => {
                    console.log(`    "${url}",`);
                });
                console.log(`]`);

                return results;
            } else {
                console.log('⚠ No photos found for this place');
                return null;
            }
        } else {
            console.error(`✗ Error: ${data.status}`);
            if (data.error_message) {
                console.error(`  Message: ${data.error_message}`);
            }
            return null;
        }
    } catch (error) {
        console.error('Error fetching photos:', error);
        return null;
    }
}

// Run the script
console.log('========================================');
console.log('Google Places Photo Fetcher');
console.log('========================================');

fetchStorePhotos().then(() => {
    console.log('\n========================================');
    console.log('Photo fetch complete!');
    console.log('========================================\n');
});
