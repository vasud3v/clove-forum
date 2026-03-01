/**
 * Test if posts are now accessible after RLS fix
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

async function testPostsAccess() {
  console.log('🔍 Testing posts access after RLS fix...\n');

  // Test with a thread that has posts
  const threadId = 'd7197d21-e18a-4b3a-a774-8fd9a8020419'; // "aaaaaa" thread
  
  console.log(`Testing thread: ${threadId}`);
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content, author_id, created_at')
    .eq('thread_id', threadId);

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  RLS policies might still be blocking access');
    return;
  }

  console.log(`✅ Successfully fetched ${posts?.length || 0} posts`);
  
  if (posts && posts.length > 0) {
    console.log('\n📝 Posts found:');
    posts.forEach((post, idx) => {
      console.log(`  ${idx + 1}. ${post.content.substring(0, 50)}...`);
    });
    console.log('\n✅ RLS FIX SUCCESSFUL! Posts are now accessible.');
  } else {
    console.log('\n⚠️  No posts found for this thread');
  }
}

testPostsAccess();
