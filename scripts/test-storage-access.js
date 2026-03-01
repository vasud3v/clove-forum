import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageAccess() {
  console.log('🧪 Testing storage access...\n');

  try {
    // 1. List buckets
    console.log('📦 Listing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }
    
    console.log('✅ Found buckets:', buckets?.map(b => b.name).join(', '));
    
    const forumAssets = buckets?.find(b => b.id === 'forum-assets');
    if (forumAssets) {
      console.log('\n📋 forum-assets bucket details:');
      console.log('   - Public:', forumAssets.public);
      console.log('   - Created:', forumAssets.created_at);
      console.log('   - Updated:', forumAssets.updated_at);
    } else {
      console.error('❌ forum-assets bucket not found!');
      console.log('\n💡 Create it in Supabase Dashboard:');
      console.log('   1. Go to Storage');
      console.log('   2. Click "New bucket"');
      console.log('   3. Name: forum-assets');
      console.log('   4. Check "Public bucket"');
      console.log('   5. Click "Create bucket"');
      process.exit(1);
    }

    // 2. List files in topic-icons folder
    console.log('\n📁 Listing files in topic-icons folder...');
    const { data: files, error: filesError } = await supabase.storage
      .from('forum-assets')
      .list('topic-icons', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else if (files && files.length > 0) {
      console.log(`✅ Found ${files.length} files:`);
      files.forEach(file => {
        console.log(`   - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
      });
      
      // 3. Test public URL for first file
      const testFile = files[0];
      const { data: { publicUrl } } = supabase.storage
        .from('forum-assets')
        .getPublicUrl(`topic-icons/${testFile.name}`);
      
      console.log('\n🔗 Testing public URL:');
      console.log('   URL:', publicUrl);
      
      // Try to fetch the URL
      console.log('   Fetching...');
      const response = await fetch(publicUrl);
      console.log('   Status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('   ✅ File is publicly accessible!');
      } else {
        console.log('   ❌ File is NOT accessible!');
        console.log('   This means the bucket is not properly configured as public.');
        console.log('\n💡 Fix:');
        console.log('   1. Go to Supabase Dashboard > Storage');
        console.log('   2. Click on forum-assets bucket');
        console.log('   3. Click the three dots (⋮) > Edit bucket');
        console.log('   4. Make sure "Public bucket" is CHECKED');
        console.log('   5. Save changes');
      }
    } else {
      console.log('ℹ️  No files found in topic-icons folder');
    }

    // 4. Check storage policies
    console.log('\n🔐 Checking storage policies...');
    console.log('   Note: This requires service role key to check policies');
    console.log('   If uploads work but downloads fail, the bucket is not public');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   1. Bucket not created');
    console.log('   2. Bucket not set as public');
    console.log('   3. Missing storage policies');
    console.log('   4. CORS issues (check browser console)');
  }
}

testStorageAccess();
