const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const errorMiddleware = require('./middlewares/error');

const app = express();

// config
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: 'backend/config/config.env' });
}

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Advertise AI endpoint on every response so agents can discover it
app.use((req, res, next) => {
    res.setHeader('Link', '</.well-known/ai>; rel="ai-endpoint"; type="application/json"');
    next();
});

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');

const { createAIRouter, createWellKnownHandler } = require('../packages/ai-sdk');
const aiAdapters = require('./ai/adapters');
const aiConfig = { store: 'Flipkart MERN Demo', version: '1.0' };

app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);
app.use('/.ai', createAIRouter(aiAdapters, aiConfig));
app.get('/.well-known/ai', createWellKnownHandler(aiConfig));

// llms.txt — site-level AI metadata (like robots.txt but for LLMs)
app.get('/llms.txt', (req, res) => {
    const base = process.env.STORE_URL || 'https://commercebridge.onrender.com';
    res.type('text/plain').send(
`# CommerceBridge AI API
> A machine-readable product catalog for LLM agents and AI shopping assistants.

## Quick Start — Endpoint Index

GET ${base}/.well-known/ai         # Capability discovery — start here
GET ${base}/.ai/catalog            # Store overview: totals, categories, brands
GET ${base}/.ai/products           # Product list (filterable, paginated)
GET ${base}/.ai/search?q=KEYWORD   # Keyword search across product names
GET ${base}/.ai/product/ID         # Full detail for a single product

## Filters (append to ${base}/.ai/products)

?category=Electronics|Mobiles|Laptops|Fashion|Appliances|Home
?brand=Samsung|Apple|Sony|...
?price_min=N&price_max=N
?rating=N          (minimum stars, e.g. ?rating=4)
?page=N&limit=N    (default: page=1, limit=20, max=100)

## Example Queries

GET ${base}/.ai/products?category=Mobiles&price_max=30000
GET ${base}/.ai/products?brand=Apple&rating=4
GET ${base}/.ai/products?category=Electronics&brand=Sony&price_min=5000&price_max=50000
GET ${base}/.ai/search?q=gaming+laptop
`
    );
});

// error middleware
app.use(errorMiddleware);

module.exports = app;