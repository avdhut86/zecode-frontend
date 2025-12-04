const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Load env
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const DIRECTUS_URL = 'https://zecode-directus.onrender.com';

// Calculate color histogram for an image buffer
async function calculateHistogram(imageBuffer) {
  try {
    // Resize to small size for faster processing
    const { data, info } = await sharp(imageBuffer)
      .resize(64, 64, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Create histogram bins (16 bins per channel = 4096 total combinations)
    const bins = 16;
    const histogram = new Array(bins * bins * bins).fill(0);
    
    for (let i = 0; i < data.length; i += info.channels) {
      const r = Math.floor(data[i] / (256 / bins));
      const g = Math.floor(data[i + 1] / (256 / bins));
      const b = Math.floor(data[i + 2] / (256 / bins));
      const index = r * bins * bins + g * bins + b;
      histogram[index]++;
    }
    
    // Normalize
    const total = histogram.reduce((a, b) => a + b, 0);
    return histogram.map(v => v / total);
  } catch (err) {
    return null;
  }
}

// Calculate histogram intersection similarity (0-1, higher is more similar)
function histogramSimilarity(hist1, hist2) {
  if (!hist1 || !hist2) return 0;
  let similarity = 0;
  for (let i = 0; i < hist1.length; i++) {
    similarity += Math.min(hist1[i], hist2[i]);
  }
  return similarity;
}

// Extract dominant colors from image
async function extractDominantColors(imageBuffer) {
  try {
    const { dominant } = await sharp(imageBuffer)
      .resize(100, 100, { fit: 'cover' })
      .stats();
    return dominant;
  } catch (err) {
    return null;
  }
}

// Compare dominant colors
function colorSimilarity(color1, color2) {
  if (!color1 || !color2) return 0;
  const dr = Math.abs(color1.r - color2.r);
  const dg = Math.abs(color1.g - color2.g);
  const db = Math.abs(color1.b - color2.b);
  const maxDiff = 255 * 3;
  return 1 - (dr + dg + db) / maxDiff;
}

async function fetchImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    return null;
  }
}

async function getDirectusToken() {
  const res = await fetch(DIRECTUS_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zecode@siyaram.com', password: env.DIRECTUS_ADMIN_PASSWORD })
  });
  return (await res.json()).data.access_token;
}

async function main() {
  console.log('Starting OpenCV-style image matching...\n');
  
  const token = await getDirectusToken();
  
  // Get all products
  const res = await fetch(DIRECTUS_URL + '/items/products?limit=-1', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const products = (await res.json()).data;
  
  // Products without model images (excluding accessories)
  const withoutModel = products.filter(p => {
    if (p.model_image_1) return false;
    const name = (p.name || '').toLowerCase();
    // Skip accessories
    if (name.includes('backpack') || name.includes('visor') || 
        name.includes('flats') || name.includes('mules') ||
        name.includes('shoes') || name.includes('cap')) return false;
    return true;
  });
  
  // Products WITH model images (potential sources)
  const withModel = products.filter(p => p.model_image_1);
  
  console.log(`Products without model images: ${withoutModel.length}`);
  console.log(`Products with model images (potential matches): ${withModel.length}\n`);
  
  // Pre-calculate histograms for products with model images
  console.log('Pre-calculating histograms for source products...');
  const sourceData = [];
  
  for (const product of withModel) {
    const imageUrl = product.image_1 || product.image_2;
    if (!imageUrl) continue;
    
    const imageBuffer = await fetchImage(imageUrl);
    if (!imageBuffer) continue;
    
    const histogram = await calculateHistogram(imageBuffer);
    const colors = await extractDominantColors(imageBuffer);
    
    if (histogram) {
      sourceData.push({
        id: product.id,
        name: product.name,
        histogram,
        colors,
        model_image_1: product.model_image_1,
        model_image_2: product.model_image_2,
        model_image_3: product.model_image_3
      });
    }
    
    process.stdout.write(`\r  Processed ${sourceData.length}/${withModel.length}`);
  }
  console.log('\n');
  
  // Match products without model images
  console.log('Finding matches for products without model images...\n');
  const matches = [];
  
  for (const product of withoutModel) {
    const imageUrl = product.image_1 || product.image_2;
    if (!imageUrl) {
      console.log(`  ${product.id}: ${product.name} - No product image`);
      continue;
    }
    
    const imageBuffer = await fetchImage(imageUrl);
    if (!imageBuffer) {
      console.log(`  ${product.id}: ${product.name} - Failed to fetch image`);
      continue;
    }
    
    const histogram = await calculateHistogram(imageBuffer);
    const colors = await extractDominantColors(imageBuffer);
    
    if (!histogram) continue;
    
    // Find best match
    let bestMatch = null;
    let bestScore = 0;
    
    for (const source of sourceData) {
      // Skip if names are completely different categories
      const productCategory = getCategory(product.name);
      const sourceCategory = getCategory(source.name);
      if (productCategory !== sourceCategory) continue;
      
      // Calculate combined similarity score
      const histScore = histogramSimilarity(histogram, source.histogram);
      const colorScore = colorSimilarity(colors, source.colors);
      const nameScore = nameSimilarity(product.name, source.name);
      
      // Weighted score (histogram matters most for visual matching)
      const score = histScore * 0.5 + colorScore * 0.3 + nameScore * 0.2;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = source;
      }
    }
    
    if (bestMatch && bestScore > 0.6) {
      console.log(`  ${product.id}: ${product.name}`);
      console.log(`    -> Match: ${bestMatch.name} (score: ${(bestScore * 100).toFixed(1)}%)`);
      matches.push({
        productId: product.id,
        productName: product.name,
        matchId: bestMatch.id,
        matchName: bestMatch.name,
        score: bestScore,
        model_image_1: bestMatch.model_image_1,
        model_image_2: bestMatch.model_image_2,
        model_image_3: bestMatch.model_image_3
      });
    } else {
      console.log(`  ${product.id}: ${product.name} - No good match (best: ${(bestScore * 100).toFixed(1)}%)`);
    }
  }
  
  console.log(`\n\nFound ${matches.length} matches above 60% threshold.`);
  
  // Save matches
  fs.writeFileSync('opencv-matches.json', JSON.stringify(matches, null, 2));
  console.log('Saved to opencv-matches.json');
  
  // Ask to apply matches
  if (matches.length > 0) {
    console.log('\nApplying matches to Directus...');
    let applied = 0;
    
    for (const match of matches) {
      try {
        await fetch(DIRECTUS_URL + '/items/products/' + match.productId, {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model_image_1: match.model_image_1,
            model_image_2: match.model_image_2 || null,
            model_image_3: match.model_image_3 || null
          })
        });
        applied++;
        console.log(`  Applied to product ${match.productId}`);
      } catch (err) {
        console.log(`  Error applying to ${match.productId}: ${err.message}`);
      }
    }
    
    console.log(`\nApplied ${applied} matches!`);
  }
}

function getCategory(name) {
  if (!name) return 'unknown';
  const lower = name.toLowerCase();
  if (lower.includes("men's") && !lower.includes("women's")) return 'men';
  if (lower.includes("women's")) return 'women';
  if (lower.includes("kid")) return 'kids';
  return 'other';
}

function nameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;
  
  const words1 = name1.toLowerCase().replace(/['']/g, '').split(/\s+/);
  const words2 = name2.toLowerCase().replace(/['']/g, '').split(/\s+/);
  
  let matches = 0;
  for (const w1 of words1) {
    if (words2.includes(w1)) matches++;
  }
  
  return matches / Math.max(words1.length, words2.length);
}

main().catch(console.error);
