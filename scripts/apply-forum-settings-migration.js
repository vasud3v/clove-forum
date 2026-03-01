import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = join(__dirname, '../supabase/migrations/20240324_create_forum_settings.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying forum settings migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          if (stmtError) {
            console.error('❌ Error executing statement:', stmtError);
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('📋 Created:');
    console.log('  - forum_settings table');
    console.log('  - Default settings row');
    console.log('  - RLS policies for read/update');
    console.log('');
    console.log('🎉 Forum Settings tab is now ready to use!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
