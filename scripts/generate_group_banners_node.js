/**
 * Generate Group Banner Images for Home Slider and Categories
 * Uses Gemini to create group compositions from individual model poses
 * NO TEXT on images - text is handled separately in frontend
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local
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

// Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ds8llatku';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;

const IMAGE_GEN_MODEL = 'gemini-2.0-flash-exp-image-generation';

const OUTPUT_FOLDER = path.join(__dirname, 'generated-banners');
if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
}

// Validate env vars
if (!GOOGLE_API_KEY || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

let directusToken = null;

// Banner configurations
const BANNER_CONFIGS = [
    {
        name: 'hero_main',
        type: 'hero',
        description: 'Main hero slider - mixed group of stylish young adults',
        categories: ['men', 'women'],
        width: 1920,
        height: 800,
        prompt: `Create a high-fashion editorial photograph of a diverse group of 4-5 stylish young Indian college students (mix of men and women in their early 20s) standing together in a modern urban setting. They should be wearing trendy casual streetwear - t-shirts, hoodies, jeans, and sneakers. The lighting should be warm and golden hour style. Professional fashion photography, high quality, sharp focus, lifestyle aesthetic. NO TEXT OR WORDS in the image.`
    },
    {
        name: 'hero_lifestyle',
        type: 'hero',
        description: 'Lifestyle hero - casual hangout scene',
        categories: ['men', 'women'],
        width: 1920,
        height: 800,
        prompt: `Create a lifestyle photograph of a group of 4 trendy young Indian friends (2 men, 2 women) in casual fashionable outfits, appearing to be having fun together outdoors on a college campus or urban cafe setting. They should look relaxed and happy. Modern fashion, vibrant colors, professional photography. NO TEXT OR WORDS in the image.`
    },
    {
        name: 'category_men',
        type: 'category',
        description: 'Men category banner',
        categories: ['men'],
        width: 800,
        height: 600,
        prompt: `Create a fashion photograph of 3 stylish young Indian men in their 20s, wearing trendy casual menswear - graphic t-shirts, jeans, jackets, and sneakers. They should have confident poses in an urban street style setting. Modern masculine fashion, professional photography, warm lighting. NO TEXT OR WORDS in the image.`
    },
    {
        name: 'category_women',
        type: 'category',
        description: 'Women category banner',
        categories: ['women'],
        width: 800,
        height: 600,
        prompt: `Create a fashion photograph of 3 stylish young Indian women in their 20s, wearing trendy casual womenswear - dresses, tops, pants, and fashionable accessories. They should have elegant confident poses in a modern lifestyle setting. Contemporary feminine fashion, professional photography, soft beautiful lighting. NO TEXT OR WORDS in the image.`
    },
    {
        name: 'category_kids',
        type: 'category',
        description: 'Kids category banner',
        categories: ['kids'],
        width: 800,
        height: 600,
        prompt: `Create a cheerful photograph of 3 cute Indian children (ages 6-12, mix of boys and girls) wearing colorful fun casual kids clothing - printed t-shirts, playful dresses, comfortable pants. They should be smiling and looking happy in a bright, playful setting like a playground or park. Joyful kids fashion, vibrant colors, natural lighting. NO TEXT OR WORDS in the image.`
    },
    {
        name: 'category_footwear',
        type: 'category',
        description: 'Footwear category banner',
        categories: ['footwear'],
        width: 800,
        height: 600,
        prompt: `Create a stylish product-focused photograph showing multiple fashionable shoes and footwear - sneakers, casual shoes, flats, and sandals arranged artistically. The shoes should look premium and trendy. Clean modern aesthetic, professional product photography, soft studio lighting on a neutral background. NO TEXT OR WORDS in the image.`
    }
];

async function loginToDirectus() {
    console.log('Authenticating with Directus...');
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD })
    });
    const data = await response.json();
    if (data.data?.access_token) {
        directusToken = data.data.access_token;
        console.log('✓ Authenticated');
        return true;
    }
    console.error('✗ Authentication failed:', data);
    return false;
}

async function generateBannerImage(config) {
    console.log(`\nGenerating: ${config.name}`);
    console.log(`  Type: ${config.type}, Size: ${config.width}x${config.height}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_GEN_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: config.prompt
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                }),
                signal: controller.signal
            }
        );
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`  API error: ${errorText.substring(0, 100)}`);
            return null;
        }
        
        const result = await response.json();
        
        // Extract image from response
        if (result.candidates?.[0]?.content?.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    const filename = `${config.name}.png`;
                    const filepath = path.join(OUTPUT_FOLDER, filename);
                    fs.writeFileSync(filepath, imageBuffer);
                    console.log(`  ✓ Saved: ${filename}`);
                    return filepath;
                }
            }
        }
        
        console.log('  ✗ No image in response');
        return null;
    } catch (error) {
        clearTimeout(timeout);
        console.log(`  ✗ Error: ${error.message}`);
        return null;
    }
}

async function uploadToCloudinary(filepath, folder) {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });
    
    const filename = path.basename(filepath, '.png');
    
    try {
        const result = await cloudinary.uploader.upload(filepath, {
            folder: folder,
            public_id: filename,
            overwrite: true
        });
        console.log(`  ✓ Uploaded to Cloudinary: ${result.public_id}`);
        return result.secure_url;
    } catch (error) {
        console.log(`  ✗ Upload failed: ${error.message}`);
        return null;
    }
}

async function updateDirectusHeroSlide(slideId, imageUrl) {
    if (!directusToken) return false;
    
    try {
        const response = await fetch(`${DIRECTUS_URL}/items/hero_slides/${slideId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            },
            body: JSON.stringify({ image: imageUrl })
        });
        
        if (response.ok) {
            console.log(`  ✓ Updated hero slide ${slideId}`);
            return true;
        }
        return false;
    } catch (error) {
        console.log(`  ✗ Failed to update hero slide: ${error.message}`);
        return false;
    }
}

async function updateDirectusCategory(categorySlug, imageUrl) {
    if (!directusToken) return false;
    
    try {
        // First find the category by slug
        const findRes = await fetch(`${DIRECTUS_URL}/items/categories?filter[slug][_eq]=${categorySlug}`, {
            headers: { 'Authorization': `Bearer ${directusToken}` }
        });
        const findData = await findRes.json();
        
        if (findData.data?.[0]?.id) {
            const categoryId = findData.data[0].id;
            const updateRes = await fetch(`${DIRECTUS_URL}/items/categories/${categoryId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${directusToken}`
                },
                body: JSON.stringify({ image: imageUrl })
            });
            
            if (updateRes.ok) {
                console.log(`  ✓ Updated category "${categorySlug}"`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.log(`  ✗ Failed to update category: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('='.repeat(70));
    console.log('GROUP BANNER GENERATION');
    console.log('Started:', new Date().toISOString());
    console.log('='.repeat(70));
    
    await loginToDirectus();
    
    const results = {
        success: [],
        failed: []
    };
    
    for (const config of BANNER_CONFIGS) {
        // Generate banner
        const filepath = await generateBannerImage(config);
        
        if (filepath) {
            // Upload to Cloudinary
            const folder = config.type === 'hero' ? 'zecode/banners/hero' : 'zecode/banners/categories';
            const cloudinaryUrl = await uploadToCloudinary(filepath, folder);
            
            if (cloudinaryUrl) {
                // Update Directus
                if (config.type === 'hero') {
                    // For hero slides, we'd need to know the slide ID
                    // Just log for now
                    console.log(`  Hero image ready: ${cloudinaryUrl}`);
                } else if (config.type === 'category') {
                    // Update category image
                    const categorySlug = config.name.replace('category_', '');
                    await updateDirectusCategory(categorySlug, cloudinaryUrl);
                }
                
                results.success.push(config.name);
            } else {
                results.failed.push(config.name);
            }
        } else {
            results.failed.push(config.name);
        }
        
        // Rate limiting pause
        await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`Success: ${results.success.length}`);
    console.log(`Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
        console.log('\nFailed banners:', results.failed.join(', '));
    }
    
    console.log(`\nBanners saved to: ${OUTPUT_FOLDER}`);
}

main().catch(console.error);
