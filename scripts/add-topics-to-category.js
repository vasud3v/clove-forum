/**
 * Add topics to a specific category
 * Usage: node scripts/add-topics-to-category.js <category-name> <topic1> <topic2> ...
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

async function addTopicsToCategory() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/add-topics-to-category.js <category-name> <topic1> <topic2> ...');
    console.log('\nExample:');
    console.log('  node scripts/add-topics-to-category.js "General Discussion" "Announcements" "Questions" "Showcase"');
    process.exit(1);
  }

  const categoryName = args[0];
  const topicNames = args.slice(1);

  console.log(`🔍 Looking for category: "${categoryName}"\n`);

  try {
    // Find the category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', categoryName)
      .maybeSingle();

    if (catError) throw catError;

    if (!category) {
      console.error(`❌ Category "${categoryName}" not found`);
      console.log('\n📁 Available categories:');
      
      const { data: allCategories } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      allCategories?.forEach(cat => {
        console.log(`   - ${cat.name}`);
      });
      
      process.exit(1);
    }

    console.log(`✅ Found category: ${category.name} (${category.id})\n`);

    // Check existing topics
    const { data: existingTopics } = await supabase
      .from('topics')
      .select('name')
      .eq('category_id', category.id);

    if (existingTopics && existingTopics.length > 0) {
      console.log('📊 Existing topics:');
      existingTopics.forEach(topic => {
        console.log(`   - ${topic.name}`);
      });
      console.log('');
    }

    // Create new topics
    console.log(`📝 Creating ${topicNames.length} new topics...\n`);

    const topicsToCreate = topicNames.map(name => ({
      id: `topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      description: `Discussions about ${name.trim()}`,
      category_id: category.id,
      thread_count: 0,
      post_count: 0,
      last_activity: new Date().toISOString(),
    }));

    const { data: created, error: insertError } = await supabase
      .from('topics')
      .insert(topicsToCreate)
      .select();

    if (insertError) {
      console.error('❌ Error creating topics:', insertError);
      process.exit(1);
    }

    console.log(`✅ Successfully created ${created.length} topics!\n`);

    // Show final state
    const { data: allTopics } = await supabase
      .from('topics')
      .select('name')
      .eq('category_id', category.id)
      .order('name');

    console.log(`📊 All topics in "${category.name}":`);
    allTopics?.forEach(topic => {
      console.log(`   ✓ ${topic.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTopicsToCategory();
