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

async function removeMimeRestrictions() {
  console.log('🔧 Removing MIME type restrictions from forum-assets bucket...\n');

  try {
    // Update bucket to allow all MIME types
    console.log('📦 Updating bucket settings...');
    const { data, error } = await supabase.storage.updateBucket('forum-assets', {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: null // Remove MIME type restrictions
    });

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n💡 Manual fix:');
      console.log('   1. Go to Supabase Dashboard > Storage');
      console.log('   2. Click on forum-assets bucket');
      console.log('   3. Click three dots (⋮) > Edit bucket');
      console.log('   4. CLEAR the "Allowed MIME types" field (leave it empty)');
      console.log('   5. Make sure "Public bucket" is checked');
      console.log('   6. Click Save');
      process.exit(1);
    }

    console.log('✅ Bucket updated successfully!');
    
    // Verify
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucket = buckets?.find(b => b.id === 'forum-assets');
    
    console.log('\n📋 Current bucket settings:');
    console.log('   - Public:', bucket?.public);
    console.log('   - Max Size:', bucket?.file_size_limit, 'bytes');
    console.log('   - Allowed MIME types:', bucket?.allowed_mime_types || 'ALL (no restrictions)');

    console.log('\n✨ MIME restrictions removed!');
    console.log('🎉 You can now upload any image type!');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
  }
}

removeMimeRestrictions();
