/**
 * Test fetching categories the same way the app does
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

async function testFetchCategories() {
  console.log('🔍 Testing category fetch (same as app)...\n');

  const pageSize = 100; // Changed to match the fix
  const from = 0;
  const to = from + pageSize - 1;

  // Fetch exactly as the app does
  const [categoriesResult, topicsResult, threadsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important')
      .order('is_sticky', { ascending: false })
      .order('is_important', { ascending: false })
      .order('name'),
    
    supabase
      .from('topics')
      .select(`
        id, name, description, thread_count, post_count, last_activity, category_id,
        last_post_by_user:forum_users!topics_last_post_by_fkey(username)
      `)
      .order('name'),
    
    supabase
      .from('threads')
      .select(`
        id, title, excerpt, author_id, category_id, topic_id,
        created_at, last_reply_at, last_reply_by_id,
        reply_count, view_count, is_pinned, is_locked, is_hot,
        has_unread, tags, upvotes, downvotes, banner,
        author:forum_users!threads_author_id_fkey(id, username, avatar, custom_avatar, banner, custom_banner, post_count, reputation, join_date, is_online, rank, role),
        last_reply_by:forum_users!threads_last_reply_by_id_fkey(id, username, avatar, custom_avatar, banner, custom_banner, post_count, reputation, join_date, is_online, rank, role)
      `)
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false })
      .range(from, to)
  ]);

  console.log('Categories:', categoriesResult.data?.length || 0);
  console.log('Topics:', topicsResult.data?.length || 0);
  console.log('Threads:', threadsResult.data?.length || 0);

  if (categoriesResult.error) console.error('Categories error:', categoriesResult.error);
  if (topicsResult.error) console.error('Topics error:', topicsResult.error);
  if (threadsResult.error) console.error('Threads error:', threadsResult.error);

  // Find TEST category
  const testCat = categoriesResult.data?.find(c => c.name.toLowerCase().includes('test'));
  if (testCat) {
    console.log(`\n📂 TEST Category: ${testCat.name} (ID: ${testCat.id})`);
    console.log(`   Thread count in DB: ${testCat.thread_count}`);
    
    const testThreads = threadsResult.data?.filter(t => t.category_id === testCat.id);
    console.log(`   Threads fetched: ${testThreads?.length || 0}`);
    
    if (testThreads && testThreads.length > 0) {
      console.log('\n   Threads:');
      testThreads.forEach(t => {
        console.log(`   - ${t.title} (ID: ${t.id})`);
      });
    } else {
      console.log('\n   ⚠️  No threads fetched for TEST category!');
      console.log('   This is why they are not showing in the UI.');
    }
  }

  // Show all fetched threads
  console.log('\n📝 All fetched threads:');
  threadsResult.data?.forEach(t => {
    console.log(`   - ${t.title} (Category: ${t.category_id})`);
  });
}

testFetchCategories();
