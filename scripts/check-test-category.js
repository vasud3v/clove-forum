/**
 * Check TEST category threads and topics
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

async function checkTestCategory() {
  console.log('🔍 Checking TEST category...\n');

  // Find TEST category
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', '%test%');

  if (catError) {
    console.error('❌ Error:', catError.message);
    return;
  }

  if (!categories || categories.length === 0) {
    console.log('⚠️  No TEST category found');
    return;
  }

  const testCategory = categories[0];
  console.log(`Found category: ${testCategory.name} (ID: ${testCategory.id})`);
  console.log(`Thread count: ${testCategory.thread_count}\n`);

  // Check topics
  console.log('📂 Checking topics...');
  const { data: topics, error: topicError } = await supabase
    .from('topics')
    .select('*')
    .eq('category_id', testCategory.id);

  if (topicError) {
    console.error('❌ Error:', topicError.message);
  } else {
    console.log(`Found ${topics?.length || 0} topics`);
    if (topics && topics.length > 0) {
      topics.forEach(topic => {
        console.log(`  - ${topic.name} (${topic.thread_count} threads)`);
      });
    }
  }

  // Check threads
  console.log('\n📝 Checking threads...');
  const { data: threads, error: threadError } = await supabase
    .from('threads')
    .select('id, title, reply_count')
    .eq('category_id', testCategory.id);

  if (threadError) {
    console.error('❌ Error:', threadError.message);
  } else {
    console.log(`Found ${threads?.length || 0} threads`);
    if (threads && threads.length > 0) {
      for (const thread of threads) {
        console.log(`\n  Thread: ${thread.title}`);
        console.log(`  ID: ${thread.id}`);
        console.log(`  Reply count: ${thread.reply_count}`);
        
        // Check posts for this thread
        const { data: posts } = await supabase
          .from('posts')
          .select('id')
          .eq('thread_id', thread.id);
        
        console.log(`  Actual posts: ${posts?.length || 0}`);
      }
    }
  }

  // Check with inner join (what the app uses now)
  console.log('\n🔍 Checking with inner join (what app uses)...');
  const { data: threadsWithPosts, error: joinError } = await supabase
    .from('threads')
    .select(`
      id, title,
      posts!inner(id)
    `)
    .eq('category_id', testCategory.id);

  if (joinError) {
    console.error('❌ Error:', joinError.message);
  } else {
    console.log(`Found ${threadsWithPosts?.length || 0} threads with posts`);
  }
}

checkTestCategory();
