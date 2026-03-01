/**
 * Add Thumbnail to Existing Thread
 * Allows you to add a thumbnail to an existing thread
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

async function addThumbnail() {
  console.log('\n📸 Add Thumbnail to Existing Thread\n');

  try {
    // Get all threads
    const { data: threads, error } = await supabase
      .from('threads')
      .select('id, title, author_id, thumbnail')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!threads || threads.length === 0) {
      console.log('No threads found.');
      rl.close();
      return;
    }

    console.log('Recent threads:\n');
    threads.forEach((thread, index) => {
      console.log(`${index + 1}. ${thread.title}`);
      console.log(`   ID: ${thread.id}`);
      console.log(`   Thumbnail: ${thread.thumbnail || '(none)'}\n`);
    });

    const threadNum = await question('Enter thread number (or thread ID): ');
    
    let selectedThread;
    if (threadNum.includes('-')) {
      // It's a thread ID
      selectedThread = threads.find(t => t.id === threadNum);
    } else {
      // It's a number
      const index = parseInt(threadNum) - 1;
      selectedThread = threads[index];
    }

    if (!selectedThread) {
      console.log('Thread not found.');
      rl.close();
      return;
    }

    console.log(`\nSelected: ${selectedThread.title}`);
    
    const thumbnailUrl = await question('\nEnter thumbnail URL (or press Enter to use author avatar): ');

    let finalUrl = thumbnailUrl.trim();
    
    if (!finalUrl) {
      // Get author's avatar
      const { data: user } = await supabase
        .from('forum_users')
        .select('avatar')
        .eq('id', selectedThread.author_id)
        .single();
      
      finalUrl = user?.avatar || '';
      console.log(`Using author avatar: ${finalUrl}`);
    }

    // Update thread
    const { error: updateError } = await supabase
      .from('threads')
      .update({ thumbnail: finalUrl })
      .eq('id', selectedThread.id);

    if (updateError) throw updateError;

    console.log('\n✅ Thumbnail updated successfully!');
    console.log(`   Thread: ${selectedThread.title}`);
    console.log(`   Thumbnail: ${finalUrl}\n`);
    console.log('Refresh your browser to see the changes.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

addThumbnail();
