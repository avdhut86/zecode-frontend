const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

https.get('https://zecode-frontend.vercel.app/women/women-s-beige-casual-graphic-print-tunic', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('Has women/tunics:', d.includes('women/tunics'));
    console.log('Has Tunics:', d.includes('Tunics'));
    console.log('Has category key:', d.includes('"category"'));
    
    // Find the actual category value
    const matches = d.match(/"category":"[^"]+"/g);
    if (matches) {
      console.log('Category values found:', matches.slice(0, 10));
    }
    
    const labelMatches = d.match(/"categoryLabel":"[^"]+"/g);
    if (labelMatches) {
      console.log('Label values found:', labelMatches.slice(0, 10));
    }
    
    // Check for Tunic in the page
    console.log('Has Tunic:', d.includes('Tunic'));
  });
});
