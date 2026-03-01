#!/bin/bash

# Script to remove all custom_avatar and custom_banner references
# and replace with single avatar/banner field

echo "🔧 Removing custom_avatar references from codebase..."

# Files to update
files=(
  "src/components/forum/AdminDashboard.tsx"
  "src/components/forum/AnalyticsDashboard.tsx"
  "src/components/forum/BookmarksPage.tsx"
  "src/components/forum/Leaderboard.tsx"
  "src/components/forum/MembersPage.tsx"
  "src/components/forum/OnlineUsers.tsx"
  "src/components/forum/PostBookmarksPage.tsx"
  "src/components/forum/RecentActivityFeed.tsx"
  "src/components/forum/SearchPage.tsx"
  "src/components/forum/ThreadDetailPage.tsx"
  "src/components/forum/TopicThreadsPage.tsx"
  "src/components/forum/UserProfilePage.tsx"
  "src/components/forum/WatchedThreadsPage.tsx"
  "src/context/ForumContext.tsx"
  "src/hooks/forum/useForumUser.ts"
  "src/hooks/forum/useRealtime.ts"
  "src/hooks/forum/useRealtimeOptimized.ts"
  "src/hooks/forum/useUserProfileSync.ts"
  "src/lib/forumDataFetchers.ts"
  "src/lib/queries.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Remove custom_avatar from SELECT queries
    sed -i 's/, custom_avatar//g' "$file"
    sed -i 's/custom_avatar, //g' "$file"
    sed -i 's/custom_avatar//g' "$file"
    
    # Remove custom_banner from SELECT queries  
    sed -i 's/, custom_banner//g' "$file"
    sed -i 's/custom_banner, //g' "$file"
    sed -i 's/custom_banner//g' "$file"
    
    # Replace priority logic with simple avatar
    sed -i 's/user\.custom_avatar || user\.avatar/user.avatar/g' "$file"
    sed -i 's/\.custom_avatar || \.avatar/.avatar/g' "$file"
    sed -i 's/custom_banner || banner/banner/g' "$file"
    
    echo "  ✓ Updated $file"
  fi
done

echo "✅ All files updated!"
echo ""
echo "Next steps:"
echo "1. Run the database migration"
echo "2. Test the application"
echo "3. Remove profile_customizations table if no longer needed"
