/**
 * Migrate pages and site_settings from Local to Render Directus
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const LOCAL_URL = 'http://127.0.0.1:8055';
const RENDER_URL = 'https://zecode-directus.onrender.com';

// Get credentials from environment or use defaults for this one-time migration
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'zecode@siyaram.com';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'SSML@$2025';

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
  console.log('✅ Logged in successfully');
}

async function renderRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${RENDER_URL}${endpoint}`, options);
  return res;
}

async function createPagesCollection() {
  console.log('\n📄 Creating pages collection...');
  
  const res = await renderRequest('POST', '/collections', {
    collection: 'pages',
    meta: {
      icon: 'article',
      note: 'CMS Pages',
      singleton: false,
    },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'status', type: 'string', meta: { width: 'half', options: { choices: [{text:'Published',value:'published'},{text:'Draft',value:'draft'}] }, interface: 'select-dropdown' }, schema: { default_value: 'draft' } },
      { field: 'slug', type: 'string', schema: { is_unique: true } },
      { field: 'title', type: 'string' },
      { field: 'subtitle', type: 'string' },
      { field: 'hero_image', type: 'uuid', meta: { interface: 'file-image' } },
      { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html' } },
      { field: 'meta_title', type: 'string' },
      { field: 'meta_description', type: 'text' },
      { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'] } },
      { field: 'date_updated', type: 'timestamp', meta: { special: ['date-updated'] } }
    ]
  });
  
  if (!res.ok) {
    const err = await res.text();
    if (err.includes('already exists')) {
      console.log('  Collection pages already exists');
      return;
    }
    throw new Error(`Failed to create pages: ${err}`);
  }
  console.log('✅ Created pages collection');
}

async function createSiteSettingsCollection() {
  console.log('\n⚙️ Creating site_settings collection...');
  
  const res = await renderRequest('POST', '/collections', {
    collection: 'site_settings',
    meta: {
      icon: 'settings',
      note: 'Global site settings',
      singleton: true,
    },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'site_name', type: 'string' },
      { field: 'site_tagline', type: 'string' },
      { field: 'logo', type: 'uuid', meta: { interface: 'file-image' } },
      { field: 'logo_white', type: 'uuid', meta: { interface: 'file-image' } },
      { field: 'favicon', type: 'uuid', meta: { interface: 'file-image' } },
      { field: 'default_meta_title', type: 'string' },
      { field: 'default_meta_description', type: 'text' },
      { field: 'google_analytics_id', type: 'string' },
      { field: 'facebook_pixel_id', type: 'string' },
      { field: 'contact_email', type: 'string' },
      { field: 'contact_phone', type: 'string' },
      { field: 'whatsapp_number', type: 'string' }
    ]
  });
  
  if (!res.ok) {
    const err = await res.text();
    if (err.includes('already exists')) {
      console.log('  Collection site_settings already exists');
      return;
    }
    throw new Error(`Failed to create site_settings: ${err}`);
  }
  console.log('✅ Created site_settings collection');
}

async function setPublicPermissions(collection) {
  console.log(`  Setting public read permissions for ${collection}...`);
  
  const res = await renderRequest('POST', '/permissions', {
    role: null, // null = public
    collection: collection,
    action: 'read',
    fields: ['*'],
  });
  
  if (!res.ok) {
    const err = await res.text();
    if (!err.includes('already exists')) {
      console.log(`  Warning: Could not set permissions for ${collection}: ${err}`);
    }
  }
}

async function migrateData() {
  console.log('\n📦 Migrating data from Local to Render...');
  
  // Get pages from local
  const localPagesRes = await fetch(`${LOCAL_URL}/items/pages`);
  const localPages = await localPagesRes.json();
  
  if (localPages.data && localPages.data.length > 0) {
    console.log(`  Found ${localPages.data.length} pages to migrate`);
    
    for (const page of localPages.data) {
      // Remove id to let Render auto-generate
      const { id, ...pageData } = page;
      
      const res = await renderRequest('POST', '/items/pages', pageData);
      if (res.ok) {
        console.log(`  ✅ Migrated page: ${page.slug}`);
      } else {
        const err = await res.text();
        console.log(`  ⚠️ Failed to migrate page ${page.slug}: ${err}`);
      }
    }
  }
  
  // Get site_settings from local
  const localSettingsRes = await fetch(`${LOCAL_URL}/items/site_settings`);
  const localSettings = await localSettingsRes.json();
  
  if (localSettings.data) {
    console.log('  Migrating site_settings...');
    const { id, ...settingsData } = localSettings.data;
    
    const res = await renderRequest('POST', '/items/site_settings', settingsData);
    if (res.ok) {
      console.log('  ✅ Migrated site_settings');
    } else {
      const err = await res.text();
      console.log(`  ⚠️ Failed to migrate site_settings: ${err}`);
    }
  }
}

async function run() {
  try {
    await login();
    await createPagesCollection();
    await createSiteSettingsCollection();
    
    // Set public permissions
    await setPublicPermissions('pages');
    await setPublicPermissions('site_settings');
    
    await migrateData();
    
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

run();
