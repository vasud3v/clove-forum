/**
 * Test fetching posts for a specific thread
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificThread() {
  // Test with the thread that has posts
  const threadId = 'd7197d21-e18a-4b3a-a774-8fd9a8020419'; // "aaaaaa" thread
  
  console.log(`🔍 Testing thread: ${threadId}\n`);

  try {
    // Fetch posts using the same query as the app
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id, thread_id, content, created_at, edited_at, likes, upvotes, downvotes, is_answer, reply_to, signature,
        author:forum_users!posts_author_id_fkey(id, username, avatar, custom_avatar, banner, custom_banner, post_count, reputation, join_date, is_online, rank, role)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching posts:', error);
      return;
    }

    console.log(`✅ Found ${posts?.length || 0} posts`);
    
    if (posts && posts.length > 0) {
      posts.forEach((post, idx) => {
        console.log(`\nPost ${idx + 1}:`);
        console.log(`  ID: ${post.id}`);
        console.log(`  Thread ID: ${post.thread_id}`);
        console.log(`  Content: ${post.content.substring(0, 100)}...`);
        console.log(`  Author: ${post.author?.username || 'Unknown'}`);
        console.log(`  Created: ${post.created_at}`);
      });
    } else {
      console.log('⚠️  No posts returned from query');
    }

    // Also check RLS policies
    console.log('\n📋 Checking RLS policies on posts table...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'posts' })
      .catch(() => null);

    if (policies) {
      console.log('✅ RLS policies found');
    } else {
      console.log('⚠️  Could not fetch RLS policies (this is normal with anon key)');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpecificThread();
