# PostgreSQL Setup for React Native CRMS

## Problem Solved
The `pg` package cannot run directly in React Native because it tries to import Node.js standard library modules that aren't available in the React Native runtime.

## Solution: API Server Architecture

We've created a backend API server that handles PostgreSQL operations, while the React Native app makes HTTP requests to this server.

### Project Structure
```
CRMS_V2/
├── app/                    # React Native app (no direct DB access)
├── server/                 # Backend API server
│   ├── server.js          # Express.js server
│   ├── package.json       # Server dependencies
│   └── README.md          # Server setup instructions
└── utils/
    ├── api.js             # API client for React Native
    └── database.js        # Updated to use API client
```

## Setup Instructions

### 1. Backend Server Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install server dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file in server directory:**
   ```env
   # Server Configuration
   PORT=3001

   # PostgreSQL Configuration
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=crms_v2_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=care0924
   ```

4. **Initialize database:**
   ```bash
   npm run init-db
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

### 2. React Native App Configuration

1. **Create .env file in project root:**
   ```env
   # API Configuration
   EXPO_PUBLIC_API_URL=http://localhost:3001/api
   ```

2. **Start the React Native app:**
   ```bash
   npm start
   ```

## How It Works

1. **React Native App** → Makes HTTP requests to API server
2. **API Server** → Handles PostgreSQL operations
3. **PostgreSQL Database** → Stores all data

## API Endpoints

The server provides these endpoints:
- `GET /api/health` - Health check
- `GET /api/collections/:collectionId` - List documents
- `GET /api/collections/:collectionId/documents/:documentId` - Get document
- `POST /api/collections/:collectionId/documents` - Create document
- `PUT /api/collections/:collectionId/documents/:documentId` - Update document
- `DELETE /api/collections/:collectionId/documents/:documentId` - Delete document

## Benefits

✅ **PostgreSQL Support**: Full PostgreSQL functionality
✅ **React Native Compatible**: No Node.js dependencies in mobile app
✅ **Scalable**: Can easily add authentication, caching, etc.
✅ **Simple**: PostgreSQL-only setup, no external dependencies

## Troubleshooting

1. **Server won't start**: Check PostgreSQL connection and .env file
2. **App can't connect**: Ensure server is running on port 3001
3. **Database errors**: Run `npm run init-db` in server directory

## Development Workflow

1. Start PostgreSQL database
2. Start backend server: `cd server && npm start`
3. Start React Native app: `npm start`
4. Both should now work together seamlessly! 