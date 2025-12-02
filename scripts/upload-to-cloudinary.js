// Script to upload all product images to Cloudinary
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Disable SSL verification (needed for some networks)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configure Cloudinary - use environment variables
// Set these before running:
//   $env:CLOUDINARY_CLOUD_NAME='your-cloud-name'
//   $env:CLOUDINARY_API_KEY='your-api-key'
//   $env:CLOUDINARY_API_SECRET='your-api-secret'
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary credentials!');
  console.error('Set environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Folders to upload (will scan recursively)
const FOLDERS_TO_UPLOAD = [
  'products',
  'categories',
  'hero',
  'brand',
  'placeholders'
];

// Track uploaded files for mapping
const uploadedFiles = {};

async function uploadFile(filePath, cloudinaryFolder) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const relativePath = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
  
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: cloudinaryFolder,
      public_id: fileName,
      overwrite: true,
      resource_type: 'image',
      // Auto-optimize
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    console.log(`✓ Uploaded: ${relativePath}`);
    uploadedFiles[`/${relativePath}`] = result.secure_url;
    return result;
  } catch (error) {
    console.error(`✗ Failed: ${relativePath} - ${error.message || JSON.stringify(error)}`);
    if (error.http_code) console.error(`  HTTP ${error.http_code}: ${error.message}`);
    return null;
  }
}

// Recursively get all image files in a directory
function getAllImageFiles(dir, baseFolder) {
  const results = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      results.push(...getAllImageFiles(fullPath, baseFolder));
    } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.name)) {
      // Calculate cloudinary folder path
      const relativeDirPath = path.relative(path.join(PUBLIC_DIR, baseFolder), path.dirname(fullPath));
      const cloudinaryFolder = relativeDirPath 
        ? `zecode/${baseFolder}/${relativeDirPath.replace(/\\/g, '/')}`
        : `zecode/${baseFolder}`;
      
      results.push({ filePath: fullPath, cloudinaryFolder });
    }
  }
  
  return results;
}

async function uploadFolder(folderName) {
  const folderPath = path.join(PUBLIC_DIR, folderName);
  
  if (!fs.existsSync(folderPath)) {
    console.log(`Skipping ${folderName} - folder doesn't exist`);
    return;
  }
  
  const imageFiles = getAllImageFiles(folderPath, folderName);
  
  console.log(`\n📁 Uploading ${folderName}/ (${imageFiles.length} images)...`);
  
  // Upload in batches of 10 to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < imageFiles.length; i += batchSize) {
    const batch = imageFiles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(({ filePath, cloudinaryFolder }) => uploadFile(filePath, cloudinaryFolder))
    );
    console.log(`  Progress: ${Math.min(i + batchSize, imageFiles.length)}/${imageFiles.length}`);
  }
}

async function main() {
  console.log('🚀 Starting Cloudinary upload...\n');
  console.log('Cloud Name: zecode');
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  for (const folder of FOLDERS_TO_UPLOAD) {
    await uploadFolder(folder);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Upload complete! (${elapsed} minutes)`);
  console.log(`📊 Total files uploaded: ${Object.keys(uploadedFiles).length}`);
  
  // Save mapping file
  const mappingPath = path.join(__dirname, 'cloudinary-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(uploadedFiles, null, 2));
  console.log(`\n📄 Mapping saved to: ${mappingPath}`);
  
  // Show sample URLs
  console.log('\n📷 Sample Cloudinary URLs:');
  const samples = Object.entries(uploadedFiles).slice(0, 5);
  samples.forEach(([local, cloud]) => {
    console.log(`  ${local} → ${cloud}`);
  });
}

main().catch(console.error);
