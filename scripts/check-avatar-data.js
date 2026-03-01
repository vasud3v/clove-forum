/**
 * Check Avatar Data in Database
 * Verify what avatar values are actually stored
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAvatarData() {
  console.log('\n📊 Checking Avatar Data in Database...\n');

  try {
    // Get the testing user
    const { data: users, error } = await supabase
      .from('forum_users')
      .select('id, username, avatar, banner')
      .eq('username', 'testing')
      .limit(5);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found with username "testing"');
      
      // Get all users to see what's there
      const { data: allUsers } = await supabase
        .from('forum_users')
        .select('id, username, avatar')
        .limit(10);
      
      console.log('\n📋 All users in database:');
      allUsers?.forEach(u => {
        console.log(`\n  Username: ${u.username}`);
        console.log(`  ID: ${u.id}`);
        console.log(`  Avatar: ${u.avatar?.substring(0, 80)}${u.avatar?.length > 80 ? '...' : ''}`);
      });
      return;
    }

    console.log('✅ Found user(s):\n');
    users.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`ID: ${user.id}`);
      console.log(`Avatar: ${user.avatar}`);
      console.log(`Banner: ${user.banner || '(none)'}`);
      console.log('');
      
      // Check if it's a generated avatar or custom
      if (user.avatar) {
        if (user.avatar.includes('dicebear.com') || 
            user.avatar.includes('ui-avatars.com') || 
            user.avatar.includes('boringavatars.com')) {
          console.log('  ℹ️  This is a GENERATED avatar (not custom uploaded)');
        } else if (user.avatar.includes('supabase')) {
          console.log('  ✅ This is a CUSTOM uploaded avatar from Supabase Storage');
        } else if (user.avatar.startsWith('http')) {
          console.log('  ℹ️  This is an external URL');
        } else {
          console.log('  ⚠️  Unknown avatar type');
        }
      } else {
        console.log('  ⚠️  No avatar set');
      }
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAvatarData();
