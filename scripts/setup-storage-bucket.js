import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBucket() {
  console.log('🚀 Setting up forum-assets storage bucket...\n');

  try {
    // 1. Check if bucket exists
    console.log('📦 Checking for existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      throw listError;
    }

    const bucketExists = buckets?.some(b => b.id === 'forum-assets');
    
    if (bucketExists) {
      console.log('✅ forum-assets bucket already exists');
      
      // Update bucket settings to ensure correct MIME types
      console.log('🔧 Updating bucket settings...');
      const { error: updateError } = await supabase.storage.updateBucket('forum-assets', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });
      
      if (updateError) {
        console.warn('⚠️  Could not update bucket settings:', updateError.message);
        console.log('   This is OK if the bucket is already configured correctly');
      } else {
        console.log('✅ Bucket settings updated');
      }
    } else {
      console.log('📦 Creating forum-assets bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('forum-assets', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        throw createError;
      }
      
      console.log('✅ forum-assets bucket created successfully');
    }

    // 2. Test upload
    console.log('\n🧪 Testing upload functionality...');
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('forum-assets')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      throw uploadError;
    }
    
    console.log('✅ Upload test successful');
    
    // Clean up test file
    await supabase.storage.from('forum-assets').remove([testPath]);
    console.log('✅ Test file cleaned up');

    console.log('\n✨ Storage bucket setup complete!');
    console.log('\n📋 Bucket Details:');
    console.log('   - Name: forum-assets');
    console.log('   - Public: Yes');
    console.log('   - Max Size: 5MB');
    console.log('   - Allowed Types: JPEG, PNG, GIF, WebP');
    console.log('\n🎉 You can now upload topic icons from the admin panel!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure you have SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('   2. Check that your Supabase project is active');
    console.log('   3. Verify you have storage permissions in your project');
    console.log('   4. You can also create the bucket manually in Supabase Dashboard > Storage');
    process.exit(1);
  }
}

setupStorageBucket();
