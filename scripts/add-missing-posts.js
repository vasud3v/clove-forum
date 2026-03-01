/**
 * Add missing posts to threads that don't have any
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

async function addMissingPosts() {
  console.log('🔧 Adding missing posts to threads...\n');

  try {
    // Get all threads
    const { data: threads, error: threadError } = await supabase
      .from('threads')
      .select('id, title, author_id, created_at')
      .order('created_at', { ascending: false });

    if (threadError) throw threadError;

    if (!threads || threads.length === 0) {
      console.log('⚠️  No threads found');
      return;
    }

    let addedCount = 0;

    for (const thread of threads) {
      // Check if thread has posts
      const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('thread_id', thread.id);

      if (postError) {
        console.error(`❌ Error checking posts for ${thread.id}:`, postError.message);
        continue;
      }

      if (!posts || posts.length === 0) {
        console.log(`📝 Adding post to thread: ${thread.title}`);
        
        // Add a post
        const { error: insertError } = await supabase
          .from('posts')
          .insert({
            id: `post-${thread.id}-1`,
            thread_id: thread.id,
            author_id: thread.author_id,
            content: `This is the first post in the thread "${thread.title}". Welcome to the discussion!`,
            created_at: thread.created_at,
          });

        if (insertError) {
          console.error(`❌ Error adding post:`, insertError.message);
        } else {
          console.log(`✅ Added post to: ${thread.title}`);
          addedCount++;
        }
      }
    }

    console.log(`\n✅ Added ${addedCount} posts to threads without posts`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMissingPosts();
