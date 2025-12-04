const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Test a known working product 
const url = 'https://zecode-frontend.vercel.app/men/men-s-black-casual-jacket';
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    // Find category in the response
    const categoryMatch = data.match(/"category":"([^"]+)"/g);
    const labelMatch = data.match(/"categoryLabel":"([^"]+)"/g);
    console.log('Categories found:', categoryMatch?.slice(0, 5) || 'none');
    console.log('Labels found:', labelMatch?.slice(0, 5) || 'none');
  });
});
