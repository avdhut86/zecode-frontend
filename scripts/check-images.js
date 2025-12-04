const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_URL = 'https://zecode-directus.onrender.com';
const SITE_URL = 'https://zecode-frontend.vercel.app';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function checkImageUrl(url, name) {
  try {
    const res = await fetch(url);
    const isImage = res.headers['content-type']?.includes('image');
    const size = res.headers['content-length'];
    
    if (res.status === 200 && isImage) {
      return { name, url, status: '✅ OK', size: size ? `${Math.round(size/1024)}KB` : 'unknown' };
    } else {
      return { name, url, status: `❌ ${res.status}`, reason: isImage ? 'bad status' : 'not an image' };
    }
  } catch (e) {
    return { name, url, status: '❌ Error', reason: e.message };
  }
}

async function main() {
  console.log('🖼️  Image Loading Check');
  console.log('='.repeat(60));
  console.log('Time:', new Date().toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata'}));
  
  // Get sample products from API
  const apiRes = await fetch(`${API_URL}/items/products?limit=20&fields=id,name,slug,image,image_url,model_image_1,model_image_2,model_image_3,gender_category,subcategory`);
  const products = JSON.parse(apiRes.data).data;
  
  console.log(`\n📦 Checking ${products.length} products from API...\n`);
  
  let totalImages = 0;
  let workingImages = 0;
  let brokenImages = [];
  
  for (const product of products.slice(0, 10)) {
    console.log(`\n📍 ${product.name || product.slug}`);
    console.log(`   ID: ${product.id} | ${product.gender_category}/${product.subcategory}`);
    
    // Check main image
    const mainImage = product.image_url || product.image;
    if (mainImage) {
      totalImages++;
      const result = await checkImageUrl(mainImage, 'Main image');
      console.log(`   Main: ${result.status} ${result.size || ''}`);
      if (result.status.includes('✅')) workingImages++;
      else brokenImages.push({ product: product.name, type: 'main', url: mainImage });
    } else {
      console.log(`   Main: ⚠️ No image URL`);
    }
    
    // Check model images
    const modelImages = [product.model_image_1, product.model_image_2, product.model_image_3].filter(Boolean);
    for (let i = 0; i < modelImages.length; i++) {
      totalImages++;
      const result = await checkImageUrl(modelImages[i], `Model ${i+1}`);
      console.log(`   Model ${i+1}: ${result.status} ${result.size || ''}`);
      if (result.status.includes('✅')) workingImages++;
      else brokenImages.push({ product: product.name, type: `model_${i+1}`, url: modelImages[i] });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log(`   Total images checked: ${totalImages}`);
  console.log(`   Working: ${workingImages} ✅`);
  console.log(`   Broken: ${brokenImages.length} ❌`);
  
  if (brokenImages.length > 0) {
    console.log('\n❌ Broken images:');
    brokenImages.forEach(b => {
      console.log(`   - ${b.product} (${b.type})`);
      console.log(`     ${b.url.substring(0, 80)}...`);
    });
  }
  
  // Also check a live product page
  console.log('\n\n🌐 Checking Live Product Page...');
  const testSlug = products[0]?.slug;
  const gender = products[0]?.gender_category?.toLowerCase() || 'women';
  
  if (testSlug) {
    const pageUrl = `${SITE_URL}/${gender}/${testSlug}`;
    console.log(`   URL: ${pageUrl}`);
    
    const pageRes = await fetch(pageUrl);
    console.log(`   Status: ${pageRes.status}`);
    
    // Check for image URLs in the page
    const cloudinaryCount = (pageRes.data.match(/res\.cloudinary\.com/g) || []).length;
    const imgTagCount = (pageRes.data.match(/<img/g) || []).length;
    
    console.log(`   Cloudinary URLs found: ${cloudinaryCount}`);
    console.log(`   <img> tags found: ${imgTagCount}`);
  }
}

main().catch(console.error);
