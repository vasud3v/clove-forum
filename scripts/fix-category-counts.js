import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCategoryCounts() {
  console.log('🔄 Recalculating category counts...\n');

  try {
    // Get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, thread_count, post_count');

    if (catError) throw catError;

    if (!categories || categories.length === 0) {
      console.log('⚠️  No categories found');
      return;
    }

    for (const cat of categories) {
      console.log(`\n📁 Category: ${cat.name} (${cat.id})`);
      console.log(`   Current counts: ${cat.thread_count} threads, ${cat.post_count} posts`);

      // Count actual threads
      const { count: actualThreadCount, error: threadError } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id);

      if (threadError) {
        console.error(`   ❌ Error counting threads:`, threadError);
        continue;
      }

      // Count actual posts (posts in threads that belong to this category)
      const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select('id')
        .eq('category_id', cat.id);

      if (threadsError) {
        console.error(`   ❌ Error fetching threads:`, threadsError);
        continue;
      }

      let actualPostCount = 0;
      if (threads && threads.length > 0) {
        const threadIds = threads.map(t => t.id);
        const { count: postCount, error: postError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', threadIds);

        if (postError) {
          console.error(`   ❌ Error counting posts:`, postError);
          continue;
        }

        actualPostCount = postCount || 0;
      }

      console.log(`   Actual counts: ${actualThreadCount || 0} threads, ${actualPostCount} posts`);

      // Update if different
      if (actualThreadCount !== cat.thread_count || actualPostCount !== cat.post_count) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({
            thread_count: actualThreadCount || 0,
            post_count: actualPostCount
          })
          .eq('id', cat.id);

        if (updateError) {
          console.error(`   ❌ Error updating counts:`, updateError);
        } else {
          console.log(`   ✅ Updated to: ${actualThreadCount || 0} threads, ${actualPostCount} posts`);
        }
      } else {
        console.log(`   ✓ Counts are correct`);
      }
    }

    console.log('\n✅ Category counts recalculation complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCategoryCounts();
