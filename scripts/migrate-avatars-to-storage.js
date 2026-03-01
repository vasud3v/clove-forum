/**
 * Migrate Base64 Avatars to ImgBB
 * 
 * This script finds all users with base64 data URL avatars
 * and migrates them to ImgBB permanent storage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const IMGBB_API_KEY = process.env.VITE_IMGBB_API_KEY;

if (!IMGBB_API_KEY) {
  console.error('❌ Error: VITE_IMGBB_API_KEY not found in .env.local');
  console.log('\nPlease add your ImgBB API key to .env.local:');
  console.log('VITE_IMGBB_API_KEY=your_api_key_here');
  console.log('\nGet your API key from: https://api.imgbb.com/');
  process.exit(1);
}

async function uploadToImgBB(dataUrl, name) {
  try {
    // Extract base64 from data URL
    const base64Image = dataUrl.split(',')[1];
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('image', base64Image);
    formData.append('name', name);
    
    // Upload to ImgBB
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Upload failed');
    }
    
    return data.data.url;
  } catch (error) {
    console.error(`Error uploading to ImgBB:`, error.message);
    return null;
  }
}

async function migrateAvatars() {
  console.log('\n🔄 Migrating Base64 Avatars to ImgBB...\n');

  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('forum_users')
      .select('id, username, avatar, banner');

    if (error) throw error;

    console.log(`Found ${users.length} users\n`);

    let avatarsMigrated = 0;
    let bannersMigrated = 0;
    let errors = 0;

    for (const user of users) {
      console.log(`Processing user: ${user.username} (${user.id})`);

      // Check avatar
      if (user.avatar && user.avatar.startsWith('data:')) {
        console.log('  📸 Migrating avatar (base64 data URL)...');
        const timestamp = Date.now();
        const imageName = `${user.id}-avatar-${timestamp}`;
        const publicUrl = await uploadToImgBB(user.avatar, imageName);
        
        if (publicUrl) {
          const { error: updateError } = await supabase
            .from('forum_users')
            .update({ avatar: publicUrl })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('  ❌ Failed to update avatar:', updateError.message);
            errors++;
          } else {
            console.log(`  ✅ Avatar migrated: ${publicUrl}`);
            avatarsMigrated++;
          }
        } else {
          errors++;
        }
      } else if (user.avatar) {
        console.log('  ℹ️  Avatar already using URL (no migration needed)');
      } else {
        console.log('  ℹ️  No avatar set');
      }

      // Check banner
      if (user.banner && user.banner.startsWith('data:')) {
        console.log('  🖼️  Migrating banner (base64 data URL)...');
        const timestamp = Date.now();
        const imageName = `${user.id}-banner-${timestamp}`;
        const publicUrl = await uploadToImgBB(user.banner, imageName);
        
        if (publicUrl) {
          const { error: updateError } = await supabase
            .from('forum_users')
            .update({ banner: publicUrl })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('  ❌ Failed to update banner:', updateError.message);
            errors++;
          } else {
            console.log(`  ✅ Banner migrated: ${publicUrl}`);
            bannersMigrated++;
          }
        } else {
          errors++;
        }
      } else if (user.banner) {
        console.log('  ℹ️  Banner already using URL (no migration needed)');
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('Migration Summary:');
    console.log(`  Avatars migrated: ${avatarsMigrated}`);
    console.log(`  Banners migrated: ${bannersMigrated}`);
    console.log(`  Errors: ${errors}`);
    console.log('═══════════════════════════════════════\n');

    if (errors === 0) {
      console.log('✅ Migration completed successfully!\n');
      console.log('ℹ️  Note: ImgBB images are permanent and cannot be deleted via API.');
      console.log('   Old images will remain accessible but are no longer referenced.\n');
    } else {
      console.log('⚠️  Migration completed with some errors. Check logs above.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateAvatars();
