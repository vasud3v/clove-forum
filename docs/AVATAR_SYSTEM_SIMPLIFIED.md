# Avatar System - Simplified (Industry Standard)

## Overview

The avatar system now follows industry best practices with **ONE avatar field** that gets overwritten when users upload new avatars.

## Database Schema

```sql
CREATE TABLE forum_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',  -- Single avatar field
  banner TEXT,                       -- Single banner field
  -- ... other fields
);
```

## How It Works

### 1. New User Registration
```typescript
// User signs up
const newUser = {
  id: userId,
  username: 'john_doe',
  avatar: generateDefaultAvatar('john_doe'), // Generated avatar URL
  // ... other fields
};
```

### 2. User Uploads Custom Avatar
```typescript
// Upload flow
async function uploadAvatar(userId: string, file: File) {
  // 1. Get current avatar to delete later (if custom)
  const { data: user } = await supabase
    .from('forum_users')
    .select('avatar')
    .eq('id', userId)
    .single();
  
  // 2. Upload new avatar to storage
  const fileName = `${userId}-${Date.now()}.jpg`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);
  
  if (uploadError) throw uploadError;
  
  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
  
  // 4. UPDATE (overwrite) the avatar field
  const { error: updateError } = await supabase
    .from('forum_users')
    .update({ avatar: publicUrl })
    .eq('id', userId);
  
  if (updateError) throw updateError;
  
  // 5. Delete old avatar from storage (if it was custom uploaded)
  if (user?.avatar && user.avatar.includes('supabase')) {
    const oldFileName = user.avatar.split('/').pop();
    await supabase.storage.from('avatars').remove([oldFileName]);
  }
  
  return publicUrl;
}
```

### 3. Display Avatar
```typescript
// Simple - just use the avatar field
<img src={user.avatar} alt={user.username} />

// With fallback for safety
<img 
  src={user.avatar || generateDefaultAvatar(user.username)} 
  alt={user.username} 
/>
```

### 4. Reset to Default Avatar
```typescript
async function resetToDefaultAvatar(userId: string, username: string) {
  // 1. Get current avatar
  const { data: user } = await supabase
    .from('forum_users')
    .select('avatar')
    .eq('id', userId)
    .single();
  
  // 2. Delete custom avatar from storage
  if (user?.avatar && user.avatar.includes('supabase')) {
    const fileName = user.avatar.split('/').pop();
    await supabase.storage.from('avatars').remove([fileName]);
  }
  
  // 3. Set back to generated avatar
  const defaultAvatar = generateDefaultAvatar(username);
  await supabase
    .from('forum_users')
    .update({ avatar: defaultAvatar })
    .eq('id', userId);
}
```

## Database Queries

### Simple and Clean
```typescript
// Fetch user with avatar
const { data } = await supabase
  .from('forum_users')
  .select('id, username, avatar')  // Just one field!
  .eq('id', userId);

// Fetch thread with author avatar
const { data } = await supabase
  .from('threads')
  .select(`
    *,
    author:forum_users!threads_author_id_fkey(
      id, username, avatar  // Just one field!
    )
  `);
```

## Benefits of Single Field Approach

### ✅ Simplicity
- One field to manage
- No priority logic needed
- No confusion about which field to use

### ✅ Performance
- Fewer columns to query
- Simpler indexes
- Faster queries

### ✅ Maintainability
- Less code to maintain
- Easier to understand
- Standard industry practice

### ✅ Storage Management
- Easy to track which avatars to delete
- Clear ownership of files
- Simple cleanup logic

## Migration Path

### Before (Complex)
```typescript
// Had to check multiple fields
const avatarUrl = user.custom_avatar || user.avatar || generateAvatar(user.username);

// Queries needed both fields
.select('avatar, custom_avatar')

// Updates were confusing
UPDATE forum_users SET custom_avatar = ? WHERE id = ?
```

### After (Simple)
```typescript
// Just use the avatar field
const avatarUrl = user.avatar;

// Queries are simple
.select('avatar')

// Updates are clear
UPDATE forum_users SET avatar = ? WHERE id = ?
```

## Real-World Examples

### Reddit
- Single `icon_img` field per user
- Overwritten on upload

### Twitter/X
- Single `profile_image_url` field
- Overwritten on upload

### Discord
- Single `avatar` hash field
- Overwritten on upload

### GitHub
- Single `avatar_url` field
- Overwritten on upload

## Implementation Checklist

- [x] Create migration to consolidate fields
- [ ] Run migration on database
- [ ] Update all queries to use only `avatar` field
- [ ] Remove `custom_avatar` from TypeScript types
- [ ] Update upload logic to overwrite `avatar` field
- [ ] Remove `getUserAvatar()` helper (no longer needed)
- [ ] Update all components to use `user.avatar` directly
- [ ] Test avatar upload flow
- [ ] Test avatar display across all pages
- [ ] Clean up old custom avatar files from storage

## Code Changes Needed

### 1. Remove from Types
```typescript
// src/types/forum.ts
export interface User {
  id: string;
  username: string;
  avatar: string;  // Keep only this
  // customAvatar?: string;  // REMOVE THIS
  // ...
}
```

### 2. Simplify Queries
```typescript
// Before
.select('avatar, custom_avatar')

// After
.select('avatar')
```

### 3. Simplify Display
```typescript
// Before
<img src={getUserAvatar(user.customAvatar || user.avatar, user.username)} />

// After
<img src={user.avatar} />
```

### 4. Update Upload Logic
```typescript
// Just overwrite the avatar field
await supabase
  .from('forum_users')
  .update({ avatar: newAvatarUrl })
  .eq('id', userId);
```

## Summary

The simplified avatar system:
- Uses **ONE field** (`avatar`)
- **Overwrites** on upload (industry standard)
- **Simpler** code and queries
- **Faster** performance
- **Easier** to maintain
- **Standard** practice used by all major platforms

Content was rephrased for compliance with licensing restrictions. Sources: [Stack Overflow discussions on avatar storage](https://stackoverflow.com/questions/20622414/best-way-to-store-users-avatars)
