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
    res.type('text/plain').send(
`# Flipkart MERN Demo

> An AI-queryable ecommerce store. Use the /.ai/ endpoints to retrieve structured product data without scraping HTML.

## AI API

- [Capability Discovery](/.well-known/ai): Full endpoint listing, supported filters, and protocol info
- [Catalog Overview](/.ai/catalog): Total products, available categories, top brands
- [Product List](/.ai/products): Filterable by category, brand, price range, and rating. Supports pagination.
- [Product Detail](/.ai/product/:id): Full structured product data including highlights and specifications
- [Search](/.ai/search?q=): Keyword search across product names

## Query Examples

- All electronics under Rs 50,000: /.ai/products?category=Electronics&price_max=50000
- Search for laptops: /.ai/search?q=laptop
- Apple products rated 4+: /.ai/products?brand=Apple&rating=4
- Page 2 of results: /.ai/products?page=2&limit=20
`
    );
});

// error middleware
app.use(errorMiddleware);

module.exports = app;