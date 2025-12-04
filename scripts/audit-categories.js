const https = require('https');

// Disable SSL verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'https://zecode-frontend.vercel.app';
const API_URL = 'https://zecode-directus.onrender.com';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + url;
    
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ url, html: data, status: res.statusCode }));
    }).on('error', reject);
  });
}

function analyzeHtml(html) {
  const issues = [];
  const successes = [];
  
  // Look for problematic patterns - raw CMS values used as links
  const badPatterns = [
    { pattern: 'href="/Apparel"', desc: 'Link to /Apparel' },
    { pattern: 'href="/Bottoms"', desc: 'Link to /Bottoms' },
    { pattern: 'href="/Tops"', desc: 'Link to /Tops' },
    { pattern: 'href="/Dress"', desc: 'Link to /Dress' },
    { pattern: 'href="/Blouse"', desc: 'Link to /Blouse' },
    { pattern: 'href="/Jeans"', desc: 'Link to /Jeans' },
    { pattern: 'href="/Pants"', desc: 'Link to /Pants' },
    { pattern: 'href="/Tunic"', desc: 'Link to /Tunic' },
    { pattern: 'href="/Hoodie"', desc: 'Link to /Hoodie' },
    { pattern: 'href="/Jacket"', desc: 'Link to /Jacket' },
    { pattern: 'href="/Mules"', desc: 'Link to /Mules' },
    { pattern: 'href="/Flats"', desc: 'Link to /Flats' },
    { pattern: 'href="/Heels"', desc: 'Link to /Heels' },
    { pattern: 'href="/T"', desc: 'Link to /T (truncated)' },
    { pattern: '"categoryLabel":"T"', desc: 'Truncated label "T"' },
    { pattern: '"category":"Apparel"', desc: 'Raw CMS category "Apparel"' },
    { pattern: '"category":"Bottoms"', desc: 'Raw CMS category "Bottoms"' },
    { pattern: '"category":"Tops"', desc: 'Raw CMS category "Tops"' },
    { pattern: '"category":"Dress"', desc: 'Raw CMS category "Dress"' },
    { pattern: '"category":"Blouse"', desc: 'Raw CMS category "Blouse"' },
  ];
  
  for (const { pattern, desc } of badPatterns) {
    if (html.includes(pattern)) {
      issues.push(desc);
    }
  }
  
  // Check for good patterns
  const goodPatterns = [
    { pattern: '"category":"men/', desc: 'Correct men/ path' },
    { pattern: '"category":"women/', desc: 'Correct women/ path' },
    { pattern: '"category":"kids/', desc: 'Correct kids/ path' },
    { pattern: '"category":"footwear/', desc: 'Correct footwear/ path' },
  ];
  
  for (const { pattern, desc } of goodPatterns) {
    if (html.includes(pattern)) {
      successes.push(desc);
    }
  }
  
  return { issues, successes };
}

