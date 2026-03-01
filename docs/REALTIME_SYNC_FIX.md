# Real-Time Data Synchronization Fix

## Problem

The forum was showing incorrect data in multiple places because cached counts (stored in database columns) were not being updated automatically when data changed. This caused:

- Category thread/post counts showing wrong numbers
- Topic thread/post counts being out of sync
- User post counts not updating
- Thread reply counts being incorrect

## Root Cause

The application uses **denormalized counts** (cached values) for performance:
- `categories.thread_count` and `categories.post_count`
- `topics.thread_count` and `topics.post_count`
- `forum_users.post_count`
- `threads.reply_count`

These counts were supposed to be updated by **database triggers**, but the triggers were either:
1. Not applied to the database
2. Missing or incomplete
3. Not working correctly

## Solution

### 1. Database Triggers (Automatic Updates)

Apply the SQL triggers that automatically update counts when data changes:

```bash
# Run this SQL file in your Supabase SQL Editor
scripts/apply-realtime-triggers.sql
```

This creates triggers for:
- **Category counts**: Auto-update when threads/posts are added/removed
- **Topic counts**: Auto-update when threads/posts are added/removed
- **User post counts**: Auto-update when posts are created/deleted
- **Thread reply counts**: Auto-update when posts are added/removed

### 2. Fix Existing Data

Run the fix script to correct all existing count discrepancies:

```bash
node scripts/fix-all-counts.js
```

This script:
- Recalculates all category counts based on actual data
- Fixes all topic counts
- Updates user post counts
- Corrects thread reply counts

### 3. Check for Issues

Run the diagnostic script to check if everything is in sync:

```bash
node scripts/check-realtime-sync.js
```

This will report any discrepancies between stored counts and actual data.

## How It Works

### Before (Manual Updates)
```
User creates post → Post inserted → Counts stay the same ❌
```

### After (Automatic Updates)
```
User creates post → Post inserted → Trigger fires → Counts updated ✅
```

## Frontend Real-Time Updates

The frontend also subscribes to real-time changes via Supabase Realtime:

**Location**: `src/hooks/forum/useRealtimeOptimized.ts`

**What it listens to**:
- Category updates (including count changes)
- Thread updates (including reply counts)
- Post insertions/deletions
- User profile updates
- Vote changes
- Reaction changes

**How it works**:
1. Database trigger updates the count
2. Supabase broadcasts the change
3. Frontend receives the update
4. UI updates automatically

## Maintenance

### Regular Checks

Run the check script periodically to ensure counts stay in sync:

```bash
node scripts/check-realtime-sync.js
```

### If Counts Get Out of Sync

If you notice incorrect counts, run the fix script:

```bash
node scripts/fix-all-counts.js
```

### Verify Triggers Are Active

Check in Supabase SQL Editor:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%update%count%'
ORDER BY event_object_table, trigger_name;
```

You should see:
- `trigger_update_category_thread_count` on `threads`
- `trigger_update_category_post_count` on `posts`
- `trigger_update_topic_thread_count` on `threads`
- `trigger_update_topic_post_count` on `posts`
- `trigger_update_user_post_count` on `posts`
- `trigger_update_thread_reply_count` on `posts`

## Files Created

1. **scripts/check-realtime-sync.js** - Diagnostic tool to check for sync issues
2. **scripts/fix-all-counts.js** - Fix all count discrepancies
3. **scripts/fix-category-counts.js** - Fix only category counts
4. **scripts/apply-realtime-triggers.sql** - SQL to create all triggers

## Testing

After applying the fixes:

1. Create a new thread → Check category/topic counts update
2. Add a post → Check thread reply count updates
3. Delete a post → Check counts decrement correctly
4. Check the frontend updates in real-time

## Common Issues

### Triggers Not Firing

**Symptom**: Counts don't update after creating/deleting content

**Solution**: 
1. Check if triggers exist (see "Verify Triggers Are Active" above)
2. Re-apply the triggers: Run `apply-realtime-triggers.sql`

### Frontend Not Updating

**Symptom**: Database counts are correct but UI doesn't update

**Solution**:
1. Check browser console for WebSocket errors
2. Verify Supabase Realtime is enabled in your project
3. Check the realtime subscription in `useRealtimeOptimized.ts`

### Counts Still Wrong After Fix

**Symptom**: Running fix script doesn't correct the counts

**Solution**:
1. Check for database errors in the script output
2. Verify RLS policies allow updates to count columns
3. Run the check script to see specific issues

## Performance Notes

- Triggers add minimal overhead (< 1ms per operation)
- Denormalized counts are much faster than counting on every query
- Real-time updates use WebSockets, not polling
- Batch processing prevents UI thrashing from rapid updates

## Future Improvements

1. Add a cron job to periodically verify counts
2. Create an admin dashboard to monitor sync health
3. Add alerts when counts drift beyond threshold
4. Implement automatic self-healing for count discrepancies
