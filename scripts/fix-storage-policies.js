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

async function fixStoragePolicies() {
  console.log('🔐 Fixing storage policies...\n');

  const policies = [
    {
      name: 'Public read access for forum assets',
      sql: `
        CREATE POLICY "Public read access for forum assets"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'forum-assets');
      `
    },
    {
      name: 'Authenticated users can upload forum assets',
      sql: `
        CREATE POLICY "Authenticated users can upload forum assets"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'forum-assets' AND auth.role() = 'authenticated');
      `
    },
    {
      name: 'Users can update their own forum assets',
      sql: `
        CREATE POLICY "Users can update their own forum assets"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'forum-assets' AND auth.role() = 'authenticated');
      `
    },
    {
      name: 'Users can delete their own forum assets',
      sql: `
        CREATE POLICY "Users can delete their own forum assets"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'forum-assets' AND auth.role() = 'authenticated');
      `
    }
  ];

  try {
    // Drop existing policies
    console.log('🗑️  Dropping existing policies...');
    for (const policy of policies) {
      const dropSql = `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`;
      const { error } = await supabase.rpc('exec_sql', { sql: dropSql });
      if (error) console.warn(`   ⚠️  ${policy.name}:`, error.message);
      else console.log(`   ✅ Dropped: ${policy.name}`);
    }

    // Create new policies
    console.log('\n📝 Creating new policies...');
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        console.error(`   ❌ ${policy.name}:`, error.message);
      } else {
        console.log(`   ✅ Created: ${policy.name}`);
      }
    }

    console.log('\n✨ Storage policies fixed!');
    console.log('🎉 Try uploading an icon now!');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.log('\n💡 Manual fix - Run these SQL commands in Supabase SQL Editor:');
    console.log('\n```sql');
    policies.forEach(p => {
      console.log(`DROP POLICY IF EXISTS "${p.name}" ON storage.objects;`);
      console.log(p.sql);
      console.log('');
    });
    console.log('```');
  }
}

fixStoragePolicies();
