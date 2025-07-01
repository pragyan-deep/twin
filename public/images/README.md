# Profile Images

## How to add your profile picture:

1. Place your profile image in this folder (`public/images/`)
2. Name it `profile-avatar.jpg` (or update the path in `src/app/lib/config/userProfile.ts`)
3. Recommended image specifications:
   - Size: 200x200px to 800x800px (square ratio)
   - Format: JPG, PNG, or WebP
   - File size: Under 1MB for best performance

## Example file names:
- `profile-avatar.jpg` (default)
- `my-photo.png`
- `headshot.jpeg`

## Current Configuration:
The app is currently configured to look for: `/images/profile-avatar.jpg`

To change this, edit the `avatar` field in `src/app/lib/config/userProfile.ts` 