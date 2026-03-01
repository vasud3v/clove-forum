import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try to use service role key if available, otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log(`Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE ROLE' : 'ANON'} key\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCounts() {
  console.log('🔧 Fixing counts with proper permissions...\n');

  try {
    // Fix test category specifically
    const catId = 'cat-1772290944701-ij3axl';
    const topicId = 'topic-1772292413205-k45vhb';

    console.log('📁 Fixing test category...');
    
    // Count actual threads
    const { count: actualThreads } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', catId);

    // Count actual posts
    const { data: threads } = await supabase
      .from('threads')
      .select('id')
      .eq('category_id', catId);

    let actualPosts = 0;
    if (threads && threads.length > 0) {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .in('thread_id', threads.map(t => t.id));
      actualPosts = count || 0;
    }

    console.log(`Actual: ${actualThreads} threads, ${actualPosts} posts`);

    // Update category
    const { data: catUpdate, error: catError } = await supabase
      .from('categories')
      .update({
        thread_count: actualThreads || 0,
        post_count: actualPosts
      })
      .eq('id', catId)
      .select();

    if (catError) {
      console.error('❌ Category update error:', catError);
    } else {
      console.log('✅ Category updated:', catUpdate);
    }

    // Fix topic
    console.log('\n📑 Fixing aaaa topic...');
    
    const { count: topicThreads } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    const { data: topicThreadsList } = await supabase
      .from('threads')
      .select('id')
      .eq('topic_id', topicId);

    let topicPosts = 0;
    if (topicThreadsList && topicThreadsList.length > 0) {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .in('thread_id', topicThreadsList.map(t => t.id));
      topicPosts = count || 0;
    }

    console.log(`Actual: ${topicThreads} threads, ${topicPosts} posts`);

    const { data: topicUpdate, error: topicError } = await supabase
      .from('topics')
      .update({
        thread_count: topicThreads || 0,
        post_count: topicPosts
      })
      .eq('id', topicId)
      .select();

    if (topicError) {
      console.error('❌ Topic update error:', topicError);
    } else {
      console.log('✅ Topic updated:', topicUpdate);
    }

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    
    const { data: verifyCategory } = await supabase
      .from('categories')
      .select('name, thread_count, post_count')
      .eq('id', catId)
      .single();

    console.log('Category after update:', verifyCategory);

    const { data: verifyTopic } = await supabase
      .from('topics')
      .select('name, thread_count, post_count')
      .eq('id', topicId)
      .single();

    console.log('Topic after update:', verifyTopic);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCounts();
