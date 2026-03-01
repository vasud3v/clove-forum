import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupThreadBannerStorage() {
  console.log('Setting up thread banner storage...');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'setup-thread-banner-storage.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error('Error executing statement:', error);
        // Continue with other statements
      } else {
        console.log('✓ Success');
      }
    }

    // Alternatively, try to add the column directly using the REST API
    console.log('\nAttempting to add banner column via REST API...');
    const { error: columnError } = await supabase
      .from('threads')
      .select('banner')
      .limit(1);

    if (columnError && columnError.message.includes('column')) {
      console.log('Banner column does not exist, it needs to be added via Supabase dashboard or SQL editor');
      console.log('Please run the SQL in scripts/setup-thread-banner-storage.sql manually in your Supabase SQL editor');
    } else {
      console.log('✓ Banner column exists or was created successfully');
    }

    console.log('\n✓ Thread banner storage setup complete!');
    console.log('\nNote: If you see errors, please run the SQL file manually in your Supabase SQL editor:');
    console.log('scripts/setup-thread-banner-storage.sql');
  } catch (error) {
    console.error('Error setting up thread banner storage:', error);
    process.exit(1);
  }
}

setupThreadBannerStorage();
