# POS Data Ingestion & Pipeline

A full-stack boilerplate for accepting raw XML files from POS systems, parsing them into JSON, and storing them in Neon (Serverless PostgreSQL) using Prisma.

## Project Structure

- `/frontend`: Next.js 14 application with Tailwind CSS and a clean glassmorphism UI.
- `/backend`: FastAPI service that handles XML parsing (`xmltodict`) and data persistence.

## Getting Started

### Backend Setup

1. **Navigate to backend**: `cd backend`
2. **Create a virtual environment**: `python -m venv venv`
3. **Activate venv**:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. **Install dependencies**: `pip install -r requirements.txt`
5. **Set up environment**:
   - Copy `.env.example` to `.env`
   - Add your Neon `DATABASE_URL` (ensure `?sslmode=require` is present)
6. **Generate Prisma Client**: `prisma generate` (ensure you have `prisma` installed via pip or npm)
7. **Run the server**: `uvicorn main:app --reload`

The API will be available at `http://localhost:8000`.

### Frontend Setup

1. **Navigate to frontend**: `cd frontend`
2. **Install dependencies**: `npm install`
3. **Run development server**: `npm run dev`

The frontend will be available at `http://localhost:3000`.

## Architecture

1. **Database**: Prisma handles the schema and migrations. The `POSDataRecord` model stores the raw XML and the parsed JSON blob.
2. **Parsing**: FastAPI uses `xmltodict` for efficient conversion of raw XML strings to Python dictionaries.
3. **Downstream**: The `/api/sales-data` endpoint provides a placeholder for daily sales dashboards and forecasting apps to consume the processed data.

## Deployment Notes

- **CORS**: Ensure the FastAPI `allow_origins` includes your production frontend URL.
- **Neon**: Use the connection string provided in your Neon console. It handles connection pooling automatically for serverless functions.
