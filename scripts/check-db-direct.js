import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database directly...\n');

  // Check categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('name', 'test');

  console.log('Category "test":', JSON.stringify(categories, null, 2));

  // Check topics
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('name', 'aaaa');

  console.log('\nTopic "aaaa":', JSON.stringify(topics, null, 2));

  // Count actual threads in test category
  if (categories && categories[0]) {
    const { count } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categories[0].id);
    
    console.log(`\nActual threads in test category: ${count}`);
  }

  // Count actual threads in aaaa topic
  if (topics && topics[0]) {
    const { count } = await supabase
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topics[0].id);
    
    console.log(`Actual threads in aaaa topic: ${count}`);
  }
}

checkDatabase();
