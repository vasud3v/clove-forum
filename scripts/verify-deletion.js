/**
 * Verify all forum data is deleted
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDeletion() {
  console.log('🔍 Verifying deletion...\n');

  const { data: categories } = await supabase.from('categories').select('id');
  const { data: topics } = await supabase.from('topics').select('id');
  const { data: threads } = await supabase.from('threads').select('id');
  const { data: posts } = await supabase.from('posts').select('id');

  console.log(`Categories: ${categories?.length || 0}`);
  console.log(`Topics: ${topics?.length || 0}`);
  console.log(`Threads: ${threads?.length || 0}`);
  console.log(`Posts: ${posts?.length || 0}`);

  if ((categories?.length || 0) === 0 && (topics?.length || 0) === 0 && 
      (threads?.length || 0) === 0 && (posts?.length || 0) === 0) {
    console.log('\n✅ Database is empty!');
  } else {
    console.log('\n⚠️  Some data still exists');
  }
}

verifyDeletion();
