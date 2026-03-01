Write-Host "Fixing avatar system..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Where-Object { $_.FullName -notlike "*node_modules*" }

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    $content = $content -replace ', custom_avatar', ''
    $content = $content -replace 'custom_avatar, ', ''
    $content = $content -replace ', custom_banner', ''
    $content = $content -replace 'custom_banner, ', ''
    $content = $content -replace '\.custom_avatar \|\| \.avatar', '.avatar'
    $content = $content -replace 'user\.custom_avatar \|\| user\.avatar', 'user.avatar'
    $content = $content -replace 'getUserAvatar\([^)]+\)', 'user.avatar'
    $content = $content -replace 'customAvatar\?: string;', ''
    $content = $content -replace 'customAvatar: [^,\}]+,', ''
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
        $count++
    }
}

Write-Host "`nUpdated $count files" -ForegroundColor Cyan
