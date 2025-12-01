/**
 * Complete Migration Script: Local Directus → Render Directus
 * Run with: node scripts/migrate-directus-complete.js
 */

// Disable SSL certificate validation for enterprise proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const LOCAL_URL = 'http://127.0.0.1:8055';
const RENDER_URL = 'https://zecode-directus.onrender.com';
const ADMIN_EMAIL = 'zecode@siyaram.com';
const ADMIN_PASSWORD = 'SSML@$2025';

let accessToken = null;

async function login() {
  console.log('🔐 Logging in to Render Directus...');
  const res = await fetch(`${RENDER_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  
  if (!res.ok) {
    throw new Error(`Login failed: ${await res.text()}`);
  }
  
  const data = await res.json();
  accessToken = data.data.access_token;
  console.log('✓ Logged in successfully\n');
}

async function renderApi(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(`${RENDER_URL}${endpoint}`, options);
  
  if (!res.ok) {
    const error = await res.text();
    console.error(`API Error ${method} ${endpoint}:`, error);
    return null;
  }
  
  return res.json();
}

async function localApi(endpoint) {
  try {
    const res = await fetch(`${LOCAL_URL}${endpoint}`);
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

async function createCollection(name, fields) {
  console.log(`  Creating collection: ${name}...`);
  
  const result = await renderApi('POST', '/collections', {
    collection: name,
    meta: { icon: 'box' },
    schema: { name },
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      ...fields,
    ],
  });
  
  if (result) {
    console.log(`    ✓ Created ${name}`);
  }
  return result;
}

async function addField(collection, field) {
  return renderApi('POST', `/fields/${collection}`, field);
}

async function createProductsCollection() {
  // Create base collection
  await createCollection('products', [
    { field: 'status', type: 'string', schema: { default_value: 'published' } },
    { field: 'sort', type: 'integer' },
    { field: 'name', type: 'string' },
    { field: 'slug', type: 'string' },
  ]);
  
  // Add remaining fields
  const additionalFields = [
    { field: 'category', type: 'string' },
    { field: 'subcategory', type: 'string' },
    { field: 'gender_category', type: 'string' },
    { field: 'gender', type: 'string' },
    { field: 'age_group', type: 'string' },
    { field: 'price', type: 'decimal' },
    { field: 'original_price', type: 'decimal' },
    { field: 'image', type: 'string' },
    { field: 'image_url', type: 'string' },
    { field: 'model_image_1', type: 'string' },
    { field: 'model_image_2', type: 'string' },
    { field: 'model_image_3', type: 'string' },
    { field: 'description', type: 'text' },
    { field: 'sizes', type: 'json' },
    { field: 'colors', type: 'json' },
    { field: 'color', type: 'string' },
    { field: 'pattern', type: 'string' },
    { field: 'style', type: 'string' },
    { field: 'sku', type: 'string' },
    { field: 'featured', type: 'boolean', schema: { default_value: false } },
    { field: 'new_arrival', type: 'boolean' },
    { field: 'on_sale', type: 'boolean' },
  ];
  
  for (const field of additionalFields) {
    await addField('products', field);
  }
  console.log('    ✓ Added all product fields');
}

async function createHeroSlidesCollection() {
  await createCollection('hero_slides', [
    { field: 'status', type: 'string', schema: { default_value: 'published' } },
    { field: 'sort', type: 'integer' },
    { field: 'title', type: 'string' },
    { field: 'subtitle', type: 'string' },
    { field: 'image', type: 'string' },
    { field: 'image_url', type: 'string' },
    { field: 'mobile_image', type: 'string' },
    { field: 'cta_text', type: 'string' },
    { field: 'cta_link', type: 'string' },
    { field: 'text_color', type: 'string' },
    { field: 'overlay_opacity', type: 'integer' },
    { field: 'page', type: 'string' },
  ]);
}

async function createNavigationCollection() {
  await createCollection('navigation', [
    { field: 'status', type: 'string', schema: { default_value: 'published' } },
    { field: 'sort', type: 'integer' },
    { field: 'label', type: 'string' },
    { field: 'href', type: 'string' },
    { field: 'type', type: 'string' },
    { field: 'parent', type: 'integer' },
    { field: 'icon', type: 'string' },
    { field: 'highlight', type: 'boolean' },
  ]);
}

async function createFooterCollections() {
  await createCollection('footer_link_groups', [
    { field: 'title', type: 'string' },
    { field: 'sort', type: 'integer' },
  ]);
  
  await createCollection('footer_links', [
    { field: 'status', type: 'string', schema: { default_value: 'published' } },
    { field: 'label', type: 'string' },
    { field: 'href', type: 'string' },
    { field: 'group', type: 'integer' },
    { field: 'sort', type: 'integer' },
  ]);
  
  await createCollection('social_links', [
    { field: 'status', type: 'string', schema: { default_value: 'published' } },
    { field: 'platform', type: 'string' },
    { field: 'url', type: 'string' },
    { field: 'sort', type: 'integer' },
  ]);
}

async function createStoresCollection() {
  await createCollection('stores', [
    { field: 'status', type: 'string', schema: { default_value: 'published' } },
    { field: 'name', type: 'string' },
    { field: 'address', type: 'text' },
    { field: 'city', type: 'string' },
    { field: 'state', type: 'string' },
    { field: 'pincode', type: 'string' },
    { field: 'phone', type: 'string' },
    { field: 'latitude', type: 'decimal' },
    { field: 'longitude', type: 'decimal' },
    { field: 'sort', type: 'integer' },
  ]);
}

async function migrateData(collection) {
  console.log(`  Migrating ${collection}...`);
  
  const local = await localApi(`/items/${collection}?limit=-1`);
  if (!local?.data?.length) {
    console.log(`    ⊘ No data found`);
    return;
  }
  
  const items = local.data;
  console.log(`    Found ${items.length} items`);
  
  // Import in batches
  const batchSize = 100;
  let imported = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Remove id field to let Directus auto-generate
    const cleanBatch = batch.map(item => {
      const { id, ...rest } = item;
      return rest;
    });
    
    const result = await renderApi('POST', `/items/${collection}`, cleanBatch);
    if (result) {
      imported += batch.length;
    }
  }
  
  console.log(`    ✓ Imported ${imported}/${items.length} items`);
}

async function setPublicPermissions() {
  console.log('\n🔓 Setting public read permissions...');
  
  const collections = ['products', 'hero_slides', 'navigation', 'footer_link_groups', 'footer_links', 'social_links', 'stores'];
  
  for (const collection of collections) {
    await renderApi('POST', '/permissions', {
      role: null, // null = public
      collection,
      action: 'read',
      fields: ['*'],
    });
  }
  
  console.log('✓ Public permissions set\n');
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Directus Migration: Local → Render');
  console.log('='.repeat(60));
  console.log(`Local:  ${LOCAL_URL}`);
  console.log(`Render: ${RENDER_URL}`);
  console.log('='.repeat(60) + '\n');
  
  // Step 1: Login
  await login();
  
  // Step 2: Create collections
  console.log('📦 Creating collections...');
  await createProductsCollection();
  await createHeroSlidesCollection();
  await createNavigationCollection();
  await createFooterCollections();
  await createStoresCollection();
  console.log('');
  
  // Step 3: Migrate data
  console.log('📤 Migrating data...');
  await migrateData('products');
  await migrateData('hero_slides');
  await migrateData('navigation');
  await migrateData('footer_link_groups');
  await migrateData('footer_links');
  await migrateData('social_links');
  await migrateData('stores');
  
  // Step 4: Set permissions
  await setPublicPermissions();
  
  console.log('='.repeat(60));
  console.log('✅ MIGRATION COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n📋 Next steps:');
  console.log('1. Go to Vercel Dashboard → zecode-frontend → Settings → Environment Variables');
  console.log('2. Add/Update: NEXT_PUBLIC_DIRECTUS_URL = https://zecode-directus.onrender.com');
  console.log('3. Redeploy the project');
  console.log('\n🔗 Test URL: https://zecode-directus.onrender.com/items/products?limit=3');
}

main().catch(console.error);
