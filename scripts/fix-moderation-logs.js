import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixModerationLogs() {
  console.log('Fixing moderation_logs table...');

  try {
    // Drop the old constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.moderation_logs 
        DROP CONSTRAINT IF EXISTS moderation_logs_target_type_check;
      `
    });

    if (dropError && !dropError.message.includes('does not exist')) {
      console.error('Error dropping constraint:', dropError);
    } else {
      console.log('✓ Old constraint dropped (or didn\'t exist)');
    }

    // Add new constraint with 'topic' included
    const { error: addError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.moderation_logs 
        ADD CONSTRAINT moderation_logs_target_type_check 
        CHECK (target_type IN ('thread', 'post', 'user', 'category', 'report', 'topic'));
      `
    });

    if (addError) {
      console.error('Error adding constraint:', addError);
      
      // Try alternative approach - direct SQL query
      console.log('\nTrying alternative approach...');
      const { error: altError } = await supabase
        .from('moderation_logs')
        .select('id')
        .limit(1);
      
      if (altError) {
        console.error('Table access error:', altError);
      }
      
      throw addError;
    }

    console.log('✓ New constraint added with "topic" support');
    console.log('\n✅ Migration completed successfully!');
    console.log('You can now create/edit/delete topics without errors.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nManual fix: Run this SQL in Supabase SQL Editor:');
    console.log(`
ALTER TABLE public.moderation_logs 
DROP CONSTRAINT IF EXISTS moderation_logs_target_type_check;

ALTER TABLE public.moderation_logs 
ADD CONSTRAINT moderation_logs_target_type_check 
CHECK (target_type IN ('thread', 'post', 'user', 'category', 'report', 'topic'));
    `);
  }
}

fixModerationLogs();
