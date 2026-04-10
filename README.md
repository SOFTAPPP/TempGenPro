# TempGenPro - Modern Temporary Email Service

Successfully migrated from Django to a modern stack.

## Tech Stack
-   **Frontend**: Vite, React, TypeScript, Vanilla CSS (Glassmorphism), Framer Motion, Lucide Icons.
-   **Backend**: Node.js, Express, TypeScript, Prisma ORM.
-   **Database**: PostgreSQL.

## Project Structure
-   `/client`: React frontend application.
-   `/server`: Express backend API.

## Setup Instructions

### 1. Server Setup
```bash
cd TempGenPro/server
npm install
```
-   Update `.env` with your **PostgreSQL** connection string, `JWT_SECRET`, and `WEBHOOK_SECRET`.
-   Run database migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
-   Start development server:
    ```bash
    npm run dev
    ```

### 2. Client Setup
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
