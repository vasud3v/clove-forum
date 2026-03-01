/**
 * Run Thread Thumbnail Migration
 * Adds thumbnail column to threads table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('\n🔄 Running Thread Thumbnail Migration...\n');

  try {
    // Read the migration file
    const migration = fs.readFileSync('supabase/migrations/20240321_add_thread_thumbnail.sql', 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migration }).single();

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('Trying direct SQL execution...\n');
      
      // Split by semicolon and execute each statement
      const statements = migration
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: execError } = await supabase.rpc('exec', { query: statement });
          if (execError) {
            console.error('Statement error:', statement.substring(0, 100));
            console.error('Error:', execError.message);
          }
        }
      }
    }

    // Verify the column was added
    const { data, error: checkError } = await supabase
      .from('threads')
      .select('id, thumbnail')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('thumbnail')) {
        console.log('⚠️  Migration may have failed. Please run manually in Supabase Dashboard.\n');
        console.log('SQL to run:');
        console.log(migration);
        return;
      }
      throw checkError;
    }

    console.log('✅ Migration completed successfully!');
    console.log('   The thumbnail column has been added to the threads table.\n');
    console.log('📝 Next steps:');
    console.log('   1. Create a new thread with a thumbnail');
    console.log('   2. Or update existing threads with thumbnails\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
    console.log('   Go to: SQL Editor > New Query\n');
    const migration = fs.readFileSync('supabase/migrations/20240321_add_thread_thumbnail.sql', 'utf8');
    console.log(migration);
  }
}

runMigration();
