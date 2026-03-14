# Flipkart MERN - Claude Code Guide

## Project Overview
Full-stack Flipkart e-commerce clone built with the MERN stack (MongoDB, Express, React, Node.js). Deployed on Vercel (frontend) + Render/Heroku (backend).

## Development Commands

Run from the project root:

| Command | Description |
|---|---|
| `npm run dev` | Start backend (nodemon) + frontend (CRA) concurrently |
| `npm run server` | Backend only — nodemon, port 4000 |
| `npm run frontend` | Frontend only — CRA dev server, port 3000 |
| `npm start` | Production server |
| `npm run seed:products` | Seed MongoDB with 60+ sample products |

## Environment Setup

Config file: `backend/config/config.env` (not committed to git)

Required variables:
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET`, `JWT_EXPIRE`, `COOKIE_EXPIRE`
- `STRIPE_API_KEY`, `STRIPE_SECRET_KEY`
- `SENDGRID_API_KEY` — Email service
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `PAYTM_MID`, `PAYTM_MERCHANT_KEY`, `PAYTM_PID`, `PAYTM_WEBSITE`, `PAYTM_CHANNEL_ID`, `PAYTM_CALLBACK_URL`
- `PORT` (default: 4000), `NODE_ENV`

## Architecture

### Backend (`backend/`)
- **Entry point:** `server.js` → `backend/app.js`
- **Pattern:** Routes → Controllers → Models
- **All API routes** are prefixed with `/api/v1/`
- **Async error handling:** Wrap controller functions in `asyncErrorHandler` from `backend/middlewares/asyncErrorHandler.js`
- **Custom errors:** Use `ErrorHandler` class from `backend/utils/errorHandler.js`
- **Auth middleware:** `isAuthenticatedUser`, `authorizeRoles` from `backend/middlewares/auth.js`
- **Search/filter/pagination:** Reuse `SearchFeatures` class from `backend/utils/searchFeatures.js`
- **Module system:** CommonJS (`require` / `module.exports`)

### Frontend (`frontend/src/`)
- **State management:** Redux + redux-thunk (`store.js`)
- **Pattern:** `actions/` → `reducers/` → `components/`
- **HTTP client:** Axios, proxied to `http://localhost:4000` in development
- **UI:** MUI v5 (`@mui/material`) + Tailwind CSS
- **Routing:** React Router v6, protected via `Routes/ProtectedRoute.js`
- **Module system:** ES modules (`import` / `export`)

## Key Conventions

### Adding a new backend feature
1. Create model in `backend/models/`
2. Create controller in `backend/controllers/` — wrap handlers with `asyncErrorHandler`
3. Create routes in `backend/routes/` — apply `isAuthenticatedUser` / `authorizeRoles` as needed
4. Register routes in `backend/app.js`

### Adding a new Redux feature
Follow the pattern: dispatch `LOADING` constant → Axios call → dispatch `SUCCESS` or `FAIL`
- Constants go in `frontend/src/constants/`
- Actions go in `frontend/src/actions/`
- Reducers go in `frontend/src/reducers/`
- Register reducer in `frontend/src/store.js`

### Admin-only routes
Use `authorizeRoles("admin")` middleware after `isAuthenticatedUser`.

## In-Progress Work
- `backend/controllers/aiController.js` — empty, awaiting AI feature implementation
- `backend/routes/aiRoutes.js` — empty, needs to be wired into `backend/app.js`
- `backend/scripts/seedProducts.js` — complete product seeder (60+ products, 6 categories)
