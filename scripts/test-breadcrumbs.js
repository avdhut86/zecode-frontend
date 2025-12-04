const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'https://zecode-frontend.vercel.app';

// Test specific products that use new mappings
const tests = [
  { url: '/women/women-s-beige-casual-graphic-print-tunic', expected: { categoryPath: 'women/tunics', label: 'Tunics' } },
  { url: '/women/women-s-beige-casual-graphic-print-hoodie', expected: { categoryPath: 'women/hoodies', label: 'Hoodies' } },
  { url: '/kids/kids-s-dusty-athleisure-tracksuit', expected: { categoryPath: 'kids/tracksuits', label: 'Tracksuits' } },
  { url: '/men/men-s-black-casual-jacket', expected: { categoryPath: 'men/jackets', label: 'Jackets' } },
  { url: '/men/men-s-black-casual-graphic-print-t-shirt-2', expected: { categoryPath: 'men/tshirts', label: 'T-Shirts' } },
];

function fetchAndCheck(url, expected) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + url;
    
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n📍 ${url}`);
        console.log(`   Status: ${res.statusCode}`);
        
        // Check for expected category path in href
        const hasCatPath = data.includes(expected.categoryPath) || data.includes(`/${expected.categoryPath}`);
        const hasLabel = data.includes(expected.label);
        
        // Check for bad patterns
        const hasApparel = data.includes('href="/Apparel"') || data.includes('"/Apparel"');
        const hasBottoms = data.includes('href="/Bottoms"');
        const hasTruncated = data.includes('"T"<') || data.includes('>T<');
        
        console.log(`   Expected path: "${expected.categoryPath}" - ${hasCatPath ? '✅ Found' : '❌ Missing'}`);
        console.log(`   Expected label: "${expected.label}" - ${hasLabel ? '✅ Found' : '❌ Missing'}`);
        
        if (hasApparel) console.log(`   ❌ BAD: Contains /Apparel link`);
        if (hasBottoms) console.log(`   ❌ BAD: Contains /Bottoms link`);
        if (hasTruncated) console.log(`   ❌ BAD: Contains truncated category`);
        
        const isPass = hasCatPath && hasLabel && !hasApparel && !hasBottoms;
        console.log(`   Result: ${isPass ? '✅ PASS' : '❌ FAIL'}`);
        
        resolve({ url, isPass });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🔍 Testing Category Breadcrumb Links');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await fetchAndCheck(test.url, test.expected);
    if (result.isPass) passed++;
    else failed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
}

runTests().catch(console.error);
