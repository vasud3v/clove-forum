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
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runThreadFix() {
  console.log('🔧 Running thread creation fix...\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'fix-thread-issues-complete.sql');
    console.log(`📄 Reading SQL from: ${sqlPath}\n`);
    
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('⚠️  IMPORTANT: This script needs to be run in your Supabase SQL Editor');
    console.log('   because it contains complex SQL that cannot be executed via the API.\n');
    
    console.log('📋 Please follow these steps:\n');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy the contents of: scripts/fix-thread-issues-complete.sql');
    console.log('5. Paste and run the SQL\n');
    
    console.log('Alternatively, you can copy this SQL directly:\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    
    console.log('\n✅ After running the SQL, your thread creation should work properly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runThreadFix();
