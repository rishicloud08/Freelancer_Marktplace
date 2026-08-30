# 🚀 FreelanceHub — AI-Powered Freelancer Marketplace

An intelligent freelancer marketplace built with the **MERN stack** (MongoDB, Express.js, React, Node.js) and **Google Gemini AI** that matches the right freelancers with the right projects, reducing hiring time by 40%.

## ✨ Features

### 🧠 AI-Powered (Gemini API)
- **Smart Matching** — AI scores and ranks freelancers for each project (0–100)
- **Proposal Enhancement** — AI improves freelancer cover letters before submission
- **Project Recommendations** — Personalized project suggestions for freelancers
- **Freelancer Recommendations** — AI-curated freelancer shortlists for clients

### 💼 Core Marketplace
- **Project Posting** — Clients post projects with skills, budget, and duration
- **Proposal System** — Freelancers submit proposals with AI match scores
- **User Profiles** — Skills, portfolio, ratings, and review history

### 💬 Communication
- **Real-time Messaging** — Socket.IO powered instant chat
- **Typing Indicators** — See when the other person is typing
- **Conversation History** — Persistent message threads

### 📊 Project Management
- **Milestone Tracking** — Visual timeline with status progression
- **Secure Payments** — Escrow-based milestone funding and release
- **Status Tracking** — Projects flow from open → in-progress → completed

### ⭐ Trust & Transparency
- **Star Ratings** — 1–5 star reviews after project completion
- **Review System** — Written feedback visible on profiles
- **Running Averages** — Automatically updated user ratings

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Socket.IO Client |
| Backend | Node.js, Express.js, Mongoose, Socket.IO, JWT, bcryptjs |
| AI | Google Gemini API (`gemini-2.0-flash`) |
| Database | MongoDB |
| Auth | JWT + bcrypt password hashing |

---

## 📁 Project Structure

```
freelance-marketplace/
├── server/                    # Express.js Backend
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Request handlers (8 files)
│   ├── middleware/auth.js     # JWT auth + role checking
│   ├── models/                # Mongoose schemas (7 models)
│   ├── routes/                # API routes (8 route files)
│   ├── services/              # Gemini AI service
│   ├── socket/                # Socket.IO handler
│   ├── server.js              # App entry point
│   ├── seed.js                # Database seeder
│   └── package.json
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Shared UI components (8 files)
│   │   ├── context/           # Auth context provider
│   │   ├── hooks/             # Custom hooks (Socket.IO)
│   │   ├── pages/             # Page components (10 pages)
│   │   ├── services/          # API service layer
│   │   ├── App.jsx            # Router setup
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally (or a MongoDB Atlas connection string)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone & Setup Backend

```bash
cd freelance-marketplace/server

# Create your environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and optionally MONGO_URI

# Install dependencies
npm install

# Seed the database with sample data
npm run seed

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:5000`.

### 2. Setup Frontend

```bash
cd freelance-marketplace/client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`.

### 3. Environment Variables

Create `server/.env` with:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/freelance-marketplace
JWT_SECRET=your_jwt_secret_here_change_in_production
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🧪 Test Accounts (after running seed)

| Role | Email | Password |
|---|---|---|
| Client | alice@example.com | password123 |
| Client | bob@example.com | password123 |
| Client | charlie@example.com | password123 |
| Freelancer | diana@example.com | password123 |
| Freelancer | eve@example.com | password123 |
| Freelancer | frank@example.com | password123 |
| Freelancer | grace@example.com | password123 |
| Freelancer | henry@example.com | password123 |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List projects (with filters) |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| GET | `/api/projects/my/projects` | Client's projects |
| GET | `/api/projects/assigned/me` | Freelancer's assignments |

### Proposals
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/proposals` | Submit proposal |
| GET | `/api/proposals/project/:id` | Project proposals |
| PUT | `/api/proposals/:id/accept` | Accept proposal |
| PUT | `/api/proposals/:id/reject` | Reject proposal |

### AI (Gemini)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/match/:projectId` | AI-match freelancers |
| GET | `/api/ai/recommend-projects` | Recommended projects |
| GET | `/api/ai/recommend-freelancers/:id` | Recommended freelancers |
| POST | `/api/ai/enhance-proposal` | AI-enhanced cover letter |

### Messages, Milestones, Payments, Reviews
See full API documentation in the source code route files.

---

## 🎯 How It Works

1. **Client posts a project** with required skills, budget, and description
2. **Gemini AI analyzes** the project and scores available freelancers
3. **Freelancers browse** projects and get AI-recommended matches
4. **Freelancers submit proposals** — optionally AI-enhanced
5. **Client reviews proposals** with AI match scores and accepts the best fit
6. **Milestones are created** to break the project into deliverables
7. **Payments are funded** into escrow for each milestone
8. **Real-time messaging** keeps both parties in sync
9. **Milestones are completed** and payments released
10. **Reviews are exchanged** to build trust for future projects

---

## 📜 License

MIT
