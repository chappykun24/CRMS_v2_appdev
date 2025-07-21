# CRMS Backend Server

This is the backend API server for the CRMS application that handles PostgreSQL database operations.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Create .env file:**
   Create a `.env` file in the server directory with:
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

3. **Initialize database:**
   ```bash
   npm run init-db
   ```

4. **Start the server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/collections/:collectionId` - List documents
- `GET /api/collections/:collectionId/documents/:documentId` - Get document
- `POST /api/collections/:collectionId/documents` - Create document
- `PUT /api/collections/:collectionId/documents/:documentId` - Update document
- `DELETE /api/collections/:collectionId/documents/:documentId` - Delete document

## Usage

The server will be available at `http://localhost:3001/api` and provides a REST API interface to your PostgreSQL database.

Make sure your React Native app is configured to use the API provider by setting:
```env
EXPO_PUBLIC_DATABASE_PROVIDER=api
EXPO_PUBLIC_API_URL=http://localhost:3001/api
``` 