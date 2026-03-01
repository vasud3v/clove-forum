// ============================================================================
// Make User Admin Script
// ============================================================================
// This script promotes a user to admin role so they can manage categories
// Usage: node scripts/make-user-admin.js <user-email-or-id>

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin(userIdentifier) {
  try {
    console.log(`🔍 Looking for user: ${userIdentifier}`);

    // Try to find user by email or ID
    let userId;
    
    if (userIdentifier.includes('@')) {
      // It's an email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;
      
      const user = authUsers.users.find(u => u.email === userIdentifier);
      if (!user) {
        console.error(`❌ No user found with email: ${userIdentifier}`);
        process.exit(1);
      }
      userId = user.id;
    } else {
      // Assume it's a user ID
      userId = userIdentifier;
    }

    console.log(`👤 Found user ID: ${userId}`);

    // Update user role to admin
    const { data, error } = await supabase
      .from('forum_users')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('✅ User promoted to admin successfully!');
      console.log('User details:', {
        id: data[0].id,
        username: data[0].username,
        role: data[0].role
      });
    } else {
      console.error('❌ User not found in forum_users table');
      console.log('💡 The user may need to log in first to create their forum profile');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get user identifier from command line
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.error('❌ Usage: node scripts/make-user-admin.js <user-email-or-id>');
  console.error('Example: node scripts/make-user-admin.js user@example.com');
  process.exit(1);
}

makeUserAdmin(userIdentifier);
