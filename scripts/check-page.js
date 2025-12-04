const fs = require('fs');
const path = require('path');

async function checkPage() {
  const url = 'https://zecode-frontend.vercel.app/men/men-s-black-casual-graphic-print-t-shirt-2';
  console.log('Fetching:', url);
  
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const html = await res.text();
  
  console.log('Status:', res.status);
  console.log('HTML length:', html.length);
  
  // Check for category link patterns
  const patterns = ['/Apparel', '/men/tshirts', '/men/t', 'T-Shirts', '>T<'];
  patterns.forEach(p => {
    const count = (html.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    if (count > 0) console.log('  Found "' + p + '":', count, 'times');
  });
  
  // Check what href patterns exist for category
  const hrefRegex = /href="(\/[^"]+)"/g;
  const hrefs = [];
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  
  const categoryHrefs = hrefs.filter(h => 
    h.includes('/men/') || h.includes('/Apparel') || h.includes('tshirt')
  );
  
  console.log('\nCategory-related hrefs found:');
  [...new Set(categoryHrefs)].slice(0, 15).forEach(h => console.log('  ', h));
  
  // Save HTML for inspection
  fs.writeFileSync(path.join(__dirname, 'page-debug.html'), html);
  console.log('\nSaved full HTML to page-debug.html');
}

checkPage().catch(e => console.error('Error:', e.message));
