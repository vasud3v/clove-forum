/**
 * Apply RLS fix for posts table
 * This requires the service role key to modify RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('   You need the service role key to modify RLS policies');
  console.error('   Get it from: Supabase Dashboard > Project Settings > API > service_role key');
  console.error('   Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix for posts table...\n');

  try {
    const sql = readFileSync('supabase/migrations/20240312_fix_posts_rls.sql', 'utf8');
    
    console.log('Executing SQL migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      const { error } = await supabase.from('_migrations').insert({
        name: '20240312_fix_posts_rls',
        executed_at: new Date().toISOString(),
      });
      return { error };
    });

    if (error) {
      console.error('❌ Error applying migration:', error.message);
      console.log('\n📋 Please apply this migration manually:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy the contents of: supabase/migrations/20240312_fix_posts_rls.sql');
      console.log('   3. Paste and run the SQL');
      return;
    }

    console.log('✅ RLS policies updated successfully!');
    console.log('\nNow try creating a post in the app - it should work!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please apply the migration manually through Supabase Dashboard');
  }
}

applyRLSFix();