async function runAudit() {
  console.log('🔍 Comprehensive Category Linking Audit');
  console.log('='.repeat(60));
  
  // First, get sample products from each category
  console.log('\n📦 Fetching products from API...\n');
  
  const apiData = await fetchJSON(`${API_URL}/items/products?limit=500&fields=id,name,slug,gender_category,subcategory`);
  const products = apiData.data;
  
  // Group by gender_category
  const byGender = {
    Men: products.filter(p => p.gender_category === 'Men').slice(0, 3),
    Women: products.filter(p => p.gender_category === 'Women').slice(0, 3),
    Kids: products.filter(p => p.gender_category === 'Kids').slice(0, 3),
  };
  
  // Also find footwear products
  const footwearSubs = ['Flats', 'Mules', 'Heels', 'Sandals', 'Boots', 'Sneakers'];
  const footwear = products.filter(p => footwearSubs.some(s => p.subcategory?.toLowerCase() === s.toLowerCase())).slice(0, 3);
  
  let totalIssues = 0;
  let totalPassed = 0;
  
  // Test Men's products
  console.log('\n👔 Men\'s Products');
  console.log('-'.repeat(40));
  for (const product of byGender.Men) {
    const url = `/men/${product.slug}`;
    console.log(`  Testing: ${url}`);
    console.log(`    CMS: gender=${product.gender_category}, subcategory=${product.subcategory}`);
    
    try {
      const result = await fetchPage(url);
      if (result.status !== 200) {
        console.log(`    ❌ Status: ${result.status}`);
        totalIssues++;
        continue;
      }
      
      const { issues, successes } = analyzeHtml(result.html);
      
      if (successes.length > 0) {
        console.log(`    ✅ ${successes.join(', ')}`);
        totalPassed++;
      }
      
      if (issues.length > 0) {
        console.log(`    ❌ Issues: ${issues.join(', ')}`);
        totalIssues += issues.length;
      }
    } catch (e) {
      console.log(`    ❌ Error: ${e.message}`);
      totalIssues++;
    }
  }
  
  // Test Women's products
  console.log('\n👗 Women\'s Products');
  console.log('-'.repeat(40));
  for (const product of byGender.Women) {
    const url = `/women/${product.slug}`;
    console.log(`  Testing: ${url}`);
    console.log(`    CMS: gender=${product.gender_category}, subcategory=${product.subcategory}`);
    
    try {
      const result = await fetchPage(url);
      if (result.status !== 200) {
        console.log(`    ❌ Status: ${result.status}`);
        totalIssues++;
        continue;
      }
      
      const { issues, successes } = analyzeHtml(result.html);
      
      if (successes.length > 0) {
        console.log(`    ✅ ${successes.join(', ')}`);
        totalPassed++;
      }
      
      if (issues.length > 0) {
        console.log(`    ❌ Issues: ${issues.join(', ')}`);
        totalIssues += issues.length;
      }
    } catch (e) {
      console.log(`    ❌ Error: ${e.message}`);
      totalIssues++;
    }
  }
  
  // Test Kids products
  console.log('\n🧒 Kids Products');
  console.log('-'.repeat(40));
  for (const product of byGender.Kids) {
    const url = `/kids/${product.slug}`;
    console.log(`  Testing: ${url}`);
    console.log(`    CMS: gender=${product.gender_category}, subcategory=${product.subcategory}`);
    
    try {
      const result = await fetchPage(url);
      if (result.status !== 200) {
        console.log(`    ❌ Status: ${result.status}`);
        totalIssues++;
        continue;
      }
      
      const { issues, successes } = analyzeHtml(result.html);
      
      if (successes.length > 0) {
        console.log(`    ✅ ${successes.join(', ')}`);
        totalPassed++;
      }
      
      if (issues.length > 0) {
        console.log(`    ❌ Issues: ${issues.join(', ')}`);
        totalIssues += issues.length;
      }
    } catch (e) {
      console.log(`    ❌ Error: ${e.message}`);
      totalIssues++;
    }
  }
  
  // Test Footwear products
  console.log('\n👟 Footwear Products');
  console.log('-'.repeat(40));
  for (const product of footwear) {
    const url = `/footwear/${product.slug}`;
    console.log(`  Testing: ${url}`);
    console.log(`    CMS: gender=${product.gender_category}, subcategory=${product.subcategory}`);
    
    try {
      const result = await fetchPage(url);
      if (result.status !== 200) {
        console.log(`    ❌ Status: ${result.status}`);
        totalIssues++;
        continue;
      }
      
      const { issues, successes } = analyzeHtml(result.html);
      
      if (successes.length > 0) {
        console.log(`    ✅ ${successes.join(', ')}`);
        totalPassed++;
      }
      
      if (issues.length > 0) {
        console.log(`    ❌ Issues: ${issues.join(', ')}`);
        totalIssues += issues.length;
      }
    } catch (e) {
      console.log(`    ❌ Error: ${e.message}`);
      totalIssues++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 SUMMARY: ${totalPassed} checks passed, ${totalIssues} issues found`);
  
  // List all unique subcategories in the CMS
  console.log('\n\n📋 All Unique CMS Subcategories Found:');
  console.log('-'.repeat(40));
  const allSubs = [...new Set(products.map(p => `${p.gender_category}/${p.subcategory}`).filter(Boolean))].sort();
  for (const sub of allSubs) {
    console.log(`  ${sub}`);
  }
}

runAudit().catch(console.error);
