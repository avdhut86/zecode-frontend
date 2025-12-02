/**
 * Sync Local Directus to Production
 * Exports schema from local and applies to production
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const LOCAL_URL = 'http://localhost:8055';
const PROD_URL = 'https://zecode-directus.onrender.com';

const LOCAL_EMAIL = 'admin@example.com';
const LOCAL_PASSWORD = 'adminpassword';
const PROD_EMAIL = 'zecode@siyaram.com';
const PROD_PASSWORD = env.DIRECTUS_ADMIN_PASSWORD;

async function syncDirectus() {
  console.log('='.repeat(60));
  console.log('SYNC LOCAL DIRECTUS TO PRODUCTION');
  console.log('='.repeat(60));

  // Authenticate both
  console.log('\n1. Authenticating...');
  
  const localAuth = await fetch(LOCAL_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOCAL_EMAIL, password: LOCAL_PASSWORD })
  });
  const localAuthData = await localAuth.json();
  if (!localAuthData.data?.access_token) {
    throw new Error('Local auth failed: ' + JSON.stringify(localAuthData));
  }
  const localToken = localAuthData.data.access_token;
  console.log('   Local: ✓');

  const prodAuth = await fetch(PROD_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: PROD_EMAIL, password: PROD_PASSWORD })
  });
  const prodAuthData = await prodAuth.json();
  if (!prodAuthData.data?.access_token) {
    throw new Error('Production auth failed: ' + JSON.stringify(prodAuthData));
  }
  const prodToken = prodAuthData.data.access_token;
  console.log('   Production: ✓');

  // Export local schema
  console.log('\n2. Exporting local schema...');
  const schemaRes = await fetch(LOCAL_URL + '/schema/snapshot', {
    headers: { 'Authorization': 'Bearer ' + localToken }
  });
  const schema = await schemaRes.json();
  
  if (!schema.data) {
    throw new Error('Failed to export schema: ' + JSON.stringify(schema));
  }
  
  const collectionCount = Object.keys(schema.data.collections || {}).length;
  console.log('   Exported ' + collectionCount + ' collections');

  // Save schema for reference
  fs.writeFileSync(
    path.join(__dirname, 'directus-schema-export.json'),
    JSON.stringify(schema.data, null, 2)
  );
  console.log('   Saved to directus-schema-export.json');

  // Get schema diff
  console.log('\n3. Comparing with production...');
  const diffRes = await fetch(PROD_URL + '/schema/diff', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + prodToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(schema.data)
  });
  const diff = await diffRes.json();

  if (diff.errors) {
    console.log('   Diff errors:', JSON.stringify(diff.errors, null, 2));
    return;
  }

  if (!diff.data || Object.keys(diff.data).length === 0) {
    console.log('   No schema differences found - already in sync!');
    return;
  }

  // Show what will change
  console.log('   Differences found:');
  if (diff.data.collections) {
    diff.data.collections.forEach(c => {
      console.log('     Collection: ' + c.collection + ' (' + (c.diff?.kind || 'new') + ')');
    });
  }
  if (diff.data.fields) {
    const fieldChanges = diff.data.fields.length;
    console.log('     Fields: ' + fieldChanges + ' changes');
  }

  // Apply schema
  console.log('\n4. Applying schema to production...');
  const applyRes = await fetch(PROD_URL + '/schema/apply', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + prodToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(diff.data)
  });
  const applyResult = await applyRes.json();

  if (applyResult.errors) {
    console.log('   Apply errors:', JSON.stringify(applyResult.errors, null, 2));
    return;
  }

  console.log('   ✓ Schema applied successfully!');

  // Verify
  console.log('\n5. Verifying production collections...');
  const prodColRes = await fetch(PROD_URL + '/collections', {
    headers: { 'Authorization': 'Bearer ' + prodToken }
  });
  const prodColData = await prodColRes.json();
  const prodCols = prodColData.data.filter(c => !c.collection.startsWith('directus_')).map(c => c.collection).sort();
  console.log('   Production collections: ' + prodCols.join(', '));

  console.log('\n' + '='.repeat(60));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(60));
}

syncDirectus().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
