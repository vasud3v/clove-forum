/**
 * Check posts for thread t-updates-005
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function checkPosts() {
  const threadId = 't-updates-005';
  
  console.log(`🔍 Checking posts for thread: ${threadId}\n`);

  // Check with anon key (what the app uses)
  console.log('1️⃣ Checking with ANON key (what app uses):');
  const { data: anonPosts, error: anonError } = await supabase
    .from('posts')
    .select('*')
    .eq('thread_id', threadId);

  if (anonError) {
    console.error('❌ Error:', anonError.message);
  } else {
    console.log(`✅ Found ${anonPosts?.length || 0} posts with anon key`);
  }

  // Check with service role key (bypasses RLS)
  if (supabaseAdmin) {
    console.log('\n2️⃣ Checking with SERVICE ROLE key (bypasses RLS):');
    const { data: adminPosts, error: adminError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('thread_id', threadId);

    if (adminError) {
      console.error('❌ Error:', adminError.message);
    } else {
      console.log(`✅ Found ${adminPosts?.length || 0} posts with service role key`);
      if (adminPosts && adminPosts.length > 0) {
        console.log('\nPosts found:');
        adminPosts.forEach((post, idx) => {
          console.log(`  ${idx + 1}. ID: ${post.id}`);
          console.log(`     Content: ${post.content.substring(0, 50)}...`);
          console.log(`     Author: ${post.author_id}`);
        });
      }
    }
  } else {
    console.log('\n⚠️  No service role key found - cannot check with admin access');
  }

  // Check RLS policies
  console.log('\n3️⃣ Checking RLS status:');
  if (supabaseAdmin) {
    const { data: rlsStatus } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'posts')
      .single();
    
    if (rlsStatus) {
      console.log(`RLS enabled on posts table: ${rlsStatus.rowsecurity}`);
    }
  }

  console.log('\n💡 Diagnosis:');
  if (anonPosts?.length === 0 && supabaseAdmin && adminPosts && adminPosts.length > 0) {
    console.log('❌ RLS POLICY ISSUE: Posts exist but are blocked by RLS policies');
    console.log('   The anon key cannot read posts, but they exist in the database');
    console.log('   Need to fix the RLS policies on the posts table');
  } else if (anonPosts?.length === 0) {
    console.log('⚠️  No posts found for this thread');
  } else {
    console.log('✅ Posts are accessible with anon key');
  }
}

checkPosts();
