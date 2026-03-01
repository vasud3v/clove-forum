# Avatar Display Issues - Real-Time Sync Fix

## Problem

Avatars are sometimes showing fallback/default avatars instead of custom uploaded avatars. This happens because:

1. **Missing `custom_avatar` in queries** - Many database queries select only `avatar` from `forum_users` but not `custom_avatar` from `profile_customizations`
2. **Inconsistent avatar resolution** - Some components use `user.avatar` directly instead of `custom_avatar || avatar`
3. **Real-time updates missing custom_avatar** - The real-time subscription doesn't always include custom avatar data

## Root Causes

### 1. Database Schema
The avatar system uses two tables:
- `forum_users.avatar` - Default avatar (from Unsplash or generated)
- `profile_customizations.custom_avatar` - User-uploaded custom avatar

Priority: `custom_avatar` > `avatar` > generated avatar

### 2. Query Issues
Many queries like this are missing `custom_avatar`:
```typescript
.select('id, username, avatar, ...')  // ❌ Missing custom_avatar
```

Should be:
```typescript
.select('id, username, avatar, custom_avatar, ...')  // ✅ Includes both
```

### 3. Component Issues
Components using avatar directly:
```typescript
<img src={user.avatar} />  // ❌ Wrong
```

Should use:
```typescript
<img src={getUserAvatar(user.custom_avatar || user.avatar, user.username)} />  // ✅ Correct
```

## Solution

### Step 1: Update Database Queries

All queries fetching user data must include `custom_avatar`:

**File: `src/lib/forumDataFetchersOptimized.ts`**
```typescript
// Already correct - includes custom_avatar
author:forum_users!threads_author_id_fkey(
  id, username, avatar, custom_avatar, banner, custom_banner, ...
)
```

**Files to check:**
- `src/components/forum/AdminDashboard.tsx`
- `src/components/forum/RecentActivityFeed.tsx`
- Any component with `.select()` queries

### Step 2: Update Real-Time Subscriptions

**File: `src/hooks/forum/useRealtimeOptimized.ts`**

The real-time subscription already listens to `forum_users` updates, but we need to ensure it includes custom avatar data from profile_customizations.

### Step 3: Use Helper Functions Consistently

Always use `getUserAvatar()` helper:

```typescript
import { getUserAvatar } from '@/lib/avatar';

// In component
const avatarUrl = getUserAvatar(user.custom_avatar || user.avatar, user.username);
```

Or use `resolveUserAvatar()`:
```typescript
import { resolveUserAvatar } from '@/lib/avatar';

const avatarUrl = resolveUserAvatar({
  custom_avatar: user.custom_avatar,
  avatar: user.avatar,
  username: user.username
});
```

## Files That Need Updates

### High Priority (Direct avatar display)
1. `src/components/forum/AdminDashboard.tsx` - Admin queries
2. `src/components/forum/RecentActivityFeed.tsx` - Activity feed queries
3. `src/components/forum/MembersPage.tsx` - Member list
4. `src/components/forum/Leaderboard.tsx` - Already uses getUserAvatar ✓
5. `src/components/forum/OnlineUsers.tsx` - Already uses getUserAvatar ✓

### Medium Priority (Indirect usage)
6. `src/components/forum/ThreadDetailPage.tsx` - Thread author display
7. `src/components/forum/CategoryThreadsPage.tsx` - Category listings
8. `src/components/forum/TopicThreadsPage.tsx` - Topic listings

### Low Priority (Already correct)
- `src/lib/forumDataFetchersOptimized.ts` ✓
- `src/components/forum/UserProfilePage.tsx` ✓
- `src/components/forum/PostBookmarksPage.tsx` ✓

## Testing Checklist

After applying fixes:

- [ ] Upload a custom avatar
- [ ] Check if it appears in:
  - [ ] Forum header (user menu)
  - [ ] Thread list (author avatar)
  - [ ] Post cards (author avatar)
  - [ ] User profile page
  - [ ] Members page
  - [ ] Leaderboard
  - [ ] Online users list
  - [ ] Recent activity feed
  - [ ] Admin dashboard
- [ ] Refresh the page - avatar should persist
- [ ] Open in incognito - avatar should show for other users
- [ ] Check real-time updates (another user uploads avatar)

## Quick Fix Script

Run this to check which files need updates:

```bash
node scripts/check-avatar-issues.js
```

## Implementation Priority

1. **Immediate**: Update `forumDataFetchersOptimized.ts` queries (if needed)
2. **High**: Update `AdminDashboard.tsx` and `RecentActivityFeed.tsx`
3. **Medium**: Update remaining components
4. **Low**: Add monitoring/logging for avatar resolution

## Common Patterns

### Pattern 1: Direct Query
```typescript
// ❌ Before
const { data } = await supabase
  .from('forum_users')
  .select('id, username, avatar')
  
// ✅ After  
const { data } = await supabase
  .from('forum_users')
  .select('id, username, avatar, custom_avatar')
```

### Pattern 2: Join Query
```typescript
// ❌ Before
author:forum_users!fkey(id, username, avatar)

// ✅ After
author:forum_users!fkey(id, username, avatar, custom_avatar)
```

### Pattern 3: Display
```typescript
// ❌ Before
<img src={user.avatar} alt={user.username} />

// ✅ After
<img src={getUserAvatar(user.custom_avatar || user.avatar, user.username)} alt={user.username} />
```

## Monitoring

Add logging to track avatar resolution:

```typescript
console.log('Avatar resolution:', {
  custom: user.custom_avatar,
  default: user.avatar,
  resolved: getUserAvatar(user.custom_avatar || user.avatar, user.username)
});
```

## Related Files

- `src/lib/avatar.ts` - Avatar utility functions
- `src/hooks/forum/useUserProfileSync.ts` - Profile sync hook
- `src/context/ForumContext.tsx` - Real-time avatar updates
- `src/hooks/forum/useRealtimeOptimized.ts` - Real-time subscriptions

## Notes

- The `getUserAvatar()` function automatically handles fallbacks
- Generated avatars use DiceBear API for consistency
- Avatar cache clears every hour to allow updates
- Custom avatars are stored in Supabase Storage
