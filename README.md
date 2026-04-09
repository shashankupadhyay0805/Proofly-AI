# Adaptive AI Math Tutor with Step Validation and Hint-Based Learning

Production-style full-stack app that simulates a real math tutor:
- students solve **step-by-step**
- the system **validates each step** (without dumping the full solution)
- offers **progressive hints**
- detects **mistake types**
- shows **learning analytics** and a **basic adaptive difficulty** recommendation

## Folder structure

```
CueMath/
  client/                 # React (Vite) + Tailwind + Recharts
  server/                 # Express + MongoDB + Groq AI
```

## Backend (Express + Mongo + Groq)

### Environment

Copy `server/.env.example` → `server/.env` and fill:
- `MONGODB_URI` (MongoDB Atlas connection string)
- `GROQ_API_KEY`
Handwritten images:
- The server uses a **hybrid OCR pipeline**: Tesseract extracts text, then the LLM post-processes it to reconstruct math expressions.

### Run locally

```bash
cd server
npm run dev
```

Server runs on `http://localhost:5000`.

### API routes

- `POST /api/validate-step`
- `POST /api/generate-hint`
- `POST /api/submit-attempt`
- `GET /api/analytics?sessionId=...`

## Frontend (React + Tailwind + Recharts)

### Environment

Copy `client/.env.example` → `client/.env`.

### Run locally

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Deployment notes (Vercel + Render)

### Vercel (client)
- Project root: `client`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE_URL=https://<your-render-backend>`

### Render (server)
- Root: `server`
- Start: `npm start`
- Env: `MONGODB_URI`, `GROQ_API_KEY`, `CLIENT_ORIGIN=https://<your-vercel-domain>`

