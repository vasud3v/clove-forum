# Topic Icons

Place your topic icon images in this folder.

## Quick Start - Sample Icons Included

We've included some sample SVG icons you can use right away:
- `sample-icon.svg` - Pink diamond icon
- `general.svg` - Blue document icon
- `announcements.svg` - Orange alert icon
- `support.svg` - Green help icon
- `feedback.svg` - Purple chat icon

To use these in the admin panel:
1. Go to Admin Dashboard → Topics tab
2. Edit a topic
3. Select "URL" mode for icon
4. Enter: `/topic-icons/general.svg` (or any other icon name)
5. Save the topic

## Usage

1. Add your icon image (PNG, JPG, GIF, WebP, SVG) to this folder
2. In the admin panel, use the URL input mode
3. Enter the path: `/topic-icons/your-icon-name.png`

## Recommendations (Following Forum Standards)

**Icon Size:**
- Use SQUARE icons (1:1 aspect ratio) - this is the standard for all major forums
- Recommended sizes: 64x64px, 128x128px, or 256x256px
- Keep file sizes small (under 100KB) for better performance

**Why Square?**
- Matches Discourse, phpBB, and other popular forums
- Displays consistently across all views (lists, filters, headers)
- Looks professional and clean
- Works better in compact spaces

**File Formats:**
- SVG: Best choice - scalable and tiny file size
- PNG: Good for detailed icons with transparency
- JPG: Use for photo-style icons (no transparency)
- WebP: Modern format with great compression

## Alternative: External Hosting

You can also use external image hosting services:
- Imgur: https://imgur.com
- PostImages: https://postimages.org
- Any CDN or image hosting service

Just paste the full URL in the admin panel.

## Creating Custom Icons

You can create custom square icons using:
- Figma (export as SVG)
- Canva (free icon templates)
- Flaticon (download free icons)
- Font Awesome (icon library)
- Noun Project (icon marketplace)

**Tip:** Most icon libraries provide square icons by default!

## Examples

```
/topic-icons/general.svg          ← Local file (square)
/topic-icons/my-icon-64x64.png    ← Your custom square icon
https://i.imgur.com/abc123.png    ← External URL
```

## Display Sizes

Your icons will be displayed at:
- Topic list (main page): 48x48px
- Topic filter buttons: 20x20px  
- Topic detail header: 64x64px
- Admin panel: 48x48px

All sizes maintain aspect ratio and show the full icon without cropping.

