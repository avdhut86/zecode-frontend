const fs = require('fs');
const path = require('path');

const INPUT_FOLDER = path.join(__dirname, 'pending-model-images');
const OUTPUT_FOLDER = path.join(__dirname, 'generated-model-poses');
const ENV_PATH = path.join(__dirname, '..', '.env.local');

// Load API key
const envContent = fs.readFileSync(ENV_PATH, 'utf8');
const API_KEY = envContent.match(/GOOGLE_API_KEY=(.+)/)[1].trim();
const MODEL = 'gemini-3-pro-image-preview';

const POSES = [
  { name: 'front_standing', prompt: (g, c) => `Professional fashion catalog photo. Show this ${c} on a ${g} model. Full body front view, standing pose, clean white studio background, high-end fashion photography.` },
  { name: 'three_quarter', prompt: (g, c) => `Professional fashion catalog photo. Show this ${c} on a ${g} model. Full body three-quarter angle view, confident pose, clean white studio background, high-end fashion photography.` },
  { name: 'casual_lifestyle', prompt: (g, c) => `Modern lifestyle fashion photo. Show this ${c} on a ${g} model. Full body casual relaxed pose, minimal background, editorial style photography.` }
];

function parseProduct(filename) {
  const m = filename.match(/^(\d+)_(.+)\.jpg$/);
  if (!m) return null;
  
  const key = m[1];
  const name = m[2];
  let gender = 'female';
  if (name.includes('Men_s') || name.includes('Mens')) gender = 'male';
  
  const words = name.replace(/_/g, ' ').split(' ');
  const category = words[words.length - 1].toLowerCase();
  
  return { key, name, gender, category, filename };
}

async function generateImage(imagePath, prompt, retries = 3) {
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
                { text: prompt }
              ]
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'], temperature: 0.4 }
          })
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        if (data.error.message.includes('quota')) {
          throw new Error('QUOTA_EXHAUSTED');
        }
        if (attempt < retries) {
          console.log(`    Retry ${attempt}/${retries}...`);
          await new Promise(r => setTimeout(r, 3000 * attempt));
          continue;
        }
        throw new Error(data.error.message);
      }
      
      const imgPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!imgPart) {
        if (attempt < retries) {
          console.log(`    No image, retry ${attempt}/${retries}...`);
          await new Promise(r => setTimeout(r, 3000 * attempt));
          continue;
        }
        throw new Error('No image in response');
      }
      
      return Buffer.from(imgPart.inlineData.data, 'base64');
    } catch (e) {
      if (e.message === 'QUOTA_EXHAUSTED') throw e;
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
}

async function main() {
  console.log('MODEL POSE GENERATION - Remaining Images');
  console.log('='.repeat(50));
  console.log('Time:', new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('');
  
  const files = fs.readdirSync(INPUT_FOLDER).filter(f => f.endsWith('.jpg'));
  
  // Build list of what's needed
  const needed = [];
  for (const file of files) {
    const product = parseProduct(file);
    if (!product) continue;
    
    for (const pose of POSES) {
      const outFile = `${product.name}_${pose.name}.png`;
      if (!fs.existsSync(path.join(OUTPUT_FOLDER, outFile))) {
        needed.push({ product, pose, outFile });
      }
    }
  }
  
  console.log(`Images to generate: ${needed.length}`);
  console.log('');
  
  let success = 0, errors = 0;
  
  for (let i = 0; i < needed.length; i++) {
    const { product, pose, outFile } = needed[i];
    const imagePath = path.join(INPUT_FOLDER, product.filename);
    const outputPath = path.join(OUTPUT_FOLDER, outFile);
    
    console.log(`[${i + 1}/${needed.length}] ${product.name.substring(0, 35)}... -> ${pose.name}`);
    
    try {
      const prompt = pose.prompt(product.gender, product.category);
      const buffer = await generateImage(imagePath, prompt);
      
      fs.writeFileSync(outputPath, buffer);
      console.log(`    OK (${Math.round(buffer.length / 1024)} KB)`);
      success++;
      
      // Rate limit
      await new Promise(r => setTimeout(r, 2500));
      
    } catch (e) {
      console.log(`    ERROR: ${e.message}`);
      errors++;
      
      if (e.message === 'QUOTA_EXHAUSTED') {
        console.log('\n⚠️ QUOTA EXHAUSTED - Stopping');
        break;
      }
      
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('DONE');
  console.log(`  Success: ${success}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Remaining: ${needed.length - success - errors}`);
  console.log('Time:', new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
}

main().catch(e => console.error('Fatal error:', e));
