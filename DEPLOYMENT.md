# UCR Housing Platform Deployment Guide

## Environment Variables You Need

### Backend (.env file):

```bash
# Server stuff
PORT=3001

# Database (use MongoDB Atlas for production - local won't work on servers)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ucrhousing

# Auth secret (make this random and long)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Where your frontend will be hosted
FRONTEND_URL=https://your-frontend-app.vercel.app
```

## Best Deployment Options

### Option 1: Railway (easiest if you're broke like me)

1. **Get your code ready:**

   ```bash
   git add .
   git commit -m "ready to deploy this thing"
   git push origin main
   ```

2. **Deploy the backend:**

   ```bash
   cd backend
   railway login
   railway new
   railway add --database mongodb
   railway deploy
   ```

3. **Set up environment variables:**

   - Go to Railway dashboard (it's pretty intuitive)
   - Set: `JWT_SECRET`, `FRONTEND_URL`
   - MongoDB URI gets set automatically

4. **Deploy the frontend:**
   ```bash
   cd ../frontend
   # Update API URL in src/services/api.js to your Railway backend URL
   npm run build
   # Deploy to Vercel or Netlify (both have free tiers)
   ```

### Option 2: Split it up

#### Backend: Railway or Render

#### Frontend: Vercel or Netlify

#### Database: MongoDB Atlas (free tier is solid)

## Things to check before deploying

- [ ] Backend has `start` script in package.json (should be there now)
- [ ] CORS won't block your frontend (configured for production)
- [ ] All environment variables are set
- [ ] Database is accessible from wherever you're hosting
- [ ] Frontend knows where to find your backend API
- [ ] JWT secret is actually secret (don't use "password123")

## Commands you'll need

```bash
# Install Railway CLI
npm install -g @railway/cli

# Install Vercel CLI for frontend
npm install -g vercel

# For MongoDB Atlas
# Just go to https://cloud.mongodb.com and follow their setup
# Get the connection string and put it in your env vars
```

## Domain stuff

1. **Backend**: Railway gives you a domain automatically
2. **Frontend**: Vercel/Netlify also give you domains
3. **Custom Domain**: You can configure your own domain in the dashboards if you have one

## Security stuff (important don't skip)

- Use MongoDB Atlas in production (local database won't work on deployed servers)
- Make your JWT secret actually secure (use a password generator)
- HTTPS is handled automatically by hosting platforms
- Double check your CORS settings work with your actual domain
 