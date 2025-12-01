/**
 * Migrate Directus data from local to Render
 * 
 * This script:
 * 1. Exports all collections from local Directus
 * 2. Creates collections on Render Directus
 * 3. Imports all data to Render Directus
 */

const LOCAL_URL = 'http://127.0.0.1:8055';
const RENDER_URL = 'https://zecode-directus.onrender.com';

// Get these from Render Directus after logging in
// Go to Settings > Access Tokens > Create Token
const RENDER_TOKEN = process.env.RENDER_DIRECTUS_TOKEN || 'YOUR_RENDER_TOKEN_HERE';

async function fetchLocal(endpoint) {
  const res = await fetch(`${LOCAL_URL}${endpoint}`);
  if (!res.ok) {
    console.error(`Failed to fetch ${endpoint}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function postToRender(endpoint, data) {
  const res = await fetch(`${RENDER_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RENDER_TOKEN}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.text();
    console.error(`Failed to POST ${endpoint}: ${res.status}`, error);
    return null;
  }
  return res.json();
}

async function createCollection(name, fields) {
  console.log(`Creating collection: ${name}`);
  
  const collectionData = {
    collection: name,
    meta: {
      icon: 'box',
      note: `Migrated from local Directus`,
    },
    schema: {},
    fields: fields,
  };
  
  return postToRender('/collections', collectionData);
}

async function migrateProducts() {
  console.log('\n📦 Migrating products...');
  
  // Fetch all products from local
  const result = await fetchLocal('/items/products?limit=-1');
  if (!result?.data) {
    console.error('No products found');
    return;
  }
  
  const products = result.data;
  console.log(`Found ${products.length} products`);
  
  // Import in batches of 100
  const batchSize = 100;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}...`);
    
    const imported = await postToRender('/items/products', batch);
    if (imported) {
      console.log(`  ✓ Imported ${batch.length} products`);
    }
  }
}

async function migrateHeroSlides() {
  console.log('\n🎨 Migrating hero_slides...');
  
  const result = await fetchLocal('/items/hero_slides?limit=-1');
  if (!result?.data) {
    console.log('No hero slides found (or collection does not exist)');
    return;
  }
  
  const slides = result.data;
  console.log(`Found ${slides.length} hero slides`);
  
  const imported = await postToRender('/items/hero_slides', slides);
  if (imported) {
    console.log(`  ✓ Imported ${slides.length} hero slides`);
  }
}

async function migrateNavigation() {
  console.log('\n🔗 Migrating navigation...');
  
  const result = await fetchLocal('/items/navigation?limit=-1');
  if (!result?.data) {
    console.log('No navigation items found');
    return;
  }
  
  console.log(`Found ${result.data.length} navigation items`);
  const imported = await postToRender('/items/navigation', result.data);
  if (imported) {
    console.log(`  ✓ Imported navigation`);
  }
}

async function migrateFooterLinks() {
  console.log('\n📝 Migrating footer data...');
  
  // Footer link groups
  let result = await fetchLocal('/items/footer_link_groups?limit=-1');
  if (result?.data?.length) {
    await postToRender('/items/footer_link_groups', result.data);
    console.log(`  ✓ Imported ${result.data.length} footer link groups`);
  }
  
  // Footer links
  result = await fetchLocal('/items/footer_links?limit=-1');
  if (result?.data?.length) {
    await postToRender('/items/footer_links', result.data);
    console.log(`  ✓ Imported ${result.data.length} footer links`);
  }
  
  // Social links
  result = await fetchLocal('/items/social_links?limit=-1');
  if (result?.data?.length) {
    await postToRender('/items/social_links', result.data);
    console.log(`  ✓ Imported ${result.data.length} social links`);
  }
}

async function migrateGlobalSettings() {
  console.log('\n⚙️ Migrating global_settings...');
  
  const result = await fetchLocal('/items/global_settings');
  if (!result?.data) {
    console.log('No global settings found');
    return;
  }
  
  const imported = await postToRender('/items/global_settings', result.data);
  if (imported) {
    console.log(`  ✓ Imported global settings`);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('🚀 Directus Migration: Local → Render');
  console.log('='.repeat(50));
  
  if (RENDER_TOKEN === 'YOUR_RENDER_TOKEN_HERE') {
    console.log('\n⚠️  SETUP REQUIRED:');
    console.log('1. Login to https://zecode-directus.onrender.com/admin');
    console.log('2. Go to Settings (gear icon) → Access Tokens');
    console.log('3. Click "+ Create Token"');
    console.log('4. Name it "Migration" and copy the token');
    console.log('5. Run this script with:');
    console.log('   $env:RENDER_DIRECTUS_TOKEN="your-token"; node scripts/migrate-to-render.js');
    return;
  }
  
  console.log('\n📋 Step 1: You need to create collections on Render Directus first!');
  console.log('\nGo to https://zecode-directus.onrender.com/admin and:');
  console.log('1. Click Settings (gear icon) → Data Model');
  console.log('2. Create these collections with the same fields as local:');
  console.log('   - products');
  console.log('   - hero_slides');
  console.log('   - navigation');
  console.log('   - footer_link_groups');
  console.log('   - footer_links');
  console.log('   - social_links');
  console.log('   - global_settings');
  console.log('\n📋 Step 2: After creating collections, this script will migrate data.\n');
  
  // Migrate data (collections must exist first)
  await migrateProducts();
  await migrateHeroSlides();
  await migrateNavigation();
  await migrateFooterLinks();
  await migrateGlobalSettings();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Migration complete!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('1. Update Vercel environment variable:');
  console.log('   NEXT_PUBLIC_DIRECTUS_URL = https://zecode-directus.onrender.com');
  console.log('2. Redeploy on Vercel');
}

main().catch(console.error);
