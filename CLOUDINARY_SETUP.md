# Cloudinary Photo Upload Setup

## Overview
The application now uses Cloudinary for photo uploads instead of manual URL entry. Photos are automatically optimized and served via CDN.

## Setup Instructions

### 1. Create a Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Once logged in, go to your Dashboard
4. Copy your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. Add Environment Variables

Add these to your backend `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. For Railway Deployment

1. Go to your Railway project
2. Navigate to your backend service
3. Go to **Variables** tab
4. Add the three Cloudinary environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### 4. Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth/month
- Image optimization
- Automatic format conversion
- CDN delivery

This should be more than enough for a student housing platform!

## How It Works

1. **User selects photos** in the listing form
2. **Files are uploaded** to `/api/upload/photos` endpoint
3. **Backend uploads to Cloudinary** with automatic optimization
4. **Cloudinary URLs are returned** and stored in MongoDB
5. **Photos are displayed** from Cloudinary CDN

## Features

- ✅ Multiple photo upload (up to 10 at once)
- ✅ Automatic image optimization
- ✅ Format conversion (WebP when supported)
- ✅ Size limits enforced (5MB per file)
- ✅ File type validation (JPEG, PNG, WebP only)
- ✅ Secure uploads (requires authentication)

## Troubleshooting

### Upload fails
- Check that all three Cloudinary environment variables are set
- Verify your Cloudinary account is active
- Check file size (must be under 5MB)
- Ensure file type is JPEG, PNG, or WebP

### Photos not displaying
- Check browser console for errors
- Verify Cloudinary URLs are being saved correctly
- Check network tab to see if images are loading from Cloudinary CDN

