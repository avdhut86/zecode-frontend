/**
 * Fix Model Images Script
 * Clears DSC-matched model images for products where model shows different outfit
 * Then generates new AI model images showing only the specific product
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const DIRECTUS_EMAIL = 'zecode@siyaram.com';
const DIRECTUS_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD;

async function clearDSCMatchedModelImages() {
  console.log('='.repeat(60));
  console.log('FIX MODEL IMAGES - Clear DSC-matched images');
  console.log('='.repeat(60));
  
  // Authenticate
  console.log('\nAuthenticating with Directus...');
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD })
  });
  const authData = await authRes.json();
  const token = authData.data.access_token;
  console.log('✓ Authenticated');

  // Get all products with DSC-matched model images
  console.log('\nFetching products with DSC-matched model images...');
  const res = await fetch(DIRECTUS_URL + '/items/products?fields=id,name,model_image_1&limit=500', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  
  const toFix = data.data.filter(p => {
    if (!p.model_image_1) return false;
    return p.model_image_1.includes('/model-poses/') && 
           !p.model_image_1.includes('/model-poses-generated/');
  });

  console.log(`Found ${toFix.length} products with DSC-matched model images\n`);

  // Clear model images for all affected products
  let cleared = 0;
  for (const product of toFix) {
    const updateRes = await fetch(`${DIRECTUS_URL}/items/products/${product.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_image_1: null,
        model_image_2: null,
        model_image_3: null
      })
    });

    if (updateRes.ok) {
      cleared++;
      console.log(`✓ Cleared: ${product.name}`);
    } else {
      console.log(`✗ Failed: ${product.name}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`DONE: Cleared model images for ${cleared}/${toFix.length} products`);
  console.log('='.repeat(60));
}

clearDSCMatchedModelImages().catch(e => console.error('Error:', e));
