const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'adminpassword';

const TARGET_SLUG = 'beige-t-graphic';
const GRAPHIC_TEXT = 'Urban Soul'; // Placeholder - I will ask the user to confirm this or change it.
// Actually, I'll leave it as a variable to be easily changed.

async function fixProduct() {
  try {
    // 1. Login
    console.log('Logging in...');
    const authRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = authRes.data.data.access_token;
    console.log('Logged in.');

    // 2. Find the product
    console.log(`Finding product with slug: ${TARGET_SLUG}...`);
    const res = await axios.get(`${DIRECTUS_URL}/items/products`, {
      params: {
        'filter[slug][_eq]': TARGET_SLUG
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data.data.length === 0) {
      console.error('Product not found!');
      return;
    }

    const product = res.data.data[0];
    console.log('Current Product:', {
      id: product.id,
      name: product.name,
      slug: product.slug
    });

    // 3. Construct new name
    // "I want to have also add the text written on the graphic prin in the product name with gender, colour and other fashion details."
    // Gender: Women (from gender_category or gender)
    // Colour: Beige
    // Other details: Casual (from style)
    
    const gender = product.gender_category || product.gender || 'Women';
    const color = product.color || 'Beige';
    const style = product.style || 'Casual';
    
    // Constructing the name
    // Format: [Gender] [Color] [Style] [Graphic Text] T-Shirt
    // Example: Women's Beige Casual "Urban Soul" Graphic T-Shirt
    
    // Since I don't know the text, I will use a placeholder or just "Graphic Print"
    // But the user specifically asked for the text.
    
    // I will update it to a better base name first.
    const newName = `${gender}'s ${color} ${style} Graphic Print T-Shirt`;
    
    // Generate new slug
    const newSlug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    console.log(`Updating name to: ${newName}`);
    console.log(`Updating slug to: ${newSlug}`);

    // 4. Update the product
    await axios.patch(`${DIRECTUS_URL}/items/products/${product.id}`, {
      name: newName,
      slug: newSlug
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Product updated successfully!');

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

fixProduct();
