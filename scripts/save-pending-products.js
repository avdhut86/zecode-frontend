const fs = require('fs');
const path = require('path');

// Read env file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

// Parse line by line
envContent.split(/\r?\n/).forEach(line => {
  if (line.startsWith('#') || !line.trim()) return;
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.substring(0, idx).trim();
    const val = line.substring(idx + 1);
    env[key] = val;
  }
});

const PROD_URL = 'https://zecode-directus.onrender.com';
const PROD_EMAIL = env.DIRECTUS_ADMIN_EMAIL;
const PROD_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD;
const CLOUDINARY_BASE = 'https://res.cloudinary.com/ds8llatku/image/upload/f_auto,q_auto';

const OUTPUT_FOLDER = path.join(__dirname, 'pending-model-images');

function buildImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  let cleanPath = imagePath;
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
  cleanPath = cleanPath.replace(/\.[^.]+$/, '');
  return CLOUDINARY_BASE + '/zecode/' + cleanPath;
}

async function downloadImage(url, filepath) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

async function savePendingProducts() {
  console.log('='.repeat(60));
  console.log('SAVING PENDING PRODUCTS (missing model images)');
  console.log('='.repeat(60));
  console.log('Output folder:', OUTPUT_FOLDER);
  
  if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  }

  console.log('Email:', PROD_EMAIL);
  console.log('Password found:', PROD_PASSWORD ? 'YES' : 'NO');
  
  const loginRes = await fetch(PROD_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: PROD_EMAIL, password: PROD_PASSWORD })
  }).then(r => r.json());
  
  const token = loginRes.data?.access_token;
  if (!token) {
    console.log('Auth failed:', JSON.stringify(loginRes).substring(0, 200));
    return;
  }
  console.log('✓ Authenticated with Directus\n');

  const products = (await fetch(PROD_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json())).data;

  const pending = products.filter(p => !p.model_image_1 && !p.model_image_2 && !p.model_image_3);
  console.log('Found', pending.length, 'products without model images\n');

  // Save metadata
  const metadata = pending.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    gender: p.gender_category,
    subcategory: p.subcategory,
    image_path: p.image_url,
    image_url: buildImageUrl(p.image_url)
  }));
  
  fs.writeFileSync(
    path.join(OUTPUT_FOLDER, 'pending-products.json'),
    JSON.stringify(metadata, null, 2)
  );
  console.log('✓ Saved metadata to pending-products.json\n');

  // Download images
  let downloaded = 0;
  for (const p of pending) {
    const imageUrl = buildImageUrl(p.image_url);
    if (!imageUrl) {
      console.log('  Skip', p.id, '- no image');
      continue;
    }

    const safeName = (p.name || p.id.toString()).replace(/[^a-zA-Z0-9-]/g, '_').substring(0, 50);
    const filename = p.id + '_' + safeName + '.jpg';
    const filepath = path.join(OUTPUT_FOLDER, filename);

    try {
      console.log('  Downloading:', p.name?.substring(0, 40) || p.id);
      await downloadImage(imageUrl, filepath);
      const stats = fs.statSync(filepath);
      console.log('    ✓ OK (' + Math.round(stats.size/1024) + ' KB)');
      downloaded++;
    } catch (e) {
      console.log('    ✗ Error:', e.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DONE! Downloaded', downloaded, '/', pending.length, 'images');
  console.log('Folder:', OUTPUT_FOLDER);
  console.log('='.repeat(60));
}

savePendingProducts().catch(e => console.error('Error:', e));
