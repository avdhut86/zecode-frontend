const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'pending-model-images');
const OUTPUT = path.join(__dirname, 'generated-model-poses');
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const API_KEY = envContent.match(/GOOGLE_API_KEY=(.+)/)[1].trim();

const POSES = ['front_standing', 'three_quarter', 'casual_lifestyle'];

function getNextTarget() {
  const files = fs.readdirSync(INPUT).filter(f => f.endsWith('.jpg'));
  for (const file of files) {
    const m = file.match(/^\d+_(.+)\.jpg$/);
    if (!m) continue;
    const key = m[1];
    for (const pose of POSES) {
      const outFile = key + '_' + pose + '.png';
      if (!fs.existsSync(path.join(OUTPUT, outFile))) {
        const gender = key.includes('Men_s') ? 'male' : 'female';
        const cat = key.split('_').pop().toLowerCase();
        return { file, key, pose, gender, cat, outFile };
      }
    }
  }
  return null;
}

async function generateOne(target) {
  const imgBase64 = fs.readFileSync(path.join(INPUT, target.file)).toString('base64');
  
  const prompt = `Professional fashion catalog photo. Show this ${target.cat} on a ${target.gender} model. Full body ${
    target.pose === 'front_standing' ? 'front view standing pose' : 
    target.pose === 'three_quarter' ? 'three-quarter angle confident pose' : 
    'casual relaxed pose'
  }, clean white studio background, high-end fashion photography.`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imgBase64 } },
          { text: prompt }
        ]}],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'], temperature: 0.4 }
      })
    }
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  const imgPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imgPart) {
    throw new Error('No image in response');
  }
  
  const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
  fs.writeFileSync(path.join(OUTPUT, target.outFile), buffer);
  return buffer.length;
}

async function main() {
  console.log('MODEL POSE GENERATOR - Single Run');
  console.log('Time:', new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('');
  
  const target = getNextTarget();
  
  if (!target) {
    console.log('All images generated!');
    return;
  }
  
  console.log(`Generating: ${target.key} -> ${target.pose}`);
  
  try {
    const size = await generateOne(target);
    console.log(`SUCCESS: ${target.outFile} (${Math.round(size/1024)} KB)`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    process.exit(1);
  }
}

main();
