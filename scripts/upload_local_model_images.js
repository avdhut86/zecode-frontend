/**
 * Upload locally generated model images to Cloudinary and update Directus
 * 
 * Run: node upload_local_model_images.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) process.env[key] = value;
        }
    });
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ds8llatku';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'zecode@siyaram.com';
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

const OUTPUT_FOLDER = path.join(__dirname, 'generated-model-poses');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getDirectusToken() {
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD })
    });
    const data = await response.json();
    return data.data.access_token;
}

async function uploadToCloudinary(filePath, publicId) {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });
    
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(filePath, {
            public_id: publicId,
            folder: 'zecode/products/model-poses-generated',
            resource_type: 'image'
        }, (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
        });
    });
}

async function main() {
    console.log('='.repeat(70));
    console.log('UPLOAD LOCAL MODEL IMAGES TO CLOUDINARY');
    console.log(`Started: ${new Date().toISOString()}`);
    console.log('='.repeat(70));
    
    // Get all local images
    const localFiles = fs.readdirSync(OUTPUT_FOLDER).filter(f => f.endsWith('.png'));
    console.log(`\nFound ${localFiles.length} local images`);
    
    // Group by product (by removing pose suffix)
    const productImages = {};
    for (const file of localFiles) {
        // Extract product name from filename
        const match = file.match(/^(.+)_(front_standing|three_quarter|casual_lifestyle)\.png$/);
        if (match) {
            const productKey = match[1];
            const pose = match[2];
            if (!productImages[productKey]) {
                productImages[productKey] = {};
            }
            productImages[productKey][pose] = path.join(OUTPUT_FOLDER, file);
        }
    }
    
    console.log(`\nGrouped into ${Object.keys(productImages).length} products`);
    
    // Auth with Directus
    console.log('\nAuthenticating with Directus...');
    let token = await getDirectusToken();
    console.log('✓ Authenticated');
    
    // Get all products without model images
    console.log('\nFetching products without model_image_1...');
    const response = await fetch(
        `${DIRECTUS_URL}/items/products?limit=500&fields=id,name,slug,model_image_1`
    );
    const data = await response.json();
    const products = data.data.filter(p => !p.model_image_1);
    console.log(`Found ${products.length} products without model images`);
    
    // Match products to local images
    let uploaded = 0;
    let updated = 0;
    
    for (let idx = 0; idx < products.length; idx++) {
        const product = products[idx];
        const productName = product.name;
        
        // Create matching key
        const safeName = productName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 50);
        
        if (!productImages[safeName]) {
            continue; // No local images for this product
        }
        
        console.log(`\n[${idx + 1}] ${productName}`);
        
        const images = productImages[safeName];
        const cloudinaryUrls = [];
        
        // Upload each pose
        for (const pose of ['front_standing', 'three_quarter', 'casual_lifestyle']) {
            if (images[pose]) {
                console.log(`  Uploading ${pose}...`);
                try {
                    const url = await uploadToCloudinary(images[pose], `${safeName}_${pose}`);
                    cloudinaryUrls.push(url);
                    console.log(`  ✓ Uploaded`);
                    uploaded++;
                } catch (error) {
                    console.log(`  ✗ Upload failed: ${error.message}`);
                    cloudinaryUrls.push(null);
                }
                await sleep(500); // Small delay between uploads
            } else {
                cloudinaryUrls.push(null);
            }
        }
        
        // Update Directus
        const validUrls = cloudinaryUrls.filter(Boolean);
        if (validUrls.length > 0) {
            const updateData = {};
            if (cloudinaryUrls[0]) updateData.model_image_1 = cloudinaryUrls[0];
            if (cloudinaryUrls[1]) updateData.model_image_2 = cloudinaryUrls[1];
            if (cloudinaryUrls[2]) updateData.model_image_3 = cloudinaryUrls[2];
            
            try {
                token = await getDirectusToken(); // Refresh token
                const updateRes = await fetch(`${DIRECTUS_URL}/items/products/${product.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (updateRes.ok) {
                    console.log(`  ✓ Directus updated`);
                    updated++;
                } else {
                    console.log(`  ✗ Directus update failed`);
                }
            } catch (error) {
                console.log(`  ✗ Directus error: ${error.message}`);
            }
        }
        
        await sleep(200);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('COMPLETE');
    console.log('='.repeat(70));
    console.log(`Images uploaded: ${uploaded}`);
    console.log(`Products updated: ${updated}`);
    console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch(console.error);
