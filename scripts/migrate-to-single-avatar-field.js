/**
 * Migrate to Single Avatar Field System
 * 
 * This script helps transition from the dual-field system (avatar + custom_avatar)
 * to the industry-standard single-field system (just avatar).
 * 
 * What it does:
 * 1. Checks current database state
 * 2. Shows which users have custom avatars
 * 3. Provides migration preview
 * 4. Optionally runs the migration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function analyzeCurrentState() {
  console.log('\n📊 Analyzing current avatar system...\n');

  try {
    // Check if custom_avatar column exists
    const { data: users, error } = await supabase
      .from('forum_users')
      .select('id, username, avatar, custom_avatar, custom_banner')
      .limit(1000);

    if (error) {
      if (error.message.includes('custom_avatar')) {
        console.log('✅ Good news! The custom_avatar column has already been removed.');
        console.log('   Your database is already using the simplified single-field system.\n');
        return { alreadyMigrated: true };
      }
      throw error;
    }

    // Analyze the data
    const totalUsers = users.length;
    const usersWithCustomAvatar = users.filter(u => u.custom_avatar && u.custom_avatar !== '').length;
    const usersWithCustomBanner = users.filter(u => u.custom_banner && u.custom_banner !== '').length;
    const usersWithDefaultOnly = totalUsers - usersWithCustomAvatar;

    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with custom avatars: ${usersWithCustomAvatar}`);
    console.log(`Users with custom banners: ${usersWithCustomBanner}`);
    console.log(`Users with default avatars only: ${usersWithDefaultOnly}\n`);

    if (usersWithCustomAvatar > 0) {
      console.log('📋 Users with custom avatars:');
      users
        .filter(u => u.custom_avatar && u.custom_avatar !== '')
        .slice(0, 10)
        .forEach(u => {
          console.log(`   - ${u.username}`);
          console.log(`     Current: ${u.avatar?.substring(0, 50)}...`);
          console.log(`     Custom:  ${u.custom_avatar?.substring(0, 50)}...`);
        });
      if (usersWithCustomAvatar > 10) {
        console.log(`   ... and ${usersWithCustomAvatar - 10} more`);
      }
      console.log('');
    }

    return {
      alreadyMigrated: false,
      totalUsers,
      usersWithCustomAvatar,
      usersWithCustomBanner,
      users
    };

  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
    throw error;
  }
}

async function previewMigration(users) {
  console.log('\n🔍 Migration Preview:\n');
  console.log('The migration will:');
  console.log('1. Copy custom_avatar to avatar (overwriting default) for users who have custom avatars');
  console.log('2. Copy custom_banner to banner (overwriting default) for users who have custom banners');
  console.log('3. Remove the custom_avatar and custom_banner columns');
  console.log('4. Result: Each user will have ONE avatar field with their current avatar\n');

  const usersToUpdate = users.filter(u => 
    (u.custom_avatar && u.custom_avatar !== '') || 
    (u.custom_banner && u.custom_banner !== '')
  );

  if (usersToUpdate.length > 0) {
    console.log(`📝 ${usersToUpdate.length} users will have their avatars/banners updated:\n`);
    usersToUpdate.slice(0, 5).forEach(u => {
      console.log(`   ${u.username}:`);
      if (u.custom_avatar && u.custom_avatar !== '') {
        console.log(`     avatar: ${u.avatar?.substring(0, 40)}...`);
        console.log(`          -> ${u.custom_avatar?.substring(0, 40)}...`);
      }
      if (u.custom_banner && u.custom_banner !== '') {
        console.log(`     banner: ${u.banner?.substring(0, 40)}...`);
        console.log(`          -> ${u.custom_banner?.substring(0, 40)}...`);
      }
    });
    if (usersToUpdate.length > 5) {
      console.log(`   ... and ${usersToUpdate.length - 5} more\n`);
    }
  }
}

async function runMigration() {
  console.log('\n🚀 Running migration...\n');

  try {
    // Step 1: Update avatars
    console.log('1️⃣ Migrating custom avatars to main avatar field...');
    const { error: avatarError } = await supabase.rpc('migrate_custom_avatars');
    
    if (avatarError) {
      // Fallback to direct SQL if RPC doesn't exist
      const { error: updateError } = await supabase
        .from('forum_users')
        .update({ avatar: supabase.raw('COALESCE(custom_avatar, avatar)') })
        .not('custom_avatar', 'is', null);
      
      if (updateError) throw updateError;
    }
    console.log('   ✅ Avatars migrated\n');

    // Step 2: Update banners
    console.log('2️⃣ Migrating custom banners to main banner field...');
    const { error: bannerError } = await supabase
      .from('forum_users')
      .update({ banner: supabase.raw('COALESCE(custom_banner, banner)') })
      .not('custom_banner', 'is', null);
    
    if (bannerError && !bannerError.message.includes('custom_banner')) {
      throw bannerError;
    }
    console.log('   ✅ Banners migrated\n');

    console.log('✅ Migration completed successfully!\n');
    console.log('⚠️  IMPORTANT: You still need to:');
    console.log('   1. Run the SQL migration to drop the custom_avatar and custom_banner columns');
    console.log('   2. Update your code to remove references to custom_avatar');
    console.log('   3. Update TypeScript types to remove customAvatar field\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Avatar System Migration - Single Field Approach          ║');
  console.log('║  Industry Standard: ONE avatar field that gets overwritten║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Analyze current state
    const analysis = await analyzeCurrentState();

    if (analysis.alreadyMigrated) {
      console.log('✨ Your system is already using the simplified approach!');
      rl.close();
      return;
    }

    // Show preview
    await previewMigration(analysis.users);

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will modify your database!');
    console.log('   Make sure you have a backup before proceeding.\n');
    
    const answer = await question('Do you want to proceed with the migration? (yes/no): ');

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await runMigration();
      console.log('\n🎉 Migration complete! Check the output above for next steps.\n');
    } else {
      console.log('\n❌ Migration cancelled. No changes were made.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
