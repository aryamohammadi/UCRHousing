# DormDuos

A housing and roommate platform for UC Riverside students. Find housing, connect with roommates, and discover your perfect living situation near campus.

## What This Is

DormDuos is your go-to platform for UCR student housing and roommate connections. We make it easy to find available rentals and connect with potential roommates who share your lifestyle and preferences.

**Current Features**: Browse and post housing listings with detailed filters
**Coming Soon**: Built-in roommate matching and communication tools

**Important**: This platform connects people in the community - we don't verify landlords or guarantee housing quality. Always do your research and meet in person before making commitments.

## Roommate Search Available Now!

🎯 **Looking for roommates right now?** Join HighlanderHousing's Discord community at https://discord.gg/gqCQDXz4rg

Our full roommate matching feature will be integrated into the website soon!

## Tech Stack

- **Frontend**: React with Vite, Tailwind CSS for styling
- **Backend**: Node.js with Express, JWT authentication
- **Database**: MongoDB with Mongoose
- **Hosting**: Vercel (frontend) and Railway (backend + database)

## Features

### Current

- Browse housing listings with filters (price, bedrooms, location)
- User authentication for landlords to post listings
- Responsive design that works on mobile and desktop
- Search and filter functionality
- Direct contact between students and landlords
- Secure password hashing and input sanitization

### Coming Soon

- **Roommate Matching**: Find compatible roommates based on preferences
- **In-app Messaging**: Chat directly with potential roommates
- **Profile Creation**: Detailed roommate profiles with lifestyle preferences

## Getting Started Locally

### Prerequisites

- Node.js (version 16 or higher)
- MongoDB (either local installation or MongoDB Atlas)
- Git

### Quick Start

1. **Clone and install dependencies**

```bash
git clone https://github.com/your-username/ucrhousing.git
cd ucrhousing
npm run install:all
```

2. **Set up environment variables**
   Create a `.env` file in the backend directory:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ucrhousing
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
```

3. **Start both frontend and backend**

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev
```

The app will be running at `http://localhost:5173`

## Live Demo

🚀 **Visit DormDuos**: https://dormduos.com

- **API Backend**: Hosted on Railway
- **Database**: MongoDB Atlas

## Project Structure

```
ucrhousing/
├── backend/                 # Express.js API server
│   ├── middleware/         # Security, auth, validation
│   ├── models/            # MongoDB schemas (User, Listing)
│   ├── routes/            # API endpoints (auth, listings)
│   └── index.js           # Main server file
├── frontend/               # React application
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # Reusable React components
│       ├── contexts/      # React Context for auth
│       ├── pages/         # Main page components (Home, Listings, Dashboard)
│       └── services/      # API communication
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new landlord
- `POST /api/auth/login` - Login existing user

### Listings

- `GET /api/listings` - Get all listings (with optional filters)
- `GET /api/listings/:id` - Get specific listing
- `POST /api/listings` - Create new listing (auth required)
- `PUT /api/listings/:id` - Update listing (auth required)
- `DELETE /api/listings/:id` - Delete listing (auth required)

### Health

- `GET /api/health` - Health check endpoint

## Security & Performance

- **Security**: Password hashing (bcrypt), JWT authentication, input sanitization, NoSQL injection prevention, CORS configuration, rate limiting
- **Performance**: Request size limiting, efficient MongoDB queries, responsive caching
- **Monitoring**: Health checks, error logging, request monitoring

## Community Partnership

DormDuos is developed **in partnership with HighlanderHousing**, UCR's established housing community.

- **Discord Community**: https://discord.gg/gqCQDXz4rg
- **Current Roommate Search**: Available now through Discord
- **Future Integration**: Roommate features coming to DormDuos platform

## Testing

```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Deployment

### Production Setup

- **Frontend**: Auto-deployed to Vercel via GitHub integration
- **Backend**: Auto-deployed to Railway via GitHub integration
- **Database**: MongoDB Atlas (cloud hosting)
- **Domain**: dormduos.com via Vercel DNS

### Environment Variables (Production)

Required for Railway backend deployment:

```
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secure-random-string
FRONTEND_URL=https://dormduos.com
NODE_ENV=production
```

## Contributing

Built by UCR students, for the UCR community! Contributions welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/roommate-matching`)
3. Commit your changes (`git commit -m 'Add roommate matching algorithm'`)
4. Push to the branch (`git push origin feature/roommate-matching`)
5. Open a Pull Request

## Roadmap

### Phase 1: Housing Platform ✅

- [x] Housing listings and search
- [x] User authentication
- [x] Responsive design
- [x] Production deployment

### Phase 2: Roommate Integration 🚧

- [ ] Roommate profile creation
- [ ] Compatibility matching algorithm
- [ ] In-app messaging system
- [ ] Discord integration migration

### Phase 3: Enhanced Features 📋

- [ ] Image upload for listings
- [ ] User ratings and reviews
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Favorites/bookmarks system

## Support & Community

- **Website**: https://dormduos.com
- **Discord**: https://discord.gg/gqCQDXz4rg (HighlanderHousing community)
- **Issues**: Open a GitHub issue for bugs or feature requests

## Disclaimer

DormDuos facilitates connections between UCR students for housing and roommate purposes. We do not verify users, guarantee housing quality, or take responsibility for agreements made through this platform. Always exercise caution and verify information independently.

## License

Built for the UCR student community. Educational and community use encouraged.

---

**DormDuos** - Find Housing & Connect with Roommates at UC Riverside 🏠✨
