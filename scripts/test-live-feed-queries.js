import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
  console.log('Testing live feed queries...\n');

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Test threads query
  console.log('1. Testing threads query...');
  const { data: threads, error: threadsError } = await supabase
    .from('threads')
    .select('id, title, created_at, view_count, reply_count, is_hot, is_pinned, is_locked, author_id')
    .gte('created_at', oneWeekAgo)
    .order('created_at', { ascending: false })
    .limit(12);

  if (threadsError) {
    console.error('❌ Threads query error:', threadsError);
  } else {
    console.log(`✓ Found ${threads?.length || 0} threads`);
    if (threads && threads.length > 0) {
      console.log('  Sample:', threads[0].title);
    }
  }

  // Test posts query
  console.log('\n2. Testing posts query...');
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      id,
      created_at,
      thread_id,
      author:forum_users!posts_author_id_fkey(username, avatar),
      thread:threads!posts_thread_id_fkey(id, title)
    `)
    .gte('created_at', oneWeekAgo)
    .order('created_at', { ascending: false })
    .limit(15);

  if (postsError) {
    console.error('❌ Posts query error:', postsError);
  } else {
    console.log(`✓ Found ${posts?.length || 0} posts`);
    if (posts && posts.length > 0) {
      const post = posts[0];
      const author = Array.isArray(post.author) ? post.author[0] : post.author;
      const thread = Array.isArray(post.thread) ? post.thread[0] : post.thread;
      console.log('  Sample:', author?.username, 'replied to', thread?.title);
    }
  }

  // Test forum_users query
  console.log('\n3. Testing forum_users query...');
  const { data: users, error: usersError } = await supabase
    .from('forum_users')
    .select('id, username, avatar, join_date, reputation')
    .gte('join_date', oneWeekAgo)
    .order('join_date', { ascending: false })
    .limit(8);

  if (usersError) {
    console.error('❌ Users query error:', usersError);
  } else {
    console.log(`✓ Found ${users?.length || 0} users`);
    if (users && users.length > 0) {
      console.log('  Sample:', users[0].username);
    }
  }

  // Test popular threads
  console.log('\n4. Testing popular threads query...');
  const { data: popularThreads, error: popularError } = await supabase
    .from('threads')
    .select('id, title, last_reply_at, view_count, author_id')
    .gte('view_count', 1) // Very low threshold for testing
    .order('view_count', { ascending: false })
    .limit(5);

  if (popularError) {
    console.error('❌ Popular threads query error:', popularError);
  } else {
    console.log(`✓ Found ${popularThreads?.length || 0} popular threads`);
    if (popularThreads && popularThreads.length > 0) {
      console.log('  Sample:', popularThreads[0].title, `(${popularThreads[0].view_count} views)`);
    }
  }

  // Test if we can fetch author data
  if (threads && threads.length > 0) {
    console.log('\n5. Testing author fetch...');
    const authorIds = [...new Set(threads.map(t => t.author_id))];
    const { data: authors, error: authorsError } = await supabase
      .from('forum_users')
      .select('id, username, avatar')
      .in('id', authorIds);

    if (authorsError) {
      console.error('❌ Authors query error:', authorsError);
    } else {
      console.log(`✓ Found ${authors?.length || 0} authors`);
      if (authors && authors.length > 0) {
        console.log('  Sample:', authors[0].username);
      }
    }
  }

  console.log('\n✅ All queries tested!');
}

testQueries();
