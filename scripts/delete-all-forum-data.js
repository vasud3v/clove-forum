/**
 * Delete all forum data (categories, topics, threads, posts)
 * WARNING: This will delete ALL forum content!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function deleteAllForumData() {
  console.log('⚠️  WARNING: This will delete ALL forum data!');
  console.log('   - All posts');
  console.log('   - All threads');
  console.log('   - All topics');
  console.log('   - All categories');
  console.log('');
  
  const answer = await askQuestion('Are you sure you want to continue? (type "yes" to confirm): ');
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }

  console.log('\n🗑️  Deleting forum data...\n');

  try {
    // Delete in order: posts -> threads -> topics -> categories
    
    console.log('1️⃣ Deleting posts...');
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (postsError) {
      console.error('❌ Error deleting posts:', postsError.message);
    } else {
      console.log('✅ Posts deleted');
    }

    console.log('\n2️⃣ Deleting threads...');
    const { error: threadsError } = await supabase
      .from('threads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (threadsError) {
      console.error('❌ Error deleting threads:', threadsError.message);
    } else {
      console.log('✅ Threads deleted');
    }

    console.log('\n3️⃣ Deleting topics...');
    const { error: topicsError } = await supabase
      .from('topics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (topicsError) {
      console.error('❌ Error deleting topics:', topicsError.message);
    } else {
      console.log('✅ Topics deleted');
    }

    console.log('\n4️⃣ Deleting categories...');
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (categoriesError) {
      console.error('❌ Error deleting categories:', categoriesError.message);
    } else {
      console.log('✅ Categories deleted');
    }

    console.log('\n✅ All forum data deleted successfully!');
    console.log('\n💡 You can now create fresh categories and topics.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
  }
}

deleteAllForumData();
