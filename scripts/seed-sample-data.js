import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Need: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedSampleData() {
  try {
    console.log('Starting to seed sample data...');

    // Get the first user from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users || users.users.length === 0) {
      console.error('No users found. Please create a user account first by signing up.');
      process.exit(1);
    }

    const user = users.users[0];
    console.log('Using user:', user.email);

    // Check if forum_users record exists, create if not
    const { data: forumUser } = await supabase
      .from('forum_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!forumUser) {
      console.log('Creating forum user record...');
      const { error: createUserError } = await supabase
        .from('forum_users')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          avatar: null,
          join_date: new Date().toISOString(),
          post_count: 0,
          reputation: 0,
          is_online: true,
          rank: 'Newcomer',
          role: 'member'
        });

      if (createUserError) {
        console.error('Error creating forum user:', createUserError);
        process.exit(1);
      }
      console.log('✓ Forum user created');
    }

    // Create a category
    const categoryId = 'cat-' + crypto.randomUUID();
    console.log('Creating category...');
    
    const { error: categoryError } = await supabase
      .from('categories')
      .insert({
        id: categoryId,
        name: 'General Discussion',
        description: 'Talk about anything and everything',
        icon: 'MessageSquare',
        color: 'blue',
        thread_count: 1,
        post_count: 1,
        last_activity: new Date().toISOString(),
        position: 0
      });

    if (categoryError) {
      console.error('Error creating category:', categoryError);
      process.exit(1);
    }
    console.log('✓ Category created:', categoryId);

    // Create a topic
    const topicId = 'topic-' + crypto.randomUUID();
    console.log('Creating topic...');
    
    const { error: topicError } = await supabase
      .from('topics')
      .insert({
        id: topicId,
        category_id: categoryId,
        name: 'Introductions',
        description: 'Introduce yourself to the community',
        icon: '👋',
        thread_count: 1,
        position: 0
      });

    if (topicError) {
      console.error('Error creating topic:', topicError);
      process.exit(1);
    }
    console.log('✓ Topic created:', topicId);

    // Create a thread
    const threadId = 't-' + crypto.randomUUID();
    const now = new Date().toISOString();
    console.log('Creating thread...');
    
    const { error: threadError } = await supabase
      .from('threads')
      .insert({
        id: threadId,
        title: 'Welcome to the Forum!',
        excerpt: 'This is a sample thread to get things started. Feel free to reply and introduce yourself!',
        author_id: user.id,
        category_id: categoryId,
        topic_id: topicId,
        created_at: now,
        last_reply_at: now,
        last_reply_by_id: user.id,
        reply_count: 0,
        view_count: 1,
        is_pinned: true,
        is_locked: false,
        is_hot: false,
        tags: ['welcome', 'introduction'],
        upvotes: 0,
        downvotes: 0
      });

    if (threadError) {
      console.error('Error creating thread:', threadError);
      process.exit(1);
    }
    console.log('✓ Thread created:', threadId);

    // Create a post (first post in thread)
    const postId = 'post-' + crypto.randomUUID();
    console.log('Creating post...');
    
    const { error: postError } = await supabase
      .from('posts')
      .insert({
        id: postId,
        thread_id: threadId,
        content: `# Welcome to the Forum! 🎉

This is a sample thread to help you get started. Here are some things you can do:

- Reply to this thread
- Create your own threads
- Explore different categories
- Customize your profile
- Earn reputation by participating

Feel free to introduce yourself and let us know what brings you here!`,
        author_id: user.id,
        created_at: now,
        upvotes: 0,
        downvotes: 0
      });

    if (postError) {
      console.error('Error creating post:', postError);
      process.exit(1);
    }
    console.log('✓ Post created:', postId);

    console.log('\n✅ Sample data seeded successfully!');
    console.log('\nCreated:');
    console.log('- Category: General Discussion');
    console.log('- Topic: Introductions');
    console.log('- Thread: Welcome to the Forum!');
    console.log('- Post: Welcome message');
    console.log('\nRefresh your browser to see the new content!');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

seedSampleData();
