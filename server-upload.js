import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import FormData from 'form-data';
import multer from 'multer';

const app = express();
const PORT = 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']
}));

// Use multer for handling multipart/form-data (file uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// ImgBB API endpoint (for images) - Permanent storage, unlimited uploads
const IMGBB_API_KEY = '9058482f589223f475eb9deace55a70f'; // Your API key
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Catbox.moe API endpoint (for videos) - Simple, no API key required, instant playback
const CATBOX_UPLOAD_URL = 'https://catbox.moe/user/api.php';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Upload server is running' });
});

app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const fileType = req.file.mimetype;
    const isVideo = fileType.startsWith('video/');
    
    console.log(`📤 Uploading ${isVideo ? 'video' : 'image'} to ${isVideo ? 'Catbox.moe' : 'ImgBB'}...`, req.file.originalname, `(${(req.file.size / 1024).toFixed(2)} KB)`);

    if (isVideo) {
      // Upload video to Catbox.moe (instant playback)
      console.log('📤 Uploading to Catbox.moe...');
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const response = await fetch(CATBOX_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const resultText = await response.text();

      if (!response.ok || !resultText.startsWith('https://')) {
        throw new Error('Video upload failed');
      }

      console.log('✅ Video uploaded to Catbox.moe:', resultText);
      res.json({
        success: true,
        url: resultText,
        type: 'video',
        host: 'catbox'
      });

    } else {
      // Upload image to ImgBB (permanent storage, unlimited uploads)
      const base64Data = req.file.buffer.toString('base64');

      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Data);
      formData.append('expiration', '0'); // 0 = never expire (permanent)
      formData.append('name', req.file.originalname.split('.')[0]);

      const response = await fetch(IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const result = await response.json();

      console.log('📥 ImgBB response:', result.success ? 'Success' : 'Failed', result.status);

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.status_txt || 'Upload failed');
      }

      console.log('✅ Image uploaded to ImgBB (permanent):', result.data.url);
      res.json({
        success: true,
        url: result.data.url,
        display_url: result.data.display_url,
        delete_url: result.data.delete_url,
        thumb_url: result.data.thumb?.url,
        type: 'image',
        host: 'imgbb'
      });
    }

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Image upload proxy server running on http://localhost:${PORT}`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload-image`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
