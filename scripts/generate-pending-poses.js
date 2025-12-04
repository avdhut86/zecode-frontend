const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FOLDER = path.join(__dirname, 'pending-model-images');
const OUTPUT_FOLDER = path.join(__dirname, 'generated-model-poses');
const ENV_PATH = path.join(__dirname, '..', '.env.local');

// Load environment variables
const envContent = fs.readFileSync(ENV_PATH, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const API_KEY = env.GOOGLE_API_KEY;
const MODEL = 'gemini-3-pro-image-preview';

// Poses to generate
const POSES = [
  {
    name: 'front_standing',
    prompt: (product) => `Professional fashion photography of a ${product.gender} model wearing this exact ${product.category}. 
Full body shot, front facing, standing pose, neutral studio background.
The model should be wearing ONLY this garment as the main focus.
High-end fashion catalog style, clean lighting, professional quality.`
  },
  {
    name: 'three_quarter',
    prompt: (product) => `Professional fashion photography of a ${product.gender} model wearing this exact ${product.category}.
Full body shot, three-quarter angle view, confident stance, neutral studio background.
The model should be wearing ONLY this garment as the main focus.
High-end fashion catalog style, clean lighting, professional quality.`
  },
  {
    name: 'casual_lifestyle',
    prompt: (product) => `Professional lifestyle fashion photography of a ${product.gender} model wearing this exact ${product.category}.
Full body shot, casual relaxed pose, minimal lifestyle background.
The model should be wearing ONLY this garment as the main focus.
Modern fashion editorial style, natural lighting, aspirational mood.`
  }
];

// Parse product info from filename
function parseProductInfo(filename) {
  // Format: 233_Women_s_White_Casual_Striped_Print_Top.jpg
  const match = filename.match(/^(\d+)_(.+)\.jpg$/);
  if (!match) return null;
  
  const id = match[1];
  const namePart = match[2];
  
  // Determine gender
  let gender = 'female';
  if (namePart.includes('Men_s') || namePart.includes('Mens')) {
    gender = 'male';
  } else if (namePart.includes('Kids') || namePart.includes('Boy') || namePart.includes('Girl')) {
    gender = 'child';
  }
  
  // Extract category (last word usually)
  const words = namePart.replace(/_/g, ' ').split(' ');
  const category = words[words.length - 1].toLowerCase();
  
  return {
    id,
    name: namePart.replace(/_/g, ' ').replace(/\s+/g, '_'),
    gender,
    category,
    filename
  };
}

// Generate image using Gemini API
async function generateImage(productImage, prompt) {
  const imageBase64 = fs.readFileSync(productImage).toString('base64');
  const mimeType = 'image/jpeg';
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt }
          ]
        }],
        generationConfig: { 
          responseModalities: ['TEXT', 'IMAGE'],
          temperature: 0.4
        }
      })
    }
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`);
  }
  
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  
  if (!imagePart) {
    throw new Error('No image in response');
  }
  
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

// Main function
async function main() {
  console.log('MODEL POSE GENERATION');
  console.log('='.repeat(60));
  console.log('Time:', new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('Model:', MODEL);
  console.log('');
  
  // Ensure output folder exists
  if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  }
  
  // Get all pending images
  const files = fs.readdirSync(INPUT_FOLDER).filter(f => f.endsWith('.jpg'));
  console.log(`Found ${files.length} products to process`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const product = parseProductInfo(file);
    
    if (!product) {
      console.log(`Skipping invalid filename: ${file}`);
      continue;
    }
    
    console.log(`\n[${i + 1}/${files.length}] ${product.name}`);
    console.log(`  Gender: ${product.gender}, Category: ${product.category}`);
    
    const imagePath = path.join(INPUT_FOLDER, file);
    
    for (const pose of POSES) {
      const outputFile = `${product.name}_${pose.name}.png`;
      const outputPath = path.join(OUTPUT_FOLDER, outputFile);
      
      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`  ${pose.name}: Already exists, skipping`);
        continue;
      }
      
      try {
        console.log(`  ${pose.name}: Generating...`);
        const prompt = pose.prompt(product);
        const imageBuffer = await generateImage(imagePath, prompt);
        
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`  ${pose.name}: Saved (${Math.round(imageBuffer.length / 1024)} KB)`);
        successCount++;
        
        // Rate limiting - wait 2 seconds between requests
        await new Promise(r => setTimeout(r, 2000));
        
      } catch (error) {
        console.log(`  ${pose.name}: ERROR - ${error.message}`);
        errorCount++;
        
        // If quota error, stop processing
        if (error.message.includes('quota') || error.message.includes('429')) {
          console.log('\n⚠️ QUOTA EXHAUSTED - Stopping');
          break;
        }
        
        // Wait longer on error
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('COMPLETED');
  console.log(`  Success: ${successCount} images`);
  console.log(`  Errors: ${errorCount}`);
  console.log('Time:', new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
}

main().catch(console.error);
