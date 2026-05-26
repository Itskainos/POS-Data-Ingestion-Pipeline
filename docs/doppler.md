# Doppler Secrets Management Setup Guide

This guide outlines how to set up and use Doppler Secrets Management for local development on this project.

## Prerequisites

Ensure you have the Doppler CLI installed and configured.

### 1. Install the Doppler CLI
On Windows, you can install it using `winget`:
```powershell
winget install Doppler.doppler
```
*(For other platforms, please refer to the official [Doppler Installation Guide](https://docs.doppler.com/docs/install-cli).)*

### 2. Log In to Doppler
Authenticate your local environment:
```powershell
doppler login
```

### 3. Link the Repository
Run the setup from the root of the project repository to associate it with the Doppler project:
```powershell
doppler setup
```
Select the appropriate project (`pos_data-ingestion-pipeline`) and environment/config (`dev`).

### 4. Upload Existing Secrets (Optional)
If you have local secrets in a `.env.local` (or backend `.env`) file, you can upload them to Doppler:
```powershell
# From the root directory or relevant subfolder:
doppler secrets upload .env.local
```

---

## Development Workflow

Once set up, use the following commands to run the application components with Doppler injection.

### Running the Frontend (Next.js)
Navigate to the `frontend/` directory and run:
```powershell
npm run dev:doppler
```

### Running the Backend (FastAPI)
Run the convenience batch script from the repository root:
```powershell
scripts\start_backend_doppler.bat
```
This script will automatically navigate to the backend directory, activate the python environment (`venv`), and launch the FastAPI server using `doppler run`.
