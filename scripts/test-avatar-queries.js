/**
 * Test Avatar Queries
 * Verifies that custom_avatar is being fetched correctly from the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAvatarQueries() {
  console.log('🔍 Testing Avatar Queries...\n');

  try {
    // Test 1: Check if any users have custom avatars
    console.log('1️⃣ Checking users with custom avatars...');
    const { data: usersWithCustomAvatars, error: error1 } = await supabase
      .from('forum_users')
      .select('id, username, avatar, custom_avatar')
      .not('custom_avatar', 'is', null);

    if (error1) {
      console.error('❌ Error:', error1.message);
    } else {
      console.log(`✅ Found ${usersWithCustomAvatars?.length || 0} users with custom avatars`);
      if (usersWithCustomAvatars && usersWithCustomAvatars.length > 0) {
        usersWithCustomAvatars.forEach(user => {
          console.log(`   - ${user.username}: custom_avatar = ${user.custom_avatar ? '✓' : '✗'}`);
        });
      }
    }

    // Test 2: Check profile_customizations table
    console.log('\n2️⃣ Checking profile_customizations table...');
    const { data: customizations, error: error2 } = await supabase
      .from('profile_customizations')
      .select('user_id, custom_avatar')
      .not('custom_avatar', 'is', null);

    if (error2) {
      console.error('❌ Error:', error2.message);
    } else {
      console.log(`✅ Found ${customizations?.length || 0} custom avatar entries`);
      if (customizations && customizations.length > 0) {
        customizations.forEach(custom => {
          console.log(`   - User ID ${custom.user_id}: ${custom.custom_avatar ? 'Has custom avatar' : 'No custom avatar'}`);
        });
      }
    }

    // Test 3: Test a thread query with author custom_avatar
    console.log('\n3️⃣ Testing thread query with author custom_avatar...');
    const { data: threads, error: error3 } = await supabase
      .from('threads')
      .select(`
        id,
        title,
        author:forum_users!threads_author_id_fkey(id, username, avatar, custom_avatar)
      `)
      .limit(5);

    if (error3) {
      console.error('❌ Error:', error3.message);
    } else {
      console.log(`✅ Fetched ${threads?.length || 0} threads with author data`);
      if (threads && threads.length > 0) {
        threads.forEach(thread => {
          const author = Array.isArray(thread.author) ? thread.author[0] : thread.author;
          console.log(`   - "${thread.title}" by ${author?.username}`);
          console.log(`     avatar: ${author?.avatar ? '✓' : '✗'}, custom_avatar: ${author?.custom_avatar ? '✓' : '✗'}`);
        });
      }
    }

    // Test 4: Test a post query with author custom_avatar
    console.log('\n4️⃣ Testing post query with author custom_avatar...');
    const { data: posts, error: error4 } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        author:forum_users!posts_author_id_fkey(id, username, avatar, custom_avatar)
      `)
      .limit(5);

    if (error4) {
      console.error('❌ Error:', error4.message);
    } else {
      console.log(`✅ Fetched ${posts?.length || 0} posts with author data`);
      if (posts && posts.length > 0) {
        posts.forEach(post => {
          const author = Array.isArray(post.author) ? post.author[0] : post.author;
          console.log(`   - Post by ${author?.username}`);
          console.log(`     avatar: ${author?.avatar ? '✓' : '✗'}, custom_avatar: ${author?.custom_avatar ? '✓' : '✗'}`);
        });
      }
    }

    // Test 5: Check if custom_avatar field exists in forum_users table
    console.log('\n5️⃣ Checking forum_users table structure...');
    const { data: sampleUser, error: error5 } = await supabase
      .from('forum_users')
      .select('*')
      .limit(1)
      .single();

    if (error5) {
      console.error('❌ Error:', error5.message);
    } else {
      const hasCustomAvatar = 'custom_avatar' in sampleUser;
      console.log(`✅ forum_users table ${hasCustomAvatar ? 'HAS' : 'DOES NOT HAVE'} custom_avatar column`);
      if (hasCustomAvatar) {
        console.log(`   Sample user custom_avatar value: ${sampleUser.custom_avatar || 'null'}`);
      }
    }

    console.log('\n✨ Avatar query tests complete!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAvatarQueries();
