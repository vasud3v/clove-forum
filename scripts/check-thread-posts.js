/**
 * Check Posts for a Specific Thread
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

async function checkThreadPosts() {
  console.log('🔍 Checking Thread Posts...\n');

  try {
    // Get all threads
    const { data: threads, error: threadError } = await supabase
      .from('threads')
      .select('id, title, reply_count')
      .order('created_at', { ascending: false })
      .limit(10);

    if (threadError) {
      console.error('❌ Error fetching threads:', threadError.message);
      return;
    }

    if (!threads || threads.length === 0) {
      console.log('⚠️  No threads found in database');
      return;
    }

    console.log(`Found ${threads.length} threads:\n`);

    for (const thread of threads) {
      console.log(`Thread: ${thread.title}`);
      console.log(`ID: ${thread.id}`);
      console.log(`Reply Count (from thread): ${thread.reply_count}`);

      // Get actual posts for this thread
      const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('id, content, author_id, created_at')
        .eq('thread_id', thread.id)
        .order('created_at');

      if (postError) {
        console.error(`❌ Error fetching posts: ${postError.message}`);
      } else {
        console.log(`Actual Posts Count: ${posts?.length || 0}`);
        if (posts && posts.length > 0) {
          posts.forEach((post, idx) => {
            console.log(`  ${idx + 1}. Post ID: ${post.id}, Author: ${post.author_id}`);
            console.log(`     Content: ${post.content.substring(0, 50)}...`);
          });
        } else {
          console.log('  ⚠️  No posts found for this thread!');
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkThreadPosts();
