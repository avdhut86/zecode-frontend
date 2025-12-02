/**
 * Generate Model Poses for Products Missing Model Images
 * Uses Gemini 2.0 Flash Exp Image Generation (Nana Banana Pro)
 * 
 * This script:
 * 1. Fetches products without model images from Directus
 * 2. Downloads product images from Cloudinary
 * 3. Generates 3 model poses per product using Gemini
 * 4. Uploads generated images to Cloudinary
 * 5. Updates Directus with new model image paths
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local file
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

// Disable SSL verification for corporate proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configuration from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_API_KEY', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'DIRECTUS_ADMIN_EMAIL', 'DIRECTUS_ADMIN_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('\nCreate a .env.local file in zecode-frontend/ with:');
    console.error('  GOOGLE_API_KEY=your-google-api-key');
    console.error('  CLOUDINARY_CLOUD_NAME=ds8llatku');
    console.error('  CLOUDINARY_API_KEY=your-cloudinary-api-key');
    console.error('  CLOUDINARY_API_SECRET=your-cloudinary-api-secret');
    console.error('  DIRECTUS_ADMIN_EMAIL=your-email');
    console.error('  DIRECTUS_ADMIN_PASSWORD=your-password');
    process.exit(1);
}

// Gemini 3 Pro Image model (Nana Banana Pro)
const IMAGE_GEN_MODEL = 'gemini-3-pro-image-preview';

const OUTPUT_FOLDER = path.join(__dirname, 'generated-model-poses');
if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
}

// Pose variations
const POSE_VARIATIONS = [
    {
        name: 'front_standing',
        description: 'Front-facing standing pose, confident posture, hands relaxed at sides, looking directly at camera, neutral professional expression'
    },
    {
        name: 'three_quarter',
        description: 'Three-quarter angle pose (45 degrees), one hand on hip, slight turn of body, natural confident expression, showing outfit from angled view'
    },
    {
        name: 'casual_lifestyle',
        description: 'Casual lifestyle pose, relaxed natural stance, slight smile, approachable and friendly look, as if walking naturally'
    }
];

// Helper: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Download image
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

// Get Directus token
async function getDirectusToken() {
    try {
        const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD })
        });
        const data = await response.json();
        if (!data.data?.access_token) {
            throw new Error('No token in response: ' + JSON.stringify(data));
        }
        return data.data.access_token;
    } catch (error) {
        console.error('Auth error:', error.message);
        throw error;
    }
}

// Fetch products without model images
async function fetchProductsWithoutModels() {
    try {
        const response = await fetch(
            `${DIRECTUS_URL}/items/products?limit=500&fields=id,name,slug,image,image_url,gender_category,subcategory,model_image_1`
        );
        const data = await response.json();
        if (!data.data) {
            throw new Error('No data in response: ' + JSON.stringify(data));
        }
        return data.data.filter(p => !p.model_image_1);
    } catch (error) {
        console.error('Fetch products error:', error.message);
        throw error;
    }
}

// Analyze product from name (no API call needed)
function analyzeProduct(productName, genderCategory) {
    const nameLower = productName.toLowerCase();
    
    // Determine gender
    let gender = 'female';
    if (genderCategory && genderCategory.toLowerCase().includes('men') && !genderCategory.toLowerCase().includes('women')) {
        gender = 'male';
    } else if (nameLower.includes("men's") && !nameLower.includes("women")) {
        gender = 'male';
    }
    
    // Extract garment type
    const garmentTypes = {
        'dress': 'dress', 'tunic': 'tunic', 'blouse': 'blouse', 'shirt': 'shirt',
        't-shirt': 't-shirt', 'tee': 't-shirt', 'hoodie': 'hoodie', 'sweatshirt': 'sweatshirt',
        'pants': 'pants', 'jeans': 'jeans', 'shorts': 'shorts', 'bottoms': 'pants',
        'jacket': 'jacket', 'outerwear': 'jacket', 'top': 'top', 'tops': 'top',
        'kurta': 'kurta', 'mules': 'mules', 'flats': 'flats', 'heels': 'heels'
    };
    
    let garment = 'clothing';
    for (const [key, val] of Object.entries(garmentTypes)) {
        if (nameLower.includes(key)) {
            garment = val;
            break;
        }
    }
    
    // Extract color
    const colors = ['beige', 'black', 'white', 'cream', 'brown', 'blue', 'red', 'pink',
        'green', 'olive', 'maroon', 'burgundy', 'dark', 'light', 'caramel',
        'hot', 'pale', 'yellow', 'sage', 'washed', 'off white', 'dusty', 'khaki'];
    
    let color = 'neutral';
    for (const c of colors) {
        if (nameLower.includes(c)) {
            color = c;
            break;
        }
    }
    
    // Extract style
    const styles = ['casual', 'streetwear', 'formal', 'athleisure', 'bohemian', 'vintage', 'minimalist'];
    let style = 'casual';
    for (const s of styles) {
        if (nameLower.includes(s)) {
            style = s;
            break;
        }
    }
    
    return { gender, garment, color, style, pattern: nameLower.includes('graphic') ? 'graphic' : 'solid' };
}

// Generate model pose using Gemini
async function generateModelPose(imageBase64, analysis, pose, productName) {
    const { gender, garment, color, style, pattern } = analysis;
    
    const prompt = `Look at this product image showing a ${color} ${garment}.

Generate a HIGH QUALITY fashion e-commerce photo of an attractive ${gender} model wearing this EXACT outfit.

OUTFIT TO RECREATE EXACTLY:
- Garment: ${color} ${garment}
- Style: ${style}
- Pattern: ${pattern}
- Product: ${productName}

MODEL POSE:
${pose.description}

REQUIREMENTS:
1. Professional fashion model, attractive and well-groomed
2. Model wearing the EXACT same ${garment} from the product image
3. Preserve ALL colors, patterns, graphics, and details exactly
4. Clean white/light gray studio background
5. Professional studio lighting
6. Full body shot from head to toe
7. High resolution, sharp, e-commerce quality
8. Natural, confident expression

Generate a professional product photo suitable for a fashion e-commerce website.`;

    const requestBody = {
        contents: [{
            role: 'user',
            parts: [
                {
                    inline_data: {
                        mime_type: 'image/png',
                        data: imageBase64
                    }
                },
                { text: prompt }
            ]
        }],
        generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 0.4
        }
    };

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
            
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_GEN_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                }
            );
            
            clearTimeout(timeout);
            const data = await response.json();
            
            if (data.error) {
                console.log(`      API error: ${data.error.message}`);
                if (data.error.message.includes('RESOURCE_EXHAUSTED') || data.error.message.includes('quota')) {
                    console.log(`      Rate limited, waiting 60s...`);
                    await sleep(60000);
                    continue;
                }
                if (data.error.message.includes('SAFETY') || data.error.message.includes('blocked')) {
                    console.log(`      Content blocked, skipping`);
                    return null;
                }
                await sleep(10000);
                continue;
            }
            
            // Extract generated image
            if (data.candidates && data.candidates[0]?.content?.parts) {
                for (const part of data.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return Buffer.from(part.inlineData.data, 'base64');
                    }
                }
            }
            
            console.log(`      Attempt ${attempt + 1}: No image in response`);
            await sleep(5000);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`      Timeout on attempt ${attempt + 1}, retrying...`);
            } else {
                console.log(`      Error: ${error.message}`);
            }
            await sleep(10000);
        }
    }
    
    return null;
}

// Upload to Cloudinary
async function uploadToCloudinary(imageBuffer, publicId) {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });
    
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { public_id: publicId, folder: 'zecode/products/model-poses-generated' },
            (error, result) => {
                if (error) reject(error);
                else resolve(`/products/model-poses-generated/${publicId}.png`);
            }
        ).end(imageBuffer);
    });
}

// Update Directus product
async function updateDirectusProduct(productId, modelImages, token) {
    const updateData = {};
    if (modelImages[0]) updateData.model_image_1 = modelImages[0];
    if (modelImages[1]) updateData.model_image_2 = modelImages[1];
    if (modelImages[2]) updateData.model_image_3 = modelImages[2];
    
    const response = await fetch(`${DIRECTUS_URL}/items/products/${productId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
    });
    
    return response.ok;
}

// Safe filename
function safeFilename(productName, poseName) {
    const safe = productName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 50);
    return `${safe}_${poseName}`;
}

// Check if file already exists locally
function alreadyGenerated(productName) {
    const filename = safeFilename(productName, 'front_standing');
    const localPath = path.join(OUTPUT_FOLDER, `${filename}.png`);
    return fs.existsSync(localPath);
}

// Main function
async function main() {
    console.log('='.repeat(70));
    console.log('MODEL POSE GENERATION - Nana Banana Pro (Node.js)');
    console.log(`Started: ${new Date().toISOString()}`);
    console.log('='.repeat(70));
    
    // Get token
    console.log('\nAuthenticating with Directus...');
    let token;
    try {
        token = await getDirectusToken();
        console.log('✓ Authenticated');
    } catch (error) {
        console.log(`✗ Authentication failed: ${error.message}`);
        return;
    }
    
    // Fetch products
    console.log('\nFetching products without model images...');
    const products = await fetchProductsWithoutModels();
    console.log(`Found ${products.length} products to process`);
    
    if (products.length === 0) {
        console.log('No products need processing!');
        return;
    }
    
    let totalGenerated = 0;
    const failedProducts = [];
    
    for (let idx = 0; idx < products.length; idx++) {
        const product = products[idx];
        const productId = product.id;
        const productName = product.name;
        const imagePath = product.image || product.image_url;
        
        console.log(`\n[${idx + 1}/${products.length}] ${productName}`);
        
        // Skip if already generated
        if (alreadyGenerated(productName)) {
            console.log('  ⏭ Already generated, skipping');
            continue;
        }
        
        if (!imagePath) {
            console.log('  ⚠ No image path, skipping');
            failedProducts.push([productName, 'No image']);
            continue;
        }
        
        // Download product image
        const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/zecode${imagePath}`;
        console.log(`  Downloading: ${cloudinaryUrl.slice(0, 70)}...`);
        
        let imageBuffer;
        try {
            imageBuffer = await downloadImage(cloudinaryUrl);
            console.log(`  ✓ Downloaded (${imageBuffer.length} bytes)`);
        } catch (error) {
            console.log(`  ✗ Download failed: ${error.message}`);
            failedProducts.push([productName, 'Download failed']);
            continue;
        }
        
        // Analyze
        console.log('  Analyzing outfit...');
        const analysis = analyzeProduct(productName, product.gender_category);
        console.log(`  ✓ ${analysis.gender} ${analysis.garment} - ${analysis.style}`);
        
        const imageBase64 = imageBuffer.toString('base64');
        const modelImages = [];
        
        // Generate poses
        for (let poseIdx = 0; poseIdx < POSE_VARIATIONS.length; poseIdx++) {
            const pose = POSE_VARIATIONS[poseIdx];
            console.log(`  [${poseIdx + 1}/3] Generating ${pose.name}...`);
            
            const generatedBuffer = await generateModelPose(imageBase64, analysis, pose, productName);
            
            if (generatedBuffer) {
                // Save locally
                const filename = safeFilename(productName, pose.name);
                const localPath = path.join(OUTPUT_FOLDER, `${filename}.png`);
                fs.writeFileSync(localPath, generatedBuffer);
                console.log(`      ✓ Saved: ${filename}.png`);
                
                // Upload to Cloudinary
                try {
                    const cloudinaryPath = await uploadToCloudinary(generatedBuffer, filename);
                    modelImages.push(cloudinaryPath);
                    console.log(`      ✓ Uploaded to Cloudinary`);
                    totalGenerated++;
                } catch (error) {
                    console.log(`      ✗ Upload failed: ${error.message}`);
                    modelImages.push(null);
                }
            } else {
                console.log(`      ✗ Generation failed`);
            }
            
            await sleep(3000);
        }
        
        // Update Directus
        const validImages = modelImages.filter(Boolean);
        if (validImages.length > 0) {
            console.log(`  Updating Directus with ${validImages.length} model images...`);
            try {
                token = await getDirectusToken(); // Refresh token
                const success = await updateDirectusProduct(productId, validImages, token);
                if (success) {
                    console.log(`  ✓ Directus updated`);
                } else {
                    console.log(`  ✗ Directus update failed`);
                }
            } catch (error) {
                console.log(`  ✗ Directus update error: ${error.message}`);
            }
        } else {
            failedProducts.push([productName, 'No poses generated']);
        }
        
        await sleep(5000);
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`Total poses generated: ${totalGenerated}`);
    console.log(`Failed products: ${failedProducts.length}`);
    
    if (failedProducts.length > 0) {
        console.log('\nFailed products:');
        failedProducts.slice(0, 20).forEach(([name, reason]) => {
            console.log(`  - ${name}: ${reason}`);
        });
    }
    
    console.log(`\nLocal backups saved to: ${OUTPUT_FOLDER}`);
}

main().catch(console.error);
