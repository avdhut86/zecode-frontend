const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';
const MODEL_POSES_DIR = path.join(__dirname, 'generated-model-poses');

async function analyze() {
  const token = await getToken();
  const products = await getProducts(token);
  
  // Get local model pose files
  const localFiles = fs.readdirSync(MODEL_POSES_DIR);
  
  // Group local files by product name
  const localByProduct = {};
  localFiles.forEach(file => {
    // Extract product name from filename (before _front_standing, _three_quarter, etc.)
    const match = file.match(/^(.+?)_(front_standing|three_quarter|casual_lifestyle)\.png$/);
    if (match) {
      const productKey = match[1];
      if (!localByProduct[productKey]) localByProduct[productKey] = [];
      localByProduct[productKey].push(file);
    }
  });
  
  console.log('Local model pose groups: ' + Object.keys(localByProduct).length);
  
  // Products without model images (and no product images)
  const withoutModel = products.filter(p => !p.model_image_1);
  
  console.log('Products without model images: ' + withoutModel.length);
  console.log('');
  
  // Try to match by name
  const matches = [];
  const unmatched = [];
  
  for (const product of withoutModel) {
    // Skip accessories
    const name = (product.name || '').toLowerCase();
    if (name.includes('backpack') || name.includes('visor') || name.includes('flats') || 
        name.includes('mules') || name.includes('cap')) {
      continue;
    }
    
    // Convert product name to local file key format
    const fileKey = (product.name || '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
    
    // Try exact match
    if (localByProduct[fileKey]) {
      matches.push({
        product,
        fileKey,
        files: localByProduct[fileKey]
      });
    } else {
      // Try fuzzy match
      const keys = Object.keys(localByProduct);
      let bestMatch = null;
      let bestScore = 0;
      
      for (const key of keys) {
        const score = similarity(fileKey.toLowerCase(), key.toLowerCase());
        if (score > bestScore && score > 0.8) {
          bestScore = score;
          bestMatch = key;
        }
      }
      
      if (bestMatch) {
        matches.push({
          product,
          fileKey: bestMatch,
          files: localByProduct[bestMatch],
          fuzzy: true,
          score: bestScore
        });
      } else {
        unmatched.push(product);
      }
    }
  }
  
  console.log('MATCHED (can upload model images):');
  matches.forEach(m => {
    const type = m.fuzzy ? ' (fuzzy ' + (m.score * 100).toFixed(0) + '%)' : ' (exact)';
    console.log('  ID ' + m.product.id + ': ' + m.product.name + type);
    console.log('    -> ' + m.fileKey);
  });
  
  console.log('');
  console.log('UNMATCHED (no local model images):');
  unmatched.forEach(p => {
    console.log('  ID ' + p.id + ': ' + p.name);
  });
  
  console.log('');
  console.log('Summary: ' + matches.length + ' matched, ' + unmatched.length + ' unmatched');
  
  // Save matches for upload
  fs.writeFileSync('name-matches.json', JSON.stringify(matches.map(m => ({
    productId: m.product.id,
    productName: m.product.name,
    fileKey: m.fileKey,
    files: m.files
  })), null, 2));
}

async function getToken() {
  const res = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  return (await res.json()).data.access_token;
}

async function getProducts(token) {
  const res = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return (await res.json()).data;
}

function similarity(s1, s2) {
  const words1 = s1.split('_');
  const words2 = s2.split('_');
  let matches = 0;
  for (const w of words1) {
    if (words2.some(w2 => w2.includes(w) || w.includes(w2))) matches++;
  }
  return matches / Math.max(words1.length, words2.length);
}

analyze();
