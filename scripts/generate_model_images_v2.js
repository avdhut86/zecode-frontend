/**
 * Generate Model Images for Products Missing Them
 * Uses Gemini 3 Pro Image Generation
 * 
 * Run: node generate_model_images_v2.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Config
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ds8llatku';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'zecode@siyaram.com';
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

const IMAGE_GEN_MODEL = 'gemini-3-pro-image-preview';

const OUTPUT_FOLDER = path.join(__dirname, 'generated-model-poses');
if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
}

// Helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : require('http');
        protocol.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return downloadImage(response.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

async function getDirectusToken() {
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD })
    });
    const data = await response.json();
    if (!data.data?.access_token) {
        throw new Error('Auth failed: ' + JSON.stringify(data));
    }
    return data.data.access_token;
}

// Pose configurations
const POSES = [
    {
        name: 'front_standing',
        description: 'Front-facing standing pose, confident posture, hands relaxed at sides, looking directly at camera'
    },
    {
        name: 'three_quarter',
        description: 'Three-quarter angle pose (45 degrees), one hand on hip, showing outfit from angled view'
    },
    {
        name: 'casual_lifestyle',
        description: 'Casual lifestyle pose, relaxed natural stance, slight smile, approachable look'
    }
];

// Analyze product from name
function analyzeProduct(productName, genderCategory) {
    const nameLower = productName.toLowerCase();
    
    // Gender
    let gender = 'female';
    if (genderCategory) {
        const gc = genderCategory.toLowerCase();
        if (gc.includes('men') && !gc.includes('women')) gender = 'male';
        if (gc.includes('kids') || gc.includes('boy')) gender = 'boy';
        if (gc.includes('girl')) gender = 'girl';
    }
    if (nameLower.includes("men's") && !nameLower.includes("women")) gender = 'male';
    
    // Garment type
    const garmentMap = {
        'dress': 'dress', 'tunic': 'tunic', 'blouse': 'blouse', 'shirt': 'shirt',
        't-shirt': 't-shirt', 'tee': 't-shirt', 'hoodie': 'hoodie', 'sweatshirt': 'sweatshirt',
        'pants': 'pants', 'jeans': 'jeans', 'shorts': 'shorts', 'trousers': 'trousers',
        'jacket': 'jacket', 'top': 'top', 'sweater': 'sweater', 'kurta': 'kurta',
        'mules': 'mules', 'flats': 'flats', 'heels': 'heels', 'sneakers': 'sneakers'
    };
    
    let garment = 'clothing';
    for (const [key, val] of Object.entries(garmentMap)) {
        if (nameLower.includes(key)) {
            garment = val;
            break;
        }
    }
    
    // Color
    const colors = ['beige', 'black', 'white', 'cream', 'brown', 'blue', 'navy', 'red', 'pink',
        'green', 'olive', 'maroon', 'burgundy', 'caramel', 'yellow', 'sage', 'khaki', 'gray', 'grey'];
    let color = 'neutral';
    for (const c of colors) {
        if (nameLower.includes(c)) {
            color = c;
            break;
        }
    }
    
    // Style
    const styles = ['casual', 'formal', 'streetwear', 'athleisure', 'bohemian', 'vintage', 'minimalist'];
    let style = 'casual';
    for (const s of styles) {
        if (nameLower.includes(s)) {
            style = s;
            break;
        }
    }
    
    return { gender, garment, color, style };
}

// Generate model pose using Gemini
async function generateModelPose(imageBase64, analysis, pose, productName) {
    const { gender, garment, color, style } = analysis;
    
    const prompt = `Look at this product image showing a ${color} ${garment}.

Generate a HIGH QUALITY fashion e-commerce photo of an attractive ${gender} model wearing this EXACT outfit.

MODEL POSE: ${pose.description}

REQUIREMENTS:
1. Professional fashion model, attractive and well-groomed
2. Model wearing the EXACT same ${garment} from the product image
3. Preserve ALL colors, patterns, graphics, and details exactly
4. Clean white or light gray studio background
5. Professional studio lighting
6. Full body shot from head to toe
7. High resolution, sharp, e-commerce quality
8. Natural, confident expression

Product: ${productName}

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

    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_GEN_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }
            );
            
            const data = await response.json();
            
            if (data.error) {
                const errMsg = data.error.message || 'Unknown error';
                console.log(`      API error: ${errMsg.slice(0, 60)}`);
                
                if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
                    console.log(`      Rate limited, waiting 90s...`);
                    await sleep(90000);
                    continue;
                }
                if (errMsg.includes('Internal') || errMsg.includes('overloaded')) {
                    console.log(`      Server busy, waiting 45s...`);
                    await sleep(45000);
                    continue;
                }
                if (errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
                    console.log(`      Content blocked, skipping`);
                    return null;
                }
                
                await sleep(15000);
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
            await sleep(8000);
            
        } catch (error) {
            console.log(`      Error: ${error.message}`);
            await sleep(15000);
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
            { 
                public_id: publicId, 
                folder: 'zecode/products/model-poses-generated',
                resource_type: 'image'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
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

// Check if already generated
function alreadyGenerated(productName) {
    const filename = safeFilename(productName, 'front_standing');
    return fs.existsSync(path.join(OUTPUT_FOLDER, `${filename}.png`));
}

// Main
async function main() {
    console.log('='.repeat(70));
    console.log('MODEL IMAGE GENERATION v2');
    console.log(`Started: ${new Date().toISOString()}`);
    console.log('='.repeat(70));
    
    // Validate config
    if (!GOOGLE_API_KEY) {
        console.error('❌ GOOGLE_API_KEY not found in environment');
        return;
    }
    if (!DIRECTUS_PASSWORD) {
        console.error('❌ DIRECTUS_ADMIN_PASSWORD not found in environment');
        return;
    }
    
    console.log(`\nDirectus: ${DIRECTUS_URL}`);
    console.log(`Cloudinary: ${CLOUDINARY_CLOUD_NAME}`);
    console.log(`Output: ${OUTPUT_FOLDER}\n`);
    
    // Auth
    console.log('Authenticating with Directus...');
    let token;
    try {
        token = await getDirectusToken();
        console.log('✓ Authenticated\n');
    } catch (error) {
        console.error(`✗ Authentication failed: ${error.message}`);
        return;
    }
    
    // Fetch products without model images
    console.log('Fetching products without model images...');
    const response = await fetch(
        `${DIRECTUS_URL}/items/products?limit=500&fields=id,name,slug,image,image_url,gender_category,subcategory,model_image_1`
    );
    const data = await response.json();
    
    if (!data.data) {
        console.error('Failed to fetch products:', data);
        return;
    }
    
    const products = data.data.filter(p => !p.model_image_1);
    console.log(`Found ${products.length} products to process\n`);
    
    if (products.length === 0) {
        console.log('All products have model images!');
        return;
    }
    
    let totalGenerated = 0;
    const failedProducts = [];
    
    for (let idx = 0; idx < products.length; idx++) {
        const product = products[idx];
        const { id: productId, name: productName, image, image_url, gender_category } = product;
        const imagePath = image || image_url;
        
        console.log(`\n[${idx + 1}/${products.length}] ${productName}`);
        
        // Skip if already generated locally
        if (alreadyGenerated(productName)) {
            console.log('  ⏭ Already generated locally, skipping');
            continue;
        }
        
        if (!imagePath) {
            console.log('  ⚠ No image path, skipping');
            failedProducts.push([productName, 'No image']);
            continue;
        }
        
        // Download product image
        const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/zecode${imagePath}`;
        console.log(`  Downloading image...`);
        
        let imageBuffer;
        try {
            imageBuffer = await downloadImage(cloudinaryUrl);
            console.log(`  ✓ Downloaded (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
        } catch (error) {
            console.log(`  ✗ Download failed: ${error.message}`);
            failedProducts.push([productName, 'Download failed']);
            continue;
        }
        
        // Analyze product
        const analysis = analyzeProduct(productName, gender_category);
        console.log(`  ✓ Analyzed: ${analysis.gender} ${analysis.color} ${analysis.garment} - ${analysis.style}`);
        
        const imageBase64 = imageBuffer.toString('base64');
        const modelImages = [];
        
        // Generate each pose
        for (let poseIdx = 0; poseIdx < POSES.length; poseIdx++) {
            const pose = POSES[poseIdx];
            console.log(`  [${poseIdx + 1}/3] Generating ${pose.name}...`);
            
            const generatedBuffer = await generateModelPose(imageBase64, analysis, pose, productName);
            
            if (generatedBuffer) {
                // Save locally
                const filename = safeFilename(productName, pose.name);
                const localPath = path.join(OUTPUT_FOLDER, `${filename}.png`);
                fs.writeFileSync(localPath, generatedBuffer);
                console.log(`      ✓ Saved locally`);
                
                // Upload to Cloudinary
                try {
                    const cloudinaryUrl = await uploadToCloudinary(generatedBuffer, filename);
                    modelImages.push(cloudinaryUrl);
                    console.log(`      ✓ Uploaded to Cloudinary`);
                    totalGenerated++;
                } catch (error) {
                    console.log(`      ✗ Upload failed: ${error.message}`);
                    modelImages.push(null);
                }
            } else {
                console.log(`      ✗ Generation failed`);
                modelImages.push(null);
            }
            
            // Wait between poses
            await sleep(5000);
        }
        
        // Update Directus
        const validImages = modelImages.filter(Boolean);
        if (validImages.length > 0) {
            console.log(`  Updating Directus with ${validImages.length} model images...`);
            try {
                token = await getDirectusToken(); // Refresh token
                const success = await updateDirectusProduct(productId, modelImages, token);
                if (success) {
                    console.log(`  ✓ Directus updated`);
                } else {
                    console.log(`  ✗ Directus update failed`);
                }
            } catch (error) {
                console.log(`  ✗ Directus error: ${error.message}`);
            }
        } else {
            failedProducts.push([productName, 'No poses generated']);
        }
        
        // Wait between products
        await sleep(10000);
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`Total poses generated: ${totalGenerated}`);
    console.log(`Products with issues: ${failedProducts.length}`);
    
    if (failedProducts.length > 0) {
        console.log('\nFailed products:');
        failedProducts.slice(0, 20).forEach(([name, reason]) => {
            console.log(`  - ${name}: ${reason}`);
        });
        if (failedProducts.length > 20) {
            console.log(`  ... and ${failedProducts.length - 20} more`);
        }
    }
    
    console.log(`\nLocal backups: ${OUTPUT_FOLDER}`);
    console.log(`Finished: ${new Date().toISOString()}`);
}

main().catch(console.error);
