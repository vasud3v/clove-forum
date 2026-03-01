/**
 * Test ImgBB API Key
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const IMGBB_API_KEY = process.env.VITE_IMGBB_API_KEY;

console.log('Testing ImgBB API Key...\n');
console.log('API Key:', IMGBB_API_KEY ? `${IMGBB_API_KEY.substring(0, 10)}...` : 'NOT FOUND');

if (!IMGBB_API_KEY) {
  console.error('❌ VITE_IMGBB_API_KEY not found in .env.local');
  process.exit(1);
}

// Test with a small 1x1 transparent PNG
const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testUpload() {
  try {
    const formData = new URLSearchParams();
    formData.append('image', testImage);
    formData.append('name', 'test-image');
    
    console.log('\nUploading test image to ImgBB...');
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Key is valid!');
      console.log('Test image URL:', data.data.url);
      console.log('\nYou can now use avatar uploads!\n');
    } else {
      console.error('❌ Upload failed:', data.error?.message || 'Unknown error');
      console.log('\nFull response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUpload();
