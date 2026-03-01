/**
 * Check Thread Thumbnails
 * Verify that threads have thumbnails stored correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkThreadThumbnails() {
  console.log('\n🔍 Checking Thread Thumbnails\n');

  try {
    // Get all threads with their thumbnails
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        id,
        title,
        thumbnail,
        banner,
        author:forum_users!threads_author_id_fkey(username, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!threads || threads.length === 0) {
      console.log('❌ No threads found.');
      return;
    }

    console.log(`Found ${threads.length} recent threads:\n`);

    threads.forEach((thread, index) => {
      const author = Array.isArray(thread.author) ? thread.author[0] : thread.author;
      
      console.log(`${index + 1}. ${thread.title}`);
      console.log(`   ID: ${thread.id}`);
      console.log(`   Author: ${author.username}`);
      console.log(`   Author Avatar: ${author.avatar}`);
      console.log(`   Thread Thumbnail: ${thread.thumbnail || '❌ NOT SET'}`);
      console.log(`   Thread Banner: ${thread.banner || '❌ NOT SET'}`);
      
      if (!thread.thumbnail) {
        console.log(`   ⚠️  This thread will show author avatar as fallback`);
      } else if (thread.thumbnail.includes('imgbb.com') || thread.thumbnail.includes('ibb.co')) {
        console.log(`   ✅ Thumbnail is on ImgBB`);
      } else {
        console.log(`   ⚠️  Thumbnail is NOT on ImgBB: ${thread.thumbnail.substring(0, 50)}...`);
      }
      
      console.log('');
    });

    // Count threads with/without thumbnails
    const withThumbnails = threads.filter(t => t.thumbnail).length;
    const withoutThumbnails = threads.length - withThumbnails;

    console.log('\n📊 Summary:');
    console.log(`   Total threads: ${threads.length}`);
    console.log(`   With thumbnails: ${withThumbnails}`);
    console.log(`   Without thumbnails: ${withoutThumbnails}`);
    console.log(`   Threads without thumbnails will show author avatar as fallback\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkThreadThumbnails();
