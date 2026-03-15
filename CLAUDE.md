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

## AI Orchestration Layer

This project includes a complete AI-ready API layer that exposes structured product data for LLM consumption without HTML scraping.

### Architecture

**SDK package** (`packages/ai-sdk/`) — reusable, app-agnostic Express middleware:
- `createAIRouter(adapters, config)` — mounts all `/.ai/` routes onto any Express app
- `createWellKnownHandler(config)` — serves the `/.well-known/ai` capability discovery doc
- Owns all routing, query parsing, and response shaping
- Consumers implement the **adapter contract** (4 async functions) to connect their own data source

**Flipkart adapters** (`backend/ai/adapters.js`) — implements the adapter contract on top of Mongoose:
- `getCatalogOverview()` → `{ total_products, categories, top_brands }`
- `getProducts(filters)` → `{ total, items: [...] }` — supports search, category, brand, price, rating, pagination
- `getProductById(id)` → full flat product object
- `searchProducts(q)` → keyword search, max 20 results

**Wired in** `backend/app.js`:
```js
app.use('/.ai', createAIRouter(aiAdapters, aiConfig));
app.get('/.well-known/ai', createWellKnownHandler(aiConfig));
```

### Endpoints

| Endpoint | Description |
|---|---|
| `GET /.well-known/ai` | Capability discovery — lists all endpoints, filters, protocol version |
| `GET /.ai/info` | Same as above, mounted under `/.ai/` |
| `GET /.ai/catalog` | Store overview: total products, categories, top brands |
| `GET /.ai/products` | Filtered, paginated product list |
| `GET /.ai/product/:id` | Full product detail with highlights and specifications |
| `GET /.ai/search?q=` | Keyword search across product names |
| `GET /llms.txt` | Site-level AI metadata (like robots.txt for LLMs) |

**`/.ai/products` query params:** `category`, `brand`, `price_min`, `price_max`, `rating`, `search`, `page` (default 1), `limit` (default 20, max 100)

### LLM Discovery Mechanisms

Three passive discovery signals are set on every request/page:
1. **HTTP `Link` header** — `</.well-known/ai>; rel="ai-endpoint"` on every API response
2. **HTML meta tags** — `<link rel="ai-endpoint">` and `<meta name="ai-api">` in `frontend/public/index.html`
3. **`/llms.txt`** — human+machine readable endpoint index (most real-world traction)

### Adapter Contract

To plug a different data source into the SDK, implement these 4 functions:
```js
module.exports = {
    getCatalogOverview,   // () → { total_products, categories, top_brands }
    getProducts,          // (filters) → { total, items }
    getProductById,       // (id) → product | null
    searchProducts,       // (q) → { total, items }
};
```
`filters` object shape: `{ search, category, brand, price_min, price_max, rating, page, limit }`

### Response Shape (AI-friendly)

All responses are flat JSON — no deep nesting, no Mongoose internals:
- `brand` is flattened to a string (not `brand.name`)
- `specifications` array is converted to `{ key: value }` map
- Only `images[0].url` is exposed as `image`
- Heavy fields (`reviews`, `brand.logo`, `description`) are excluded from list responses

## Scripts

- `backend/scripts/seedProducts.js` — complete product seeder (60+ products, 6 categories), run via `npm run seed:products`
