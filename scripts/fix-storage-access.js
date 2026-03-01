import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStorageAccess() {
  console.log('🔧 Fixing storage access for forum-assets...\n');

  try {
    // 1. Ensure bucket is public
    console.log('📦 Making bucket public...');
    const { error: updateError } = await supabase.storage.updateBucket('forum-assets', {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: null
    });

    if (updateError) {
      console.error('❌ Error updating bucket:', updateError.message);
    } else {
      console.log('✅ Bucket is now public');
    }

    // 2. Test if we can access a file
    console.log('\n🧪 Testing file access...');
    
    const { data: files } = await supabase.storage
      .from('forum-assets')
      .list('topic-icons', { limit: 1 });

    if (files && files.length > 0) {
      const testFile = files[0];
      const { data: { publicUrl } } = supabase.storage
        .from('forum-assets')
        .getPublicUrl(`topic-icons/${testFile.name}`);

      console.log('   Test URL:', publicUrl);
      
      // Try to fetch it
      const response = await fetch(publicUrl);
      console.log('   Status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('   ✅ Files are publicly accessible!');
      } else {
        console.log('   ❌ Files are NOT accessible');
        console.log('   Response:', await response.text());
      }
    } else {
      console.log('   ℹ️  No files to test');
    }

    // 3. Verify bucket settings
    console.log('\n📋 Current bucket configuration:');
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucket = buckets?.find(b => b.id === 'forum-assets');
    
    if (bucket) {
      console.log('   - ID:', bucket.id);
      console.log('   - Public:', bucket.public);
      console.log('   - File size limit:', bucket.file_size_limit);
      console.log('   - Allowed MIME types:', bucket.allowed_mime_types || 'ALL');
      
      if (bucket.public) {
        console.log('\n✨ Storage is configured correctly!');
        console.log('🎉 Images should now load properly!');
        console.log('\n💡 If images still don\'t load:');
        console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
        console.log('   2. Hard refresh the page (Ctrl+Shift+R)');
        console.log('   3. Check browser console for CORS errors');
      } else {
        console.log('\n⚠️  Bucket is not public!');
        console.log('💡 Manual fix:');
        console.log('   1. Go to Supabase Dashboard > Storage');
        console.log('   2. Click on forum-assets');
        console.log('   3. Click three dots > Edit bucket');
        console.log('   4. Check "Public bucket"');
        console.log('   5. Save');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

fixStorageAccess();
