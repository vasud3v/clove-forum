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

async function fixBucketMimeTypes() {
  console.log('🔧 Fixing forum-assets bucket MIME types...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      throw listError;
    }

    const bucket = buckets?.find(b => b.id === 'forum-assets');
    
    if (!bucket) {
      console.error('❌ forum-assets bucket not found!');
      console.log('\n💡 Run this first: node scripts/setup-storage-bucket.js');
      process.exit(1);
    }

    console.log('📦 Found forum-assets bucket');
    console.log('   Current settings:', JSON.stringify(bucket, null, 2));

    // Update bucket to allow image uploads
    console.log('\n🔧 Updating bucket settings...');
    
    const { data, error: updateError } = await supabase.storage.updateBucket('forum-assets', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ]
    });
    
    if (updateError) {
      console.error('❌ Error updating bucket:', updateError.message);
      
      // If update fails, try to recreate
      console.log('\n🔄 Attempting to recreate bucket...');
      
      // Delete bucket
      const { error: deleteError } = await supabase.storage.deleteBucket('forum-assets');
      if (deleteError) {
        console.error('❌ Could not delete bucket:', deleteError.message);
        throw deleteError;
      }
      
      console.log('✅ Old bucket deleted');
      
      // Create new bucket
      const { error: createError } = await supabase.storage.createBucket('forum-assets', {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml'
        ]
      });
      
      if (createError) {
        console.error('❌ Could not create bucket:', createError.message);
        throw createError;
      }
      
      console.log('✅ New bucket created with correct settings');
    } else {
      console.log('✅ Bucket settings updated successfully');
    }

    // Verify by listing buckets again
    const { data: updatedBuckets } = await supabase.storage.listBuckets();
    const updatedBucket = updatedBuckets?.find(b => b.id === 'forum-assets');
    
    console.log('\n📋 Updated bucket settings:');
    console.log('   - Public:', updatedBucket?.public);
    console.log('   - Max Size:', updatedBucket?.file_size_limit, 'bytes (5MB)');
    console.log('   - Allowed Types:', updatedBucket?.allowed_mime_types?.join(', ') || 'All types');

    console.log('\n✨ MIME types fixed successfully!');
    console.log('🎉 You can now upload images to topic icons!');

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.log('\n💡 Manual fix:');
    console.log('   1. Go to Supabase Dashboard > Storage');
    console.log('   2. Click on forum-assets bucket');
    console.log('   3. Click "Edit bucket"');
    console.log('   4. Set allowed MIME types to: image/jpeg, image/png, image/gif, image/webp');
    console.log('   5. Set max file size to: 5242880 (5MB)');
    console.log('   6. Ensure "Public bucket" is checked');
    process.exit(1);
  }
}

fixBucketMimeTypes();
