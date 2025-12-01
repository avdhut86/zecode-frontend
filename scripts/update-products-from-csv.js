const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'adminpassword';
const CSV_FILE = path.join(__dirname, '../product_catalogue.csv');
const UPDATED_CSV_FILE = path.join(__dirname, '../product_catalogue_updated.csv');

const SUBCATEGORY_MAP = {
  'T': 'T-Shirt',
  'Apparel': 'Apparel',
  'Hoodie': 'Hoodie',
  'Pants': 'Pants',
  'Sweatpants': 'Sweatpants',
  'Tunic': 'Tunic',
  'Blouse': 'Blouse',
  'Dress': 'Dress',
  'Dresses': 'Dress',
  'Mules': 'Mules',
  'Jeans': 'Jeans',
  'Jackets': 'Jacket',
  'Skirts': 'Skirt',
  'Shoes': 'Shoes',
  'Accessories': 'Accessory'
};

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function main() {
  try {
    // 1. Read CSV
    console.log('Reading CSV...');
    const input = fs.readFileSync(CSV_FILE, 'utf8');
    const records = parse(input, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Found ${records.length} records.`);

    // 2. Login to Directus
    console.log('Logging in...');
    const authRes = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = authRes.data.data.access_token;
    console.log('Logged in.');

    // 3. Process Records
    const updatedRecords = [];
    const usedSlugs = new Set();
    
    for (const record of records) {
      const gender = record.gender_category || 'Women'; // Default to Women if missing
      const color = record.color ? capitalize(record.color) : '';
      const style = record.style ? capitalize(record.style) : '';
      const pattern = record.pattern ? capitalize(record.pattern) : '';
      
      let subcategory = record.subcategory || 'Apparel';
      if (SUBCATEGORY_MAP[subcategory]) {
        subcategory = SUBCATEGORY_MAP[subcategory];
      }

      // Construct Name
      // Format: [Gender]'s [Color] [Style] [Pattern] [Subcategory]
      // Example: Women's Beige Casual Graphic Print T-Shirt
      
      let nameParts = [`${gender}'s`];
      if (color) nameParts.push(color);
      if (style) nameParts.push(style);
      if (pattern) nameParts.push(`${pattern} Print`);
      nameParts.push(subcategory);
      
      const baseName = nameParts.join(' ');
      let newName = baseName;
      let baseSlug = generateSlug(baseName);
      let newSlug = baseSlug;
      let counter = 1;

      // Handle duplicates
      while (usedSlugs.has(newSlug)) {
        counter++;
        newSlug = `${baseSlug}-${counter}`;
        // Optionally update name too to be unique?
        // newName = `${baseName} ${counter}`; 
      }
      usedSlugs.add(newSlug);

      // Update record object
      const updatedRecord = {
        ...record,
        name: newName,
        slug: newSlug // Add slug column
      };
      updatedRecords.push(updatedRecord);

      // 4. Update Directus
      // Find product by SKU
      if (record.sku) {
        try {
          const searchRes = await axios.get(`${DIRECTUS_URL}/items/products`, {
            params: {
              'filter[sku][_eq]': record.sku
            },
            headers: { Authorization: `Bearer ${token}` }
          });

          if (searchRes.data.data.length > 0) {
            const productId = searchRes.data.data[0].id;
            console.log(`Updating ${record.sku}: ${newName} (${newSlug})`);
            
            await axios.patch(`${DIRECTUS_URL}/items/products/${productId}`, {
              name: newName,
              slug: newSlug
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } else {
            console.warn(`Product with SKU ${record.sku} not found in Directus.`);
          }
        } catch (err) {
          console.error(`Failed to update ${record.sku}:`, err.response?.data || err.message);
        }
      }
    }

    // 5. Write Updated CSV
    console.log('Writing updated CSV...');
    const output = stringify(updatedRecords, { header: true });
    fs.writeFileSync(UPDATED_CSV_FILE, output);
    console.log(`Updated CSV saved to ${UPDATED_CSV_FILE}`);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
