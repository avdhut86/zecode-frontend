/**
 * Utility script to automatically fetch Google Places data for all stores
 * and update the stores.ts file with placeId and other details
 * 
 * Run this script with: node scripts/fetch-store-places.js
 */

const fs = require('fs');
const path = require('path');

// Your Google Places API Key
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyCMOQqKq24jDkr8ewS1F9M_V9Kyps6T4x0';

// Import stores data
const storesPath = path.join(__dirname, '../src/data/stores.ts');

async function findPlaceId(storeName, address, city) {
    const query = `${storeName}, ${address}, ${city}`;
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,formatted_address,geometry&key=${GOOGLE_PLACES_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
            return {
                placeId: data.candidates[0].place_id,
                lat: data.candidates[0].geometry?.location?.lat,
                lng: data.candidates[0].geometry?.location?.lng
            };
        }
        return null;
    } catch (error) {
        console.error(`Error finding place for ${storeName}:`, error);
        return null;
    }
}

async function getPlaceDetails(placeId) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,reviews,geometry,url&key=${GOOGLE_PLACES_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            return data.result;
        }
        return null;
    } catch (error) {
        console.error(`Error getting place details:`, error);
        return null;
    }
}

async function processStores() {
    console.log('Starting to fetch Google Places data for all stores...\n');
    
    // Read the current stores file
    const storesContent = fs.readFileSync(storesPath, 'utf8');
    
    // Extract stores array (simplified parsing)
    const storesMatch = storesContent.match(/export const STORES: Store\[\] = \[([\s\S]*?)\];/);
    if (!storesMatch) {
        console.error('Could not parse stores array');
        return;
    }
    
    console.log('Found stores data. Processing each store...\n');
    
    // Parse stores (this is a simplified approach - in production, use proper parsing)
    const storesArrayText = storesMatch[1];
    const storeMatches = storesArrayText.match(/\{[\s\S]*?\},/g);
    
    console.log(`Found ${storeMatches?.length || 0} stores to process\n`);
    
    const results = [];
    
    if (storeMatches) {
        for (let i = 0; i < storeMatches.length; i++) {
            const storeText = storeMatches[i];
            
            // Extract store name, address, city
            const nameMatch = storeText.match(/name:\s*"([^"]+)"/);
            const addressMatch = storeText.match(/address:\s*"([^"]+)"/);
            const cityMatch = storeText.match(/city:\s*"([^"]+)"/);
            
            if (nameMatch && addressMatch && cityMatch) {
                const storeName = nameMatch[1];
                const address = addressMatch[1];
                const city = cityMatch[1];
                
                console.log(`Processing: ${storeName}...`);
                
                // Find Place ID
                const placeData = await findPlaceId(storeName, address, city);
                
                if (placeData && placeData.placeId) {
                    console.log(`✓ Found Place ID: ${placeData.placeId}`);
                    
                    // Get detailed information
                    const details = await getPlaceDetails(placeData.placeId);
                    
                    if (details) {
                        results.push({
                            name: storeName,
                            placeId: placeData.placeId,
                            rating: details.rating,
                            totalReviews: details.user_ratings_total,
                            lat: placeData.lat || details.geometry?.location?.lat,
                            lng: placeData.lng || details.geometry?.location?.lng,
                            googleUrl: details.url
                        });
                        console.log(`✓ Rating: ${details.rating || 'N/A'}, Reviews: ${details.user_ratings_total || 0}\n`);
                    }
                } else {
                    console.log(`✗ Could not find Place ID for ${storeName}\n`);
                }
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }
    
    // Save results
    const resultsPath = path.join(__dirname, 'store-places-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('\n========================================');
    console.log(`Processed ${results.length} stores`);
    console.log(`Results saved to: ${resultsPath}`);
    console.log('========================================\n');
    
    console.log('Summary:');
    results.forEach(store => {
        console.log(`${store.name}: ${store.placeId}`);
    });
}

// Run the script
processStores().catch(console.error);
