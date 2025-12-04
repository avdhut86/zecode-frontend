const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  // Test multiple product pages
  const pages = [
    '/women/women-s-beige-casual-graphic-print-tunic',
    '/men/men-s-black-casual-jacket',
    '/kids/kids-s-black-casual-graphic-print-dress',
    '/footwear/women-s-black-casual-mules'
  ];
  
  console.log('🖼️  Image Check Across Product Pages');
  console.log('='.repeat(60));
  
  let allGood = true;
  
  for (const page of pages) {
    const url = 'https://zecode-frontend.vercel.app' + page;
    console.log('\n📍 ' + page);
    
    try {
      const res = await fetch(url);
      console.log('   Status:', res.status);
      
      // Count cloudinary URLs
      const cloudinaryUrls = (res.data.match(/res\.cloudinary\.com/g) || []).length;
      // Check for broken relative paths  
      const relativePathPattern = /["']\/products\/[^"']+["']/g;
      const relativePaths = (res.data.match(relativePathPattern) || []).length;
      
      console.log('   Cloudinary URLs:', cloudinaryUrls);
      console.log('   Relative paths:', relativePaths, relativePaths === 0 ? '✅' : '❌');
      
      if (relativePaths > 0) allGood = false;
    } catch (e) {
      console.log('   Error:', e.message);
      allGood = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (allGood) {
    console.log('✅ All product pages have properly converted image URLs!');
  } else {
    console.log('⚠️ Some issues found - check above');
  }
}

main().catch(console.error);
