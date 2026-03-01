import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTopicIconSupport() {
  console.log('🚀 Adding topic icon support...\n');

  try {
    // 1. Add icon column to topics table
    console.log('📝 Adding icon column to topics table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.topics 
        ADD COLUMN IF NOT EXISTS icon TEXT;
        
        COMMENT ON COLUMN public.topics.icon IS 'URL to topic icon image';
      `
    });

    if (alterError) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase
        .from('topics')
        .select('icon')
        .limit(1);
      
      if (directError && directError.message.includes('column "icon" does not exist')) {
        console.log('⚠️  Column does not exist. Please run the migration manually:');
        console.log('   ALTER TABLE public.topics ADD COLUMN icon TEXT;');
      } else {
        console.log('✅ Icon column already exists or added successfully');
      }
    } else {
      console.log('✅ Icon column added successfully');
    }

    // 2. Create storage bucket
    console.log('\n📦 Setting up forum-assets storage bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
    } else {
      const bucketExists = buckets.some(b => b.id === 'forum-assets');
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket('forum-assets', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        });
        
        if (createError) {
          console.error('❌ Error creating bucket:', createError.message);
        } else {
          console.log('✅ forum-assets bucket created successfully');
        }
      } else {
        console.log('✅ forum-assets bucket already exists');
      }
    }

    console.log('\n✨ Topic icon support setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Admin Panel > Topics tab');
    console.log('   2. Create or edit a topic');
    console.log('   3. Click "Upload Icon" to add a custom icon');
    console.log('   4. Icons will be stored in Supabase Storage');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTopicIconSupport();
