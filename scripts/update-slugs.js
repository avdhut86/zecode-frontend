const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'adminpassword';

async function updateSlugs() {
  try {
    // 1. Login
    console.log('Logging in...');
    const authRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = authRes.data.data.access_token;
    console.log('Logged in.');

    // 2. Fetch all products
    console.log('Fetching products...');
    const res = await axios.get(`${DIRECTUS_URL}/items/products?limit=-1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = res.data.data;
    console.log(`Found ${products.length} products.`);

    // Track used slugs to handle duplicates
    const usedSlugs = new Set();

    // 3. Update each product
    for (const product of products) {
      let baseSlug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Trim hyphens
      
      let newSlug = baseSlug;
      let counter = 1;
      
      // Ensure uniqueness
      while (usedSlugs.has(newSlug)) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(newSlug);

      if (product.slug !== newSlug) {
        console.log(`Updating ${product.name}: ${product.slug} -> ${newSlug}`);
        try {
          await axios.patch(`${DIRECTUS_URL}/items/products/${product.id}`, {
            slug: newSlug
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error(`Failed to update ${product.name}:`, err.message);
        }
      }
    }
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

updateSlugs();
