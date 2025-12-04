const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const MODEL_POSES_DIR = path.join(__dirname, 'generated-model-poses');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'ds8llatku',
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(filePath, publicId) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'zecode/model-poses',
    public_id: publicId,
    overwrite: true
  });
  return result.secure_url;
}

async function getToken() {
  const res = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  return (await res.json()).data.access_token;
}

async function updateProduct(token, productId, modelImages) {
  const body = {};
  if (modelImages[0]) body.model_image_1 = modelImages[0];
  if (modelImages[1]) body.model_image_2 = modelImages[1];
  if (modelImages[2]) body.model_image_3 = modelImages[2];
  
  await fetch(`${DIRECTUS_URL}/items/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

async function main() {
  const matches = JSON.parse(fs.readFileSync('name-matches.json', 'utf8'));
  const token = await getToken();
  
  console.log(`Processing ${matches.length} products...\n`);
  
  // Track which file keys we've already uploaded
  const uploadedKeys = {};
  
  let processed = 0;
  let errors = 0;
  
  for (const match of matches) {
    console.log(`${match.productId}: ${match.productName}`);
    
    try {
      let modelUrls;
      
      // Check if we already uploaded this file key
      if (uploadedKeys[match.fileKey]) {
        modelUrls = uploadedKeys[match.fileKey];
        console.log(`  Using cached URLs`);
      } else {
        // Upload to Cloudinary
        modelUrls = [];
        const poses = ['front_standing', 'three_quarter', 'casual_lifestyle'];
        
        for (let i = 0; i < poses.length; i++) {
          const fileName = `${match.fileKey}_${poses[i]}.png`;
          const filePath = path.join(MODEL_POSES_DIR, fileName);
          
          if (fs.existsSync(filePath)) {
            console.log(`  Uploading ${poses[i]}...`);
            const publicId = `${match.fileKey}_${poses[i]}`;
            const url = await uploadToCloudinary(filePath, publicId);
            modelUrls.push(url);
            console.log(`    -> Done`);
          }
        }
        
        uploadedKeys[match.fileKey] = modelUrls;
      }
      
      // Update Directus
      if (modelUrls.length > 0) {
        console.log(`  Updating Directus...`);
        await updateProduct(token, match.productId, modelUrls);
        console.log(`  Complete!\n`);
        processed++;
      }
      
    } catch (err) {
      console.log(`  Error: ${err.message}\n`);
      errors++;
    }
  }
  
  console.log(`\n=== COMPLETE ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
