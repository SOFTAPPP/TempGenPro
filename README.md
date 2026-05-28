# TempGenPro - Modern Temporary Email Service


## Tech Stack
-   **Frontend**: Vite, React, TypeScript, Vanilla CSS (Glassmorphism), Framer Motion, Lucide Icons.
-   **Backend**: Python, FastAPI, Uvicorn, Prisma ORM.
-   **AI Engine**: Python.
-   **Database**: PostgreSQL.

## Project Structure
-   `/client`: React frontend application.
-   `/server`: Python FastAPI backend API.
-   `/ai_service`: AI processing service.

## Setup Instructions

### 1. Easy Start (All Services)
You can start the Frontend, Backend, and AI Service all at once using the provided root script (requires virtual environments to be set up in `server` and `ai_service`):
```bash
python run.py
```

### 2. Manual Server Setup
```bash
cd TempGenPro/server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
-   Update `.env` with your **PostgreSQL** connection string, `JWT_SECRET`, and `WEBHOOK_SECRET`.
-   Generate Prisma Client and push DB schema:
    ```bash
    prisma generate
    prisma db push
    ```
-   Start development server manually:
    ```bash
    uvicorn main:app --reload
    ```

### 3. Manual Client Setup
```bash
cd TempGenPro/client
npm install
npm run dev
```
-   Access the app at `http://localhost:5173`.

## Webhook Ingestion
Integrate with Cloudflare Workers or any Mail server by sending a POST request to:
`POST /api/webhook/email`
Headers: `X-Webhook-Secret: your-secret`
Body:
```json
{
  "to": "user@yourdomain.com",
  "from": "sender@other.com",
  "subject": "Hello",
  "text": "Email body content"
}
```
