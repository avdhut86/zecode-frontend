const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

async function summary() {
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
  
  const withModel = products.filter(p => p.model_image_1);
  const withoutModel = products.filter(p => !p.model_image_1);
  
  console.log('=== FINAL MODEL IMAGE STATUS ===');
  console.log('');
  console.log('Total Products: ' + products.length);
  console.log('With Model Images: ' + withModel.length + ' (' + (withModel.length/products.length*100).toFixed(1) + '%)');
  console.log('Without Model Images: ' + withoutModel.length);
  
  if (withoutModel.length > 0) {
    console.log('');
    console.log('Products still without model images:');
    withoutModel.forEach(p => {
      console.log('  ID ' + p.id + ': ' + p.name);
    });
  }
}

summary();
