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

async function checkRealtimeSync() {
  console.log('🔍 Checking real-time data synchronization...\n');
  
  const issues = [];

  try {
    // 1. Check if database triggers exist
    console.log('📋 Checking database triggers...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('pg_get_triggerdef', {});
    
    // Check for category count triggers
    const { data: categoryTriggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .or('trigger_name.eq.trigger_update_category_thread_count,trigger_name.eq.trigger_update_category_post_count');
    
    if (!categoryTriggers || categoryTriggers.length === 0) {
      issues.push('⚠️  Category count triggers not found - counts will not update automatically');
    } else {
      console.log('✓ Category count triggers found');
    }

    // 2. Check category counts accuracy
    console.log('\n📊 Checking category counts...');
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, thread_count, post_count');

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

      if (actualThreads !== cat.thread_count || actualPosts !== cat.post_count) {
        issues.push(
          `❌ ${cat.name}: Stored (${cat.thread_count} threads, ${cat.post_count} posts) vs Actual (${actualThreads} threads, ${actualPosts} posts)`
        );
      } else {
        console.log(`✓ ${cat.name}: Counts are correct`);
      }
    }

    // 3. Check topic counts accuracy
    console.log('\n📊 Checking topic counts...');
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name, category_id, thread_count, post_count');

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

      if (actualThreads !== topic.thread_count || actualPosts !== topic.post_count) {
        issues.push(
          `❌ Topic "${topic.name}": Stored (${topic.thread_count} threads, ${topic.post_count} posts) vs Actual (${actualThreads} threads, ${actualPosts} posts)`
        );
      } else {
        console.log(`✓ Topic "${topic.name}": Counts are correct`);
      }
    }

    // 4. Check user post counts
    console.log('\n👥 Checking user post counts...');
    const { data: users } = await supabase
      .from('forum_users')
      .select('id, username, post_count')
      .limit(10);

    for (const user of users || []) {
      const { count: actualPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      if (actualPosts !== user.post_count) {
        issues.push(
          `❌ User "${user.username}": Stored (${user.post_count} posts) vs Actual (${actualPosts} posts)`
        );
      }
    }
    console.log(`✓ Checked ${users?.length || 0} users`);

    // 5. Check thread reply counts
    console.log('\n💬 Checking thread reply counts...');
    const { data: threads } = await supabase
      .from('threads')
      .select('id, title, reply_count')
      .limit(20);

    for (const thread of threads || []) {
      const { count: actualReplies } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', thread.id);

      // reply_count should be posts - 1 (excluding the first post)
      const expectedReplyCount = Math.max(0, (actualReplies || 0) - 1);
      
      if (expectedReplyCount !== thread.reply_count) {
        issues.push(
          `❌ Thread "${thread.title}": Stored (${thread.reply_count} replies) vs Actual (${expectedReplyCount} replies)`
        );
      }
    }
    console.log(`✓ Checked ${threads?.length || 0} threads`);

    // Summary
    console.log('\n' + '='.repeat(60));
    if (issues.length === 0) {
      console.log('✅ All real-time data is synchronized correctly!');
    } else {
      console.log(`\n⚠️  Found ${issues.length} synchronization issues:\n`);
      issues.forEach(issue => console.log(issue));
      console.log('\n💡 Run "node scripts/fix-all-counts.js" to fix these issues');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRealtimeSync();
