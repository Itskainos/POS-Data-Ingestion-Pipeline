---
title: pos-backend
emoji: 🏢
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# POS Data Ingestion & Pipeline

A full-stack boilerplate for accepting raw XML files from POS systems, parsing them into JSON, and storing them in Neon (Serverless PostgreSQL) using Prisma.

## Project Structure

- `/frontend`: Next.js 14 application with Tailwind CSS and a clean glassmorphism UI.
- `/backend`: FastAPI service that handles XML parsing (`xmltodict`) and data persistence.

## Getting Started

> [!TIP]
> This project supports **Doppler Secrets Management** for local development. We recommend referring to the [Doppler Setup Guide](file:///c:/Users/Kainos/Documents/Quicktrackinc/POS%20Data%20Ingestion%20&%20Pipeline/docs/doppler.md) first to set up your environment variables securely.

### Backend Setup

1. **Navigate to backend**: `cd backend`
2. **Create a virtual environment**: `python -m venv venv`
3. **Activate venv**:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. **Install dependencies**: `pip install -r requirements.txt`
5. **Set up environment**:
   - **Using Doppler (Recommended)**: Follow the [Doppler Setup Guide](file:///c:/Users/Kainos/Documents/Quicktrackinc/POS%20Data%20Ingestion%20&%20Pipeline/docs/doppler.md) to link the project.
   - **Alternative (.env file)**: Copy `.env.example` to `.env` and add your Neon `DATABASE_URL`.
6. **Generate Prisma Client**: `prisma generate` (ensure you have `prisma` installed via pip or npm)
7. **Run the server**:
   - **Using Doppler**: Run the script `scripts\start_backend_doppler.bat` from the root directory.
   - **Using local env**: `uvicorn main:app --reload` from `backend` directory.

The API will be available at `http://localhost:8000`.

### Frontend Setup

1. **Navigate to frontend**: `cd frontend`
2. **Install dependencies**: `npm install`
3. **Run development server**:
   - **Using Doppler**: `npm run dev:doppler`
   - **Using local env**: `npm run dev`

The frontend will be available at `http://localhost:3000`.

## Architecture

1. **Database**: Prisma handles the schema and migrations. The `POSDataRecord` model stores the raw XML and the parsed JSON blob.
2. **Parsing**: FastAPI uses `xmltodict` for efficient conversion of raw XML strings to Python dictionaries.
3. **Downstream**: The `/api/sales-data` endpoint provides a placeholder for daily sales dashboards and forecasting apps to consume the processed data.

## Deployment Notes

- **CORS**: Ensure the FastAPI `allow_origins` includes your production frontend URL.
- **Neon**: Use the connection string provided in your Neon console. It handles connection pooling automatically for serverless functions.
