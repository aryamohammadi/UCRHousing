# UCR Housing Platform

A full stack web application for managing student housing listings. The platform provides a RESTful API backend with authentication, CRUD operations, filtering, and pagination capabilities, paired with a React frontend for user interaction.

## Project Overview

The UCR Housing Platform is a production-ready application that enables landlords to create, manage, and publish housing listings while allowing students to search and filter available properties. The backend implements a robust Express.js API with JWT-based authentication, MongoDB data persistence, comprehensive input validation, and error handling. The system handles database connection retries, implements graceful shutdown procedures, and includes middleware for security, CORS, and request sanitization. The frontend consumes the API through a centralized service layer with automatic environment detection and error handling.

## Features

### Authentication
- JWT-based authentication with token expiration
- Password hashing using bcryptjs with 12 salt rounds
- Account activation status checking
- Protected routes with middleware-based authorization

### CRUD Operations
- Create, read, update, and delete listings
- Retrieve listings by ID with automatic view count increment
- Fetch authenticated user's listings
- Toggle listing status between active and inactive

### Filtering and Search
- Filter by price range (minPrice, maxPrice)
- Filter by number of bedrooms and bathrooms
- Filter by amenities array
- Full-text search across title, description, and address fields
- Case-insensitive regex-based search

### Pagination
- Configurable page size (default 20, max 50)
- Page number validation and bounds checking
- Total count and page metadata in responses
- Next and previous page indicators

### Validation and Security
- Mongoose schema-level validation with custom error messages
- Input sanitization middleware blocking MongoDB operator injection
- String input validation and trimming
- ObjectId format validation
- CORS configuration with origin whitelisting
- Security headers (X-Content-Type-Options, X-Frame-Options)
- Content-Type enforcement and fallback handling

### Error Handling
- Centralized error handling middleware
- Database connection state checking with 503 responses
- Mongoose validation error parsing and formatting
- Detailed error responses in development mode
- Network timeout handling with retry logic

## Tech Stack

### Backend
- Node.js (>=18.0.0)
- Express.js 5.1.0
- MongoDB with Mongoose 8.16.5
- JSON Web Tokens (jsonwebtoken 9.0.2)
- bcryptjs 3.0.2 for password hashing
- CORS 2.8.5 for cross-origin resource sharing
- dotenv 17.2.1 for environment variable management

### Frontend
- React 19.1.0
- React Router DOM 7.7.1
- Vite 7.0.4 for build tooling
- Tailwind CSS 3.4.17

### Database
- MongoDB Atlas (production)
- MongoDB Memory Server 10.1.4 (testing)

### Testing
- Jest 29.7.0
- Supertest 7.0.0 for HTTP integration testing
- MongoDB Memory Server for isolated test database

### Deployment
- Railway (backend)
- Vercel (frontend)
- MongoDB Atlas (production database)

## Architecture

The application follows a layered architecture with clear separation of concerns:

### Backend Layers

**Request Flow:**
1. Express server receives HTTP request
2. CORS middleware validates origin
3. Security headers middleware adds protection headers
4. Content-Type normalization middleware handles misconfigured requests
5. Body parsing middleware (express.json, express.urlencoded)
6. Request logging middleware (development)
7. OPTIONS preflight handler for CORS
8. Input sanitization middleware removes dangerous operators
9. Route handlers process business logic
10. Error handling middleware catches and formats errors

**Route Layer:**
- `/api/auth` - Authentication endpoints (register, login, get current user)
- `/api/listings` - Listing CRUD operations and filtering
- `/api/health` - Health check and diagnostic endpoints

**Middleware Layer:**
- `authenticateToken` - JWT verification and landlord lookup
- `sanitizeInput` - Recursive object cleaning to prevent operator injection
- CORS configuration with environment-based origin whitelisting
- Error handling with development/production mode differentiation

**Model Layer:**
- `Landlord` - User schema with password hashing pre-save hook
- `Listing` - Property schema with indexes, virtuals, and instance methods
- Mongoose schema validation with custom error messages
- Automatic timestamp management (createdAt, updatedAt)

**Database Layer:**
- Connection retry logic with up to 5 attempts
- Connection state monitoring before server startup
- Graceful shutdown handling (SIGTERM)
- Environment-based URI selection (Railway internal vs Atlas)

