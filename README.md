# ResumeIQ

ResumeIQ is a full-stack resume analysis app with:

- a `Next.js` frontend (root project)
- an `Express + MongoDB` backend (`backend/`)
- file parsing for `PDF` and `DOCX`
- skill/experience analysis with actionable suggestions

---

## Features

- Upload resumes (`.pdf` / `.docx`, max 5 MB)
- Compare resume content against a full job description
- Get score breakdown (skills, experience, keywords, format)
- Store analyzed resumes in MongoDB
- Browse past analyses in a dashboard
- Fetch detailed report by resume ID

---

## Tech Stack

**Frontend**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Multer (uploads)
- `pdf-parse` and `mammoth` (file parsing)

---

## Project Structure

```text
ResumeIQ/
├─ src/                      # Next.js app
├─ public/
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  └─ utils/
│  └─ server.js
├─ package.json              # Frontend package
└─ README.md
```

---

## Prerequisites

- Node.js `>= 18`
- npm `>= 9`
- MongoDB (local instance or MongoDB Atlas)

---

## Environment Variables

Create these files manually (they are ignored by git).

### 1) Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/resumeiq
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### 2) Frontend (`.env.local`)

Use one of the following approaches:

**Recommended (client-side direct API URL)**

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
```

**Alternative (server-side internal URL fallback)**

```env
BACKEND_INTERNAL_URL=http://127.0.0.1:5000
```

---

## Getting Started

### 1) Install frontend deps (root)

```bash
npm install
```

### 2) Install backend deps

```bash
cd backend
npm install
```

### 3) Start backend

From `backend/`:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

### 4) Start frontend

From repo root:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API health check |
| `POST` | `/api/upload` | Upload + parse + analyze + save |
| `POST` | `/api/parse` | Parse file and return extracted text |
| `POST` | `/api/analyze` | Analyze raw resume text |
| `GET` | `/api/roles` | List supported job-role templates |
| `GET` | `/api/resumes` | List analyzed resumes |
| `GET` | `/api/resume/:id` | Get analysis by `resumeId` |
| `DELETE` | `/api/resume/:id` | Delete analysis by `resumeId` |

---

## Quick API Examples

### Upload and analyze resume

```bash
curl -X POST http://localhost:5000/api/upload ^
  -F "resume=@C:/path/to/resume.pdf" ^
  -F "jobDescription=Paste full job description here..."
```

### Analyze raw text

```bash
curl -X POST http://localhost:5000/api/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Your resume text...\",\"jobDescription\":\"Job post text...\"}"
```

### List resumes

```bash
curl "http://localhost:5000/api/resumes?limit=10&page=1"
```

---

## Common Issues

- `Could not reach the server` in UI:
  - Ensure backend is running on port `5000`.
  - Verify `.env.local` has correct API URL.
  - Restart frontend after changing env vars.

- MongoDB connection failure:
  - Check `MONGO_URI`.
  - Ensure MongoDB service/cluster is running and reachable.

- Upload rejected:
  - Only `.pdf` and `.docx` are accepted.
  - Max upload size defaults to `5 MB` (configurable via `MAX_FILE_SIZE`).

---

## Scripts

### Frontend (root)

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

### Backend (`backend/`)

- `npm run dev` - start backend with nodemon
- `npm start` - start backend with node

---
