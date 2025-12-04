const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function analyze() {
  const authRes = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  const token = (await authRes.json()).data.access_token;
  
  const res = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await res.json()).data;
  
  // Check all products without model images
  const withoutModel = products.filter(p => !p.model_image_1);
  
  let hasProductImage = 0;
  let noProductImage = 0;
  
  console.log('Products WITHOUT model images analysis:\n');
  
  withoutModel.forEach(p => {
    const hasImg = p.image_1 || p.image_2 || p.image_3;
    if (hasImg) {
      hasProductImage++;
      console.log('HAS PRODUCT IMAGE - ID ' + p.id + ': ' + p.name);
    } else {
      noProductImage++;
    }
  });
  
  console.log('\n=== SUMMARY ===');
  console.log('Total without model images: ' + withoutModel.length);
  console.log('  - Have product images: ' + hasProductImage);
  console.log('  - NO product images: ' + noProductImage);
}

analyze();