### Frontend Architecture

**Service Layer:**
- Centralized `ApiService` class handles all HTTP requests
- Automatic API URL detection (environment variable, localhost, production fallback)
- Content-Type header enforcement
- Error parsing and user-friendly error messages
- Request/response logging for debugging

**State Management:**
- React Context API for authentication state
- Token persistence in localStorage
- Automatic token injection in authenticated requests

### Reliability Mechanisms

- Database connection verification before server startup
- Connection retry logic with exponential backoff
- Graceful shutdown on SIGTERM signal
- Database state checking in route handlers (returns 503 if disconnected)
- Error boundary patterns in error handling middleware
- Input validation at multiple layers (middleware, route, model)

## API Endpoints

### Authentication

**POST /api/auth/register**
- Creates a new landlord account
- Input: `email`, `password`, `name` (optional), `phone` (optional)
- Output: JWT token and landlord object (password excluded)
- Validates email format, password length, and checks for duplicate emails

**POST /api/auth/login**
- Authenticates existing landlord
- Input: `email`, `password`
- Output: JWT token and landlord object
- Returns 401 for invalid credentials or inactive accounts

**GET /api/auth/me**
- Returns current authenticated user information
- Requires: Authorization header with Bearer token
- Output: Landlord object without password

### Listings

**GET /api/listings**
- Retrieves paginated list of active listings
- Query parameters: `page`, `limit`, `minPrice`, `maxPrice`, `bedrooms`, `bathrooms`, `amenities`, `search`
- Output: Array of listings with pagination metadata
- Includes landlord name and email via population

**GET /api/listings/my**
- Retrieves authenticated user's listings
- Requires: Authorization header with Bearer token
- Output: Array of listings owned by authenticated landlord

**GET /api/listings/:id**
- Retrieves single listing by ID
- Output: Listing object with populated landlord information
- Automatically increments view count (non-blocking)

**POST /api/listings**
- Creates new listing
- Requires: Authorization header with Bearer token
- Input: `title`, `description`, `price`, `bedrooms`, `bathrooms`, `address`, plus optional fields
- Output: Created listing object
- Validates required fields and data types

**PUT /api/listings/:id**
- Updates existing listing
- Requires: Authorization header with Bearer token
- Validates ownership before allowing update
- Input: Fields to update
- Output: Updated listing object

**DELETE /api/listings/:id**
- Deletes listing
- Requires: Authorization header with Bearer token
- Validates ownership before allowing deletion
- Output: Success message

**PUT /api/listings/:id/toggle-status**
- Toggles listing status between active and inactive
- Requires: Authorization header with Bearer token
- Validates ownership
- Output: Updated listing with new status

### Health

**GET /api/health**
- Basic health check
- Output: Server status, database connection state, environment info

**GET /api/health/detailed**
- Detailed health information
- Output: Environment variables, database connection details, server uptime, memory usage

**GET /api/health/env**
- Environment variable status (production diagnostic)
- Output: Configuration status for critical variables

**GET /api/health/test**
- Simple connectivity test
- Output: Success message and CORS origin

## Data Flow

### Request Processing

1. **Client Request**: Frontend makes HTTP request via `ApiService`
2. **Network Layer**: Request reaches Express server on Railway
3. **CORS Check**: CORS middleware validates origin against whitelist
4. **Security Headers**: Middleware adds security headers to response
5. **Body Parsing**: Express.json() parses JSON body, fallback handles text/plain
6. **Sanitization**: Input sanitization removes MongoDB operators from body and query
7. **Authentication**: For protected routes, JWT middleware verifies token and loads landlord
8. **Route Handler**: Business logic executes (validation, database queries)
9. **Database Query**: Mongoose performs query with indexes, population, lean() optimization
10. **Response**: JSON response sent with appropriate status code
11. **Error Handling**: Any errors caught by middleware and formatted for client

### Database Operations

- **Connection**: Mongoose connects to MongoDB Atlas with timeout and retry options
- **Queries**: Use Mongoose ODM with schema validation, indexes for performance
- **Population**: Landlord information populated via reference in Listing queries
- **Lean Queries**: Listings endpoint uses lean() for better performance
- **Transactions**: Not currently implemented (single-document operations)

