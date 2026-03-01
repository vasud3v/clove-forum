import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAvatarIssues() {
  console.log('🔍 Checking avatar configuration...\n');

  try {
    // 1. Check if custom avatars exist in profile_customizations
    const { data: customizations, error: custError } = await supabase
      .from('profile_customizations')
      .select('user_id, custom_avatar, custom_banner')
      .not('custom_avatar', 'is', null);

    console.log(`📊 Users with custom avatars: ${customizations?.length || 0}`);
    
    if (customizations && customizations.length > 0) {
      console.log('\nCustom avatars found:');
      for (const cust of customizations.slice(0, 5)) {
        const { data: user } = await supabase
          .from('forum_users')
          .select('username, avatar')
          .eq('id', cust.user_id)
          .single();
        
        console.log(`  - ${user?.username}: custom=${cust.custom_avatar?.substring(0, 50)}...`);
        console.log(`    default=${user?.avatar?.substring(0, 50)}...`);
      }
    }

    // 2. Check forum_users table structure
    console.log('\n📋 Checking forum_users table...');
    const { data: users } = await supabase
      .from('forum_users')
      .select('id, username, avatar')
      .limit(3);

    console.log('Sample user data:', JSON.stringify(users, null, 2));

    // 3. Check if queries are fetching custom_avatar
    console.log('\n⚠️  Common Issues:');
    console.log('  1. Queries not selecting custom_avatar from profile_customizations');
    console.log('  2. Components using user.avatar instead of custom_avatar || avatar');
    console.log('  3. Real-time updates not including custom_avatar');
    console.log('  4. getUserAvatar() not being used consistently');

    // 4. Check a specific thread query
    console.log('\n🔍 Testing thread query with author data...');
    const { data: testThread } = await supabase
      .from('threads')
      .select(`
        id, title,
        author:forum_users!threads_author_id_fkey(id, username, avatar, custom_avatar)
      `)
      .limit(1)
      .single();

    if (testThread) {
      console.log('Thread author data:', JSON.stringify(testThread.author, null, 2));
    }

    console.log('\n💡 Recommendations:');
    console.log('  1. Always select custom_avatar in user queries');
    console.log('  2. Use: avatar: custom_avatar || avatar');
    console.log('  3. Use getUserAvatar() helper function consistently');
    console.log('  4. Update real-time subscriptions to include custom_avatar');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAvatarIssues();
