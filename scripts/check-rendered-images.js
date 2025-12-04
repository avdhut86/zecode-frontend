const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  // Check the actual rendered page
  const html = await fetch('https://zecode-frontend.vercel.app/women/women-s-beige-casual-graphic-print-tunic');
  
  // Extract image URLs from the page
  const cloudinaryPattern = /res\.cloudinary\.com[^"'\s)]+/g;
  const cloudinaryUrls = html.match(cloudinaryPattern) || [];
  
  console.log('Cloudinary URLs found on product page:');
  console.log('='.repeat(70));
  
  // Unique URLs
  const unique = [...new Set(cloudinaryUrls)];
  
  console.log('Total Cloudinary URL occurrences:', cloudinaryUrls.length);
  console.log('Unique Cloudinary URLs:', unique.length);
  console.log('\nSample URLs:');
  unique.slice(0, 8).forEach(u => {
    const short = u.length > 90 ? u.substring(0, 90) + '...' : u;
    console.log('  ✅ ' + short);
  });
  
  // Check for any broken/relative image paths that weren't converted
  const relProductPaths = html.match(/["']\/products\/[^"']+["']/g) || [];
  console.log('\n\nRelative /products/ paths (not converted):', relProductPaths.length);
  if (relProductPaths.length > 0) {
    console.log('⚠️ These should have been converted to Cloudinary URLs:');
    relProductPaths.slice(0, 5).forEach(p => console.log('  ❌ ' + p));
  } else {
    console.log('✅ All product paths properly converted to Cloudinary URLs!');
  }
  
  // Check for product image patterns
  const extractedProducts = unique.filter(u => u.includes('extracted-products'));
  const modelPoses = unique.filter(u => u.includes('model-poses'));
  
  console.log('\n\nImage types found:');
  console.log('  Product images (extracted-products):', extractedProducts.length);
  console.log('  Model poses:', modelPoses.length);
}

main().catch(console.error);