### Authentication Flow

1. User submits credentials via POST /api/auth/login
2. Server validates email format and finds landlord in database
3. bcryptjs compares submitted password with hashed password
4. JWT token generated with landlordId payload and 7-day expiration
5. Token returned to client and stored in localStorage
6. Subsequent requests include token in Authorization header
7. Middleware verifies token signature and expiration
8. Landlord document loaded from database and attached to request
9. Route handler accesses req.landlord for authorization checks

## Validation & Security

### Input Validation

**Schema-Level (Mongoose):**
- Required field validation with custom error messages
- String length limits (title max 100, description max 2000)
- Number ranges (price min 0, bedrooms/bathrooms 0-10)
- Email format validation with regex
- Enum validation for amenities, lease_terms, parking_type, status
- URL validation for photo URLs

**Route-Level:**
- Required field presence checking before database operations
- Type validation (string, number, ObjectId format)
- String trimming and whitespace removal
- Price range validation (non-negative, numeric)

**Middleware-Level:**
- Recursive object sanitization removing keys starting with `$`
- Prevents MongoDB operator injection attacks
- Cleans both request body and query parameters

### Authentication Security

- Passwords hashed with bcryptjs using 12 salt rounds
- JWT tokens signed with secret key from environment variables
- Token expiration set to 7 days (configurable)
- Account activation status checked on login and token verification
- Password excluded from JSON serialization via toJSON method

### Authorization

- Ownership verification before update/delete operations
- ObjectId comparison for landlord matching
- 403 Forbidden response for unauthorized operations
- Token required for protected routes (401 if missing)

### Network Security

- CORS configured with origin whitelist (production) or open (development)
- Security headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY
- X-Powered-By header removed
- Content-Type enforcement with fallback for misconfigured clients

## Testing

The test suite uses Jest with MongoDB Memory Server for isolated testing:

### Test Structure

**Integration Tests** (`backend/tests/integration/`):
- `auth.test.js` - Registration, login, token validation (20+ tests)
- `listings.test.js` - CRUD operations, filtering, pagination, search (60+ tests)

**Unit Tests** (`backend/tests/unit/`):
- `middleware.test.js` - Authentication and sanitization middleware
- `models.test.js` - Mongoose schema validation and methods

**Test Helpers** (`backend/tests/helpers/testHelpers.js`):
- Factory functions for creating test data
- Token generation utilities
- Validation helpers for response structures

### Test Features

- MongoDB Memory Server provides isolated in-memory database
- Test isolation via collection cleanup after each test
- Supertest for HTTP endpoint testing
- Test environment variable configuration
- 30-second timeout for database operations

### Test Coverage

- 81 passing tests across 4 test suites
- Integration tests cover all API endpoints
- Unit tests validate middleware and model behavior
- Test helpers ensure consistent test data generation

## Deployment

### Backend Deployment (Railway)

**Configuration:**
- Root directory: `backend/`
- Build command: None (Node.js runtime)
- Start command: `node index.js`
- Node.js version: >=18.0.0 (enforced via engines field and npmrc)

**Environment Variables:**
- `NODE_ENV=production`
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT signing
- `PORT` - Server port (Railway provides automatically)
- `FRONTEND_URL` - Allowed CORS origin

**Railway-Specific:**
- `.railwayignore` excludes frontend directory from backend build
- Server binds to `0.0.0.0` to accept external connections
- Database connection retry logic handles Railway restarts
- Graceful shutdown on SIGTERM for zero-downtime deployments

### Frontend Deployment (Vercel)

**Configuration:**
- Build command: `npm run build` (runs in `frontend/` directory)
- Output directory: `dist/`
- Framework preset: Vite

**Environment Variables:**
- `VITE_API_URL` - Backend API base URL

**Vercel Configuration:**
- `vercel.json` configures SPA routing (all routes serve index.html)

### Database (MongoDB Atlas)

- Production database hosted on MongoDB Atlas
- Connection string stored in Railway environment variables
- Network access configured for Railway IP ranges
- Database name: `ucrhousing`
- Connection options: 30s server selection timeout, 45s socket timeout

## Local Development Setup

### Prerequisites

