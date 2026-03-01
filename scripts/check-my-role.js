// ============================================================================
// Check Current User Role
// ============================================================================
// This script checks your current user's role and optionally promotes to admin

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRole() {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please log in first.');
      console.log('💡 Log in to your app, then run this script again.');
      process.exit(1);
    }

    console.log('✅ Authenticated as:', user.email);
    console.log('👤 User ID:', user.id);

    // Get forum user data
    const { data: forumUser, error: forumError } = await supabase
      .from('forum_users')
      .select('id, username, role, is_online')
      .eq('id', user.id)
      .single();

    if (forumError) {
      console.error('❌ Error fetching forum user:', forumError.message);
      process.exit(1);
    }

    if (!forumUser) {
      console.error('❌ Forum user profile not found');
      console.log('💡 Try logging out and back in to create your profile');
      process.exit(1);
    }

    console.log('\n📋 Your Forum Profile:');
    console.log('   Username:', forumUser.username);
    console.log('   Role:', forumUser.role);
    console.log('   Online:', forumUser.is_online);

    if (forumUser.role === 'admin' || forumUser.role === 'super_moderator') {
      console.log('\n✅ You have admin privileges! You can manage categories.');
    } else {
      console.log('\n⚠️  You are not an admin. Current role:', forumUser.role);
      console.log('\n📝 To fix the categories RLS error, you have 2 options:');
      console.log('\n   Option 1: Run the SQL script to relax RLS (development only)');
      console.log('   → Copy scripts/fix-categories-rls.sql');
      console.log('   → Paste in Supabase Dashboard → SQL Editor → Run');
      console.log('\n   Option 2: Make yourself admin (requires service role key)');
      console.log('   → Add SUPABASE_SERVICE_ROLE_KEY to .env.local');
      console.log('   → Run: node scripts/make-user-admin.js', user.email);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRole();
