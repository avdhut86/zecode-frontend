const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FormData = require('form-data');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const CLOUDINARY_CLOUD = 'ds8llatku';
const CLOUDINARY_KEY = env.CLOUDINARY_API_KEY;
const CLOUDINARY_SECRET = env.CLOUDINARY_API_SECRET;

const testFile = path.join(__dirname, 'generated-model-poses', 'Womens_Black_Casual_Dress_front_standing.png');

async function test() {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = 'test_upload_' + timestamp;
  
  const paramsToSign = {
    folder: 'zecode/model-poses',
    public_id: publicId,
    timestamp: timestamp
  };
  
  const sortedParams = Object.keys(paramsToSign).sort().map(k => k + '=' + paramsToSign[k]).join('&');
  console.log('Params to sign:', sortedParams);
  
  const signature = crypto.createHash('sha1').update(sortedParams + CLOUDINARY_SECRET).digest('hex');
  console.log('Signature:', signature);

  const form = new FormData();
  form.append('file', fs.createReadStream(testFile));
  form.append('folder', 'zecode/model-poses');
  form.append('public_id', publicId);
  form.append('timestamp', timestamp.toString());
  form.append('api_key', CLOUDINARY_KEY);
  form.append('signature', signature);

  const res = await fetch('https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD + '/image/upload', {
    method: 'POST',
    body: form
  });
  
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

test();
