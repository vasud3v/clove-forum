# PowerShell script to remove all custom_avatar references
# and implement single-field avatar system

Write-Host "🔧 Fixing Avatar System - Removing custom_avatar references..." -ForegroundColor Cyan
Write-Host ""

$files = @(
    "src\components\forum\AdminDashboard.tsx",
    "src\components\forum\AnalyticsDashboard.tsx",
    "src\components\forum\BookmarksPage.tsx",
    "src\components\forum\Leaderboard.tsx",
    "src\components\forum\MembersPage.tsx",
    "src\components\forum\OnlineUsers.tsx",
    "src\components\forum\PostBookmarksPage.tsx",
    "src\components\forum\RecentActivityFeed.tsx",
    "src\components\forum\SearchPage.tsx",
    "src\components\forum\ThreadDetailPage.tsx",
    "src\components\forum\TopicThreadsPage.tsx",
    "src\components\forum\UserProfilePage.tsx",
    "src\components\forum\WatchedThreadsPage.tsx",
    "src\context\ForumContext.tsx",
    "src\hooks\forum\useForumUser.ts",
    "src\hooks\forum\useRealtime.ts",
    "src\hooks\forum\useRealtimeOptimized.ts",
    "src\hooks\forum\useUserProfileSync.ts",
    "src\lib\forumDataFetchers.ts"
)

$totalFiles = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Remove custom_avatar from SELECT queries
        $content = $content -replace ', custom_avatar', ''
        $content = $content -replace 'custom_avatar, ', ''
        
        # Remove custom_banner from SELECT queries
        $content = $content -replace ', custom_banner', ''
        $content = $content -replace 'custom_banner, ', ''
        
        # Replace priority logic patterns
        $content = $content -replace 'user\.custom_avatar \|\| user\.avatar', 'user.avatar'
        $content = $content -replace '\.custom_avatar \|\| \.avatar', '.avatar'
        $content = $content -replace 'custom_banner \|\| banner', 'banner'
        $content = $content -replace 'getUserAvatar\(user\.avatar, user\.username\)', 'user.avatar'
        $content = $content -replace 'getUserAvatar\(member\.avatar, member\.username\)', 'member.avatar'
        $content = $content -replace 'getUserAvatar\(post\.author\.avatar, post\.author\.username\)', 'post.author.avatar'
        $content = $content -replace 'getUserAvatar\(author\.avatar, author\.username\)', 'author.avatar'
        
        # Remove customAvatar field references
        $content = $content -replace 'customAvatar\?: string;', ''
        $content = $content -replace 'customAvatar: [^,\}]+,', ''
        $content = $content -replace '\.customAvatar', '.avatar'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "  ✓ Updated" -ForegroundColor Green
            $totalFiles++
        }
        else {
            Write-Host "  - No changes needed" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Avatar system fix complete!" -ForegroundColor Green
Write-Host "   Files updated: $totalFiles" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run database migration"
Write-Host "2. Test avatar functionality"
