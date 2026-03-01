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

async function fixAllCounts() {
  console.log('🔧 Fixing all count discrepancies...\n');

  try {
    // 1. Fix category counts
    console.log('📁 Fixing category counts...');
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');

    for (const cat of categories || []) {
      // Count actual threads
      const { count: actualThreads } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id);

      // Count actual posts
      const { data: threads } = await supabase
        .from('threads')
        .select('id')
        .eq('category_id', cat.id);

      let actualPosts = 0;
      if (threads && threads.length > 0) {
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', threads.map(t => t.id));
        actualPosts = count || 0;
      }

      // Update category
      const { error } = await supabase
        .from('categories')
        .update({
          thread_count: actualThreads || 0,
          post_count: actualPosts
        })
        .eq('id', cat.id);

      if (error) {
        console.error(`  ❌ Error updating ${cat.name}:`, error);
      } else {
        console.log(`  ✓ ${cat.name}: ${actualThreads || 0} threads, ${actualPosts} posts`);
      }
    }

    // 2. Fix topic counts
    console.log('\n📑 Fixing topic counts...');
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name');

    for (const topic of topics || []) {
      // Count actual threads
      const { count: actualThreads } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id);

      // Count actual posts
      const { data: threads } = await supabase
        .from('threads')
        .select('id')
        .eq('topic_id', topic.id);

      let actualPosts = 0;
      if (threads && threads.length > 0) {
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', threads.map(t => t.id));
        actualPosts = count || 0;
      }

      // Get last activity
      const { data: lastPost } = await supabase
        .from('posts')
        .select('created_at, author_id')
        .in('thread_id', threads?.map(t => t.id) || [])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Update topic
      const updateData = {
        thread_count: actualThreads || 0,
        post_count: actualPosts,
      };

      if (lastPost) {
        updateData.last_activity = lastPost.created_at;
        updateData.last_post_by = lastPost.author_id;
      }

      const { error } = await supabase
        .from('topics')
        .update(updateData)
        .eq('id', topic.id);

      if (error) {
        console.error(`  ❌ Error updating topic "${topic.name}":`, error);
      } else {
        console.log(`  ✓ Topic "${topic.name}": ${actualThreads || 0} threads, ${actualPosts} posts`);
      }
    }

    // 3. Fix user post counts
    console.log('\n👥 Fixing user post counts...');
    const { data: users } = await supabase
      .from('forum_users')
      .select('id, username');

    let fixedUsers = 0;
    for (const user of users || []) {
      const { count: actualPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      const { error } = await supabase
        .from('forum_users')
        .update({ post_count: actualPosts || 0 })
        .eq('id', user.id);

      if (!error) {
        fixedUsers++;
      }
    }
    console.log(`  ✓ Updated ${fixedUsers} users`);

    // 4. Fix thread reply counts
    console.log('\n💬 Fixing thread reply counts...');
    const { data: allThreads } = await supabase
      .from('threads')
      .select('id, title');

    let fixedThreads = 0;
    for (const thread of allThreads || []) {
      const { count: actualPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', thread.id);

      // reply_count = total posts - 1 (excluding first post)
      const replyCount = Math.max(0, (actualPosts || 0) - 1);

      // Get last reply info
      const { data: lastPost } = await supabase
        .from('posts')
        .select('created_at, author_id')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const updateData = {
        reply_count: replyCount,
      };

      if (lastPost) {
        updateData.last_reply_at = lastPost.created_at;
        updateData.last_reply_by_id = lastPost.author_id;
      }

      const { error } = await supabase
        .from('threads')
        .update(updateData)
        .eq('id', thread.id);

      if (!error) {
        fixedThreads++;
      }
    }
    console.log(`  ✓ Updated ${fixedThreads} threads`);

    console.log('\n✅ All counts have been fixed!');
    console.log('\n💡 Note: Database triggers should be applied to keep counts in sync automatically.');
    console.log('   Check supabase/migrations/20240322_fix_category_counts.sql');
    console.log('   and supabase/migrations/20240322_fix_topic_counts.sql');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllCounts();
