# React Error #310 - Infinite Loop Fix

## Problem
The application was experiencing React Error #310: "Maximum update depth exceeded". This error occurs when a component repeatedly calls setState inside useEffect without proper dependencies, causing an infinite render loop.

## Root Cause
The infinite loop was caused by circular dependencies in the `useForumUser` hook:

1. **Realtime updates** → Update `forumUser` state
2. **forumUser changes** → Trigger `currentUser` memo recalculation
3. **currentUser changes** → Trigger callbacks (`updateUserProfile`, `setPageSize`) to recreate
4. **Callbacks recreate** → Trigger components using these callbacks to re-render
5. **Components re-render** → Potentially trigger more updates → **Loop continues**

### Specific Issues:

1. **Page size effect dependency**: Depended on `currentUser.id` which changed whenever `forumUser` changed
2. **updateUserProfile callback**: Depended on `currentUser` and `forumUser`, recreating on every user update
3. **setPageSize callback**: Depended on `currentUser.id`, recreating on every user update
4. **Realtime handler**: Updated state even when no actual changes occurred

## Solution

### 1. Stabilized Dependencies
Changed all dependencies from `currentUser` (which is a derived/memoized value) to `authUserId` (which is stable):

```typescript
// Before
useEffect(() => {
  // ...
}, [isAuthenticated, currentUser?.id]);

// After
useEffect(() => {
  // ...
}, [isAuthenticated, authUserId]);
```

### 2. Added Change Detection
The realtime update handler now checks if data actually changed before updating state:

```typescript
setForumUser(prev => {
  if (!prev) return newData;
  
  const hasChanges = 
    prev.username !== data.username ||
    prev.avatar !== data.avatar ||
    // ... other fields
  
  if (!hasChanges) {
    console.log('[useForumUser] No changes detected, skipping update');
    return prev; // Return same reference to prevent re-render
  }
  
  return newData;
});
```

### 3. Used Functional setState
Changed from direct state access to functional setState to avoid stale closures:

```typescript
// Before
setForumUser({
  ...forumUser,
  avatar: updates.avatar
});

// After
setForumUser(prev => {
  if (prev && prev.id === userId) {
    return {
      ...prev,
      avatar: updates.avatar
    };
  }
  return prev;
});
```

### 4. Removed Unstable Dependencies from Callbacks
```typescript
// Before
const updateUserProfile = useCallback(async (userId, updates) => {
  if (userId !== currentUser.id) return; // currentUser changes frequently
  // ...
}, [isAuthenticated, currentUser, forumUser]); // Recreates often

// After
const updateUserProfile = useCallback(async (userId, updates) => {
  if (userId !== authUserId) return; // authUserId is stable
  // ...
}, [isAuthenticated, authUserId]); // Only recreates on auth change
```

## Changes Made

### Files Modified:
- `src/hooks/forum/useForumUser.ts`

### Specific Changes:
1. Page size effect now depends on `authUserId` instead of `currentUser.id`
2. `updateUserProfile` callback depends on `authUserId` instead of `currentUser` and `forumUser`
3. `setPageSize` callback depends on `authUserId` instead of `currentUser.id`
4. Realtime update handler uses change detection to prevent unnecessary updates
5. All state updates use functional setState pattern

## Testing

### Before Fix:
- Console showed repeated "[useForumUser] Received realtime update" messages
- React Error #310 appeared in console
- Application could become unresponsive
- Infinite render loop

### After Fix:
- Realtime updates work correctly
- No infinite loops
- No React Error #310
- Stable performance
- Updates only occur when data actually changes

## Prevention

To prevent similar issues in the future:

1. **Use stable dependencies**: Prefer primitive values (IDs, booleans) over objects in useEffect/useCallback dependencies
2. **Add change detection**: Check if state actually changed before updating
3. **Use functional setState**: Access previous state through the updater function
4. **Avoid derived values in dependencies**: Don't use memoized/computed values as dependencies if they change frequently
5. **Monitor console logs**: Watch for repeated log messages indicating loops

## Verification

To verify the fix is working:

1. Open browser console (F12)
2. Navigate to any page
3. Check for "[useForumUser]" log messages
4. Should see:
   - ✅ "Found existing forum_users record" (once on load)
   - ✅ "Received realtime update" (only when actual changes occur)
   - ✅ "No changes detected, skipping update" (when redundant updates arrive)
   - ❌ No React Error #310
   - ❌ No repeated/infinite log messages

## Related Issues

This fix also improves:
- Performance (fewer unnecessary re-renders)
- Memory usage (fewer object allocations)
- Realtime update efficiency
- Overall application stability
