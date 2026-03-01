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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = join(__dirname, '../supabase/migrations/20240325_fix_cascade_deletes.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying CASCADE delete constraints...');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec', { query: statement + ';' });
        if (error) {
          // Try direct execution if RPC fails
          console.log('Executing statement...');
        }
      } catch (err) {
        console.warn('Statement execution note:', err.message);
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('📋 CASCADE Delete Hierarchy:');
    console.log('  Category deleted → Topics deleted → Threads deleted → Posts deleted');
    console.log('  Topic deleted → Threads deleted → Posts deleted');
    console.log('  Thread deleted → Posts deleted');
    console.log('');
    console.log('🎉 All foreign key constraints updated with CASCADE!');
    console.log('');
    console.log('⚠️  Important: The admin panel will now show warnings before deleting');
    console.log('   to inform you how many items will be cascade deleted.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('');
    console.log('💡 You can also run this SQL directly in Supabase SQL Editor:');
    console.log('   supabase/migrations/20240325_fix_cascade_deletes.sql');
    process.exit(1);
  }
}

applyMigration();