- Node.js >=18.0.0
- MongoDB Atlas account (or local MongoDB instance)
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd UCRHousing
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure environment variables:

Create `backend/.env`:
```
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ucrhousing
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:3001/api
```

5. Start backend server:
```bash
cd backend
npm run dev
```

6. Start frontend development server:
```bash
cd frontend
npm run dev
```

### Running Tests

**Backend tests:**
```bash
cd backend
npm test
```

**Frontend tests:**
```bash
cd frontend
npm test
```

**Test coverage:**
```bash
cd backend
npm run test:coverage
```

## Project Structure

```
UCRHousing/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection with retry logic
│   │   ├── cors.js              # CORS configuration
│   │   └── environments.js      # Environment-specific config
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── sanitize.js          # Input sanitization middleware
│   │   └── security.js         # Security headers middleware
│   ├── models/
│   │   ├── Listing.js          # Listing schema with indexes and methods
│   │   └── Landlord.js          # Landlord schema with password hashing
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── listings.js          # Listing CRUD and filtering endpoints
│   │   └── health.js            # Health check endpoints
│   ├── tests/
│   │   ├── integration/         # API integration tests
│   │   ├── unit/                # Unit tests for models and middleware
│   │   ├── helpers/             # Test utility functions
│   │   └── setup.js             # Jest and MongoDB Memory Server setup
│   ├── scripts/
│   │   └── seed-listings.js     # Database seeding script
│   ├── index.js                 # Express server entry point
│   ├── package.json
│   └── .railwayignore           # Railway deployment configuration
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── contexts/            # React Context (AuthContext)
│   │   ├── pages/               # Page components
│   │   ├── services/
│   │   │   └── api.js           # Centralized API service
│   │   ├── App.jsx              # React Router setup
│   │   └── main.jsx             # React entry point
│   ├── package.json
│   └── vercel.json              # Vercel deployment configuration
└── scripts/                      # Utility scripts for testing and seeding
```

## Key Implementation Details

### Database Optimization

- **Indexes**: Listings collection indexed on `status`, `createdAt`, `landlord`, `price`, `bedrooms`, `bathrooms` for query performance
- **Lean Queries**: Listings endpoint uses `.lean()` to return plain JavaScript objects instead of Mongoose documents, reducing memory usage
- **Parallel Queries**: Listings and count queries executed in parallel using `Promise.all()` for faster response times
- **Population Optimization**: Landlord population uses `select` to limit fields and `lean: true` for performance

### Error Handling Patterns

- **Layered Validation**: Input validated at middleware, route, and model layers
- **Error Type Detection**: Specific handling for Mongoose errors, MongoDB connection errors, JWT errors
- **Development vs Production**: Detailed error messages in development, sanitized messages in production
- **HTTP Status Codes**: Appropriate status codes (400 validation, 401 unauthorized, 403 forbidden, 404 not found, 500 server error, 503 service unavailable)

### Connection Reliability

- **Pre-Startup Verification**: Server waits for database connection before accepting requests
- **Retry Logic**: Up to 5 connection attempts with 1-second intervals
- **State Monitoring**: Database ready state checked before route execution
- **Graceful Degradation**: 503 responses when database is disconnected instead of 500 errors

### Security Implementation

- **Operator Injection Prevention**: Sanitization middleware recursively removes keys starting with `$` from request bodies and query parameters
- **Password Security**: bcryptjs with 12 salt rounds, passwords never returned in API responses
- **Token Management**: JWT tokens with expiration, secret key from environment variables
- **CORS Configuration**: Origin whitelist in production, open in development for testing

### Request Processing Optimizations

- **Content-Type Normalization**: Middleware converts `text/plain` to `application/json` for misconfigured clients
- **Body Size Limits**: 10MB limit for JSON and URL-encoded bodies
- **Pagination Bounds**: Maximum 50 items per page, minimum 1, prevents resource exhaustion
- **Non-Blocking Operations**: View count increment uses `.catch()` to avoid blocking response

### Testing Architecture

- **Isolated Test Database**: MongoDB Memory Server provides clean database for each test run
- **Test Data Factories**: Helper functions generate consistent test data
- **HTTP Testing**: Supertest simulates HTTP requests without network overhead
- **Test Isolation**: Collections cleared after each test to prevent test interdependencies
