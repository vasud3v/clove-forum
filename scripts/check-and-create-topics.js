/**
 * Check if topics exist in the database and create default ones if needed
 */

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

async function checkAndCreateTopics() {
  console.log('🔍 Checking topics in database...\n');

  try {
    // 1. Get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (catError) throw catError;

    if (!categories || categories.length === 0) {
      console.log('⚠️  No categories found. Please create categories first.');
      return;
    }

    console.log(`✅ Found ${categories.length} categories\n`);

    // 2. Check topics for each category
    const { data: existingTopics, error: topicsError } = await supabase
      .from('topics')
      .select('id, name, category_id');

    if (topicsError) throw topicsError;

    console.log(`📊 Current topics: ${existingTopics?.length || 0}\n`);

    // Group topics by category
    const topicsByCategory = {};
    existingTopics?.forEach(topic => {
      if (!topicsByCategory[topic.category_id]) {
        topicsByCategory[topic.category_id] = [];
      }
      topicsByCategory[topic.category_id].push(topic);
    });

    // Display current state
    for (const cat of categories) {
      const topics = topicsByCategory[cat.id] || [];
      console.log(`📁 ${cat.name} (${cat.id})`);
      if (topics.length > 0) {
        topics.forEach(topic => {
          console.log(`   ✓ ${topic.name}`);
        });
      } else {
        console.log(`   ⚠️  No topics`);
      }
      console.log('');
    }

    // 3. Ask if user wants to create default topics
    console.log('\n💡 Would you like to create default topics for categories without them?');
    console.log('   This will create 2-3 general topics for each category.\n');

    // For automation, we'll create them automatically
    const categoriesToPopulate = categories.filter(cat => !topicsByCategory[cat.id] || topicsByCategory[cat.id].length === 0);

    if (categoriesToPopulate.length === 0) {
      console.log('✅ All categories have topics!');
      return;
    }

    console.log(`📝 Creating default topics for ${categoriesToPopulate.length} categories...\n`);

    const topicsToCreate = [];

    for (const cat of categoriesToPopulate) {
      // Create 2-3 default topics based on category name
      const defaultTopics = [
        {
          id: `topic-${cat.id}-general`,
          name: 'General Discussion',
          description: `General discussions about ${cat.name}`,
          category_id: cat.id,
          thread_count: 0,
          post_count: 0,
          last_activity: new Date().toISOString(),
        },
        {
          id: `topic-${cat.id}-questions`,
          name: 'Questions & Help',
          description: `Ask questions and get help with ${cat.name}`,
          category_id: cat.id,
          thread_count: 0,
          post_count: 0,
          last_activity: new Date().toISOString(),
        },
        {
          id: `topic-${cat.id}-showcase`,
          name: 'Showcase',
          description: `Share your work and projects related to ${cat.name}`,
          category_id: cat.id,
          thread_count: 0,
          post_count: 0,
          last_activity: new Date().toISOString(),
        },
      ];

      topicsToCreate.push(...defaultTopics);
      console.log(`   ✓ Prepared 3 topics for "${cat.name}"`);
    }

    // Insert all topics
    const { data: created, error: insertError } = await supabase
      .from('topics')
      .insert(topicsToCreate)
      .select();

    if (insertError) {
      console.error('❌ Error creating topics:', insertError);
      return;
    }

    console.log(`\n✅ Successfully created ${created.length} topics!`);
    console.log('\n📊 Final state:\n');

    // Show final state
    const { data: finalTopics } = await supabase
      .from('topics')
      .select('id, name, category_id');

    const finalTopicsByCategory = {};
    finalTopics?.forEach(topic => {
      if (!finalTopicsByCategory[topic.category_id]) {
        finalTopicsByCategory[topic.category_id] = [];
      }
      finalTopicsByCategory[topic.category_id].push(topic);
    });

    for (const cat of categories) {
      const topics = finalTopicsByCategory[cat.id] || [];
      console.log(`📁 ${cat.name}`);
      topics.forEach(topic => {
        console.log(`   ✓ ${topic.name}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreateTopics();
