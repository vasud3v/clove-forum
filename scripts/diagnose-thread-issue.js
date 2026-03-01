import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseThreadIssue() {
  console.log('🔍 Diagnosing thread creation issue...\n');

  // 1. Check if banner column exists
  console.log('1. Checking threads table structure...');
  const { data: columns, error: columnsError } = await supabase
    .from('threads')
    .select('*')
    .limit(1);
  
  if (columnsError) {
    console.error('❌ Error querying threads:', columnsError.message);
  } else {
    console.log('✓ Threads table is accessible');
    if (columns && columns.length > 0) {
      console.log('  Columns:', Object.keys(columns[0]).join(', '));
    }
  }

  // 2. Check recent threads
  console.log('\n2. Checking recent threads...');
  const { data: recentThreads, error: threadsError } = await supabase
    .from('threads')
    .select('id, title, author_id, category_id, created_at, banner')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (threadsError) {
    console.error('❌ Error fetching threads:', threadsError.message);
  } else {
    console.log(`✓ Found ${recentThreads?.length || 0} recent threads`);
    if (recentThreads && recentThreads.length > 0) {
      recentThreads.forEach(thread => {
        console.log(`  - ${thread.title} (${thread.id}) - Created: ${thread.created_at}`);
      });
    }
  }

  // 3. Try to create a test thread
  console.log('\n3. Testing thread creation...');
  
  // First, get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('⚠️  Not authenticated. Please log in to test thread creation.');
    console.log('   You can skip this test or run it after logging in.');
  } else {
    console.log(`✓ Authenticated as user: ${user.id}`);
    
    // Get user's forum profile
    const { data: forumUser, error: forumUserError } = await supabase
      .from('forum_users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (forumUserError || !forumUser) {
      console.log('⚠️  Forum user profile not found. Creating one...');
      const { error: createUserError } = await supabase
        .from('forum_users')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          email: user.email,
          role: 'member',
        });
      
      if (createUserError) {
        console.error('❌ Failed to create forum user:', createUserError.message);
      } else {
        console.log('✓ Forum user profile created');
      }
    }
    
    // Get a category
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);
    
    if (catError || !categories || categories.length === 0) {
      console.error('❌ No categories found');
    } else {
      const testThreadId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      console.log(`   Creating test thread in category: ${categories[0].name}`);
      
      const { data: newThread, error: createError } = await supabase
        .from('threads')
        .insert({
          id: testThreadId,
          title: 'Test Thread - Diagnostic',
          excerpt: 'This is a test thread created by the diagnostic script',
          author_id: user.id,
          category_id: categories[0].id,
          created_at: now,
          last_reply_at: now,
          last_reply_by_id: user.id,
          tags: ['test'],
          banner: null, // Explicitly set banner to null
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test thread:', createError.message);
        console.error('   Details:', createError);
      } else {
        console.log('✓ Test thread created successfully!');
        console.log(`   Thread ID: ${newThread.id}`);
        
        // Create the first post
        const { error: postError } = await supabase
          .from('posts')
          .insert({
            thread_id: testThreadId,
            content: 'This is a test post created by the diagnostic script',
            author_id: user.id,
            created_at: now,
          });
        
        if (postError) {
          console.error('❌ Failed to create test post:', postError.message);
        } else {
          console.log('✓ Test post created successfully!');
        }
        
        // Verify the thread still exists
        console.log('\n4. Verifying thread persistence...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const { data: verifyThread, error: verifyError } = await supabase
          .from('threads')
          .select('id, title')
          .eq('id', testThreadId)
          .single();
        
        if (verifyError || !verifyThread) {
          console.error('❌ Thread was deleted or not found!');
          console.error('   This indicates a database trigger or policy issue');
        } else {
          console.log('✓ Thread still exists after 1 second');
          
          // Clean up test thread
          console.log('\n5. Cleaning up test thread...');
          const { error: deleteError } = await supabase
            .from('threads')
            .delete()
            .eq('id', testThreadId);
          
          if (deleteError) {
            console.log('⚠️  Could not delete test thread (you may need to delete it manually)');
          } else {
            console.log('✓ Test thread cleaned up');
          }
        }
      }
    }
  }

  console.log('\n✅ Diagnostic complete!');
  console.log('\nIf threads are being deleted automatically, check:');
  console.log('1. Database triggers on the threads table');
  console.log('2. RLS policies that might be blocking SELECT after INSERT');
  console.log('3. Foreign key constraints with CASCADE DELETE');
  console.log('4. Run the check-thread-creation.sql script in your Supabase SQL editor');
}

diagnoseThreadIssue().catch(console.error);
