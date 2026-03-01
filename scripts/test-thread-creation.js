/**
 * Test Thread Creation with Thumbnail
 * This script helps test that thread thumbnails are being saved correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testThreadCreation() {
  console.log('\n🧪 Test Thread Creation with Thumbnail\n');

  try {
    // Get a user to create thread as
    const { data: users, error: userError } = await supabase
      .from('forum_users')
      .select('id, username, avatar')
      .limit(5);

    if (userError) throw userError;

    if (!users || users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      rl.close();
      return;
    }

    console.log('Available users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.id})`);
    });

    const userNum = await question('\nSelect user number: ');
    const selectedUser = users[parseInt(userNum) - 1];

    if (!selectedUser) {
      console.log('Invalid user selection.');
      rl.close();
      return;
    }

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5);

    console.log('\nAvailable categories:');
    categories?.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.id})`);
    });

    const catNum = await question('\nSelect category number: ');
    const selectedCategory = categories?.[parseInt(catNum) - 1];

    if (!selectedCategory) {
      console.log('Invalid category selection.');
      rl.close();
      return;
    }

    // Get topics for this category
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name')
      .eq('category_id', selectedCategory.id)
      .limit(5);

    if (!topics || topics.length === 0) {
      console.log('❌ No topics found for this category.');
      rl.close();
      return;
    }

    console.log('\nAvailable topics:');
    topics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.name} (${topic.id})`);
    });

    const topicNum = await question('\nSelect topic number: ');
    const selectedTopic = topics[parseInt(topicNum) - 1];

    if (!selectedTopic) {
      console.log('Invalid topic selection.');
      rl.close();
      return;
    }

    // Get thumbnail URL
    const thumbnailUrl = await question('\nEnter thumbnail URL (or press Enter to use author avatar): ');
    const finalThumbnail = thumbnailUrl.trim() || selectedUser.avatar;

    const bannerUrl = await question('Enter banner URL (optional, press Enter to skip): ');
    const finalBanner = bannerUrl.trim() || null;

    // Create test thread
    const threadId = `thread-test-${Date.now()}`;
    const postId = `post-test-${Date.now()}`;

    console.log('\n📝 Creating test thread...');

    const { error: threadError } = await supabase.from('threads').insert({
      id: threadId,
      title: `Test Thread - ${new Date().toLocaleString()}`,
      excerpt: 'This is a test thread to verify thumbnail functionality',
      author_id: selectedUser.id,
      category_id: selectedCategory.id,
      topic_id: selectedTopic.id,
      tags: ['test'],
      thumbnail: finalThumbnail,
      banner: finalBanner,
      created_at: new Date().toISOString(),
      last_reply_at: new Date().toISOString(),
      last_reply_by_id: selectedUser.id,
      reply_count: 0,
      view_count: 0,
      upvotes: 0,
      downvotes: 0,
      is_pinned: false,
      is_locked: false,
      is_hot: false,
    });

    if (threadError) throw threadError;

    // Create first post
    const { error: postError } = await supabase.from('posts').insert({
      id: postId,
      thread_id: threadId,
      author_id: selectedUser.id,
      content: 'This is a test post to verify thumbnail functionality.',
      created_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      is_answer: false,
    });

    if (postError) throw postError;

    console.log('\n✅ Test thread created successfully!');
    console.log(`   Thread ID: ${threadId}`);
    console.log(`   Title: Test Thread - ${new Date().toLocaleString()}`);
    console.log(`   Author: ${selectedUser.username}`);
    console.log(`   Category: ${selectedCategory.name}`);
    console.log(`   Topic: ${selectedTopic.name}`);
    console.log(`   Thumbnail: ${finalThumbnail}`);
    console.log(`   Banner: ${finalBanner || 'None'}`);
    console.log(`\n🔗 View thread at: /thread/${threadId}`);
    console.log('\nRefresh your browser to see the thread.\n');

    // Verify the thread was saved correctly
    const { data: verifyThread } = await supabase
      .from('threads')
      .select('id, title, thumbnail, banner')
      .eq('id', threadId)
      .single();

    if (verifyThread) {
      console.log('✅ Verification: Thread data in database:');
      console.log(`   Thumbnail in DB: ${verifyThread.thumbnail}`);
      console.log(`   Banner in DB: ${verifyThread.banner || 'None'}`);
      
      if (verifyThread.thumbnail === finalThumbnail) {
        console.log('   ✅ Thumbnail matches!');
      } else {
        console.log('   ❌ Thumbnail mismatch!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

testThreadCreation();
