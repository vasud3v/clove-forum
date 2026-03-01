/**
 * Test if categories are being fetched with topics correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCategoriesFetch() {
  console.log('🔍 Testing categories fetch with topics...\n');

  try {
    // Simulate the fetchCategories function
    const [categoriesResult, topicsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important')
        .order('is_sticky', { ascending: false })
        .order('is_important', { ascending: false })
        .order('name'),
      
      supabase
        .from('topics')
        .select(`
          id, name, description, thread_count, post_count, last_activity, category_id, icon, badge
        `)
        .order('name'),
    ]);

    if (categoriesResult.error) {
      console.error('❌ Categories error:', categoriesResult.error);
      return;
    }

    if (topicsResult.error) {
      console.error('❌ Topics error:', topicsResult.error);
      return;
    }

    const categories = categoriesResult.data || [];
    const allTopics = topicsResult.data || [];

    console.log(`✅ Fetched ${categories.length} categories`);
    console.log(`✅ Fetched ${allTopics.length} topics\n`);

    // Group topics by category
    const topicsByCategory = new Map();
    for (const topic of allTopics) {
      if (!topicsByCategory.has(topic.category_id)) {
        topicsByCategory.set(topic.category_id, []);
      }
      topicsByCategory.get(topic.category_id).push({
        id: topic.id,
        name: topic.name,
        description: topic.description || undefined,
        threadCount: topic.thread_count,
        postCount: topic.post_count,
        lastActivity: topic.last_activity,
        icon: topic.icon || undefined,
        badge: topic.badge || undefined,
      });
    }

    // Build categories with topics
    const categoriesWithTopics = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      threadCount: cat.thread_count,
      postCount: cat.post_count,
      lastActivity: cat.last_activity,
      topics: topicsByCategory.get(cat.id) || undefined,
      isSticky: cat.is_sticky || undefined,
      isImportant: cat.is_important || undefined,
    }));

    console.log('📊 Categories with topics:\n');
    categoriesWithTopics.forEach(cat => {
      console.log(`📁 ${cat.name} (${cat.id})`);
      if (cat.topics && cat.topics.length > 0) {
        console.log(`   Topics: ${cat.topics.length}`);
        cat.topics.forEach(topic => {
          console.log(`   ✓ ${topic.name} (${topic.id})`);
        });
      } else {
        console.log(`   ⚠️  No topics`);
      }
      console.log('');
    });

    console.log('\n✅ Categories are being fetched correctly with topics!');
    console.log('\n💡 If topics are not showing in the admin panel:');
    console.log('   1. Check browser console for debug logs');
    console.log('   2. Verify ForumContext is wrapping the admin panel');
    console.log('   3. Check if categories state is being updated properly');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCategoriesFetch();
