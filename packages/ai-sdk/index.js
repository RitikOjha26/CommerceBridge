/**
 * @ai-sdk/core
 *
 * Adds AI-friendly structured endpoints to any Express application.
 *
 * Usage:
 *   const { createAIRouter, createWellKnownHandler } = require('@ai-sdk/core');
 *
 *   app.use('/.ai', createAIRouter(adapters, config));
 *   app.get('/.well-known/ai', createWellKnownHandler(config));
 *
 * Adapter contract:
 *   adapters.getCatalogOverview()         → { total_products, categories, top_brands }
 *   adapters.getProducts(filters)         → { total, items: [...] }
 *   adapters.getProductById(id)           → product | null
 *   adapters.searchProducts(q)            → { total, items: [...] }
 *
 * `filters` object passed to getProducts:
 *   { search, category, brand, price_min, price_max, rating, page, limit }
 */

'use strict';

const express = require('express');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseFilters(query) {
    return {
        search:    query.search    || null,
        category:  query.category  || null,
        brand:     query.brand     || null,
        price_min: query.price_min ? Number(query.price_min) : null,
        price_max: query.price_max ? Number(query.price_max) : null,
        rating:    query.rating    ? Number(query.rating)    : null,
        page:      Math.max(1, Number(query.page)  || 1),
        limit:     Math.min(100, Math.max(1, Number(query.limit) || 20)),
    };
}

function buildAPIInfo(config) {
    return {
        protocol:     'ai-commerce',
        version:      config.version || '1.0',
        store:        config.store   || 'AI-Ready Store',
        capabilities: [
            'catalog_overview',
            'product_listing',
            'product_filtering',
            'product_detail',
            'product_search',
        ],
        endpoints: {
            info: {
                method: 'GET',
                path:   '/.ai/info',
            },
            catalog: {
                method: 'GET',
                path:   '/.ai/catalog',
            },
            products: {
                method:  'GET',
                path:    '/.ai/products',
                filters: ['category', 'brand', 'price_min', 'price_max', 'rating', 'search', 'page', 'limit'],
            },
            product_detail: {
                method: 'GET',
                path:   '/.ai/product/:id',
            },
            search: {
                method: 'GET',
                path:   '/.ai/search',
                params: ['q'],
            },
        },
    };
}

function wrapAsync(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ---------------------------------------------------------------------------
// createAIRouter
// ---------------------------------------------------------------------------

function createAIRouter(adapters, config = {}) {
    const router = express.Router();
    const apiInfo = buildAPIInfo(config);

    // GET /.ai/info — static capability doc
    router.get('/info', (req, res) => {
        res.status(200).json(apiInfo);
    });

    // GET /.ai/catalog — store overview
    router.get('/catalog', wrapAsync(async (req, res) => {
        const data = await adapters.getCatalogOverview();
        res.status(200).json({
            store:          apiInfo.store,
            total_products: data.total_products,
            categories:     data.categories,
            top_brands:     data.top_brands,
        });
    }));

    // GET /.ai/products — filtered, paginated product list
    router.get('/products', wrapAsync(async (req, res) => {
        const filters = parseFilters(req.query);
        const { total, items } = await adapters.getProducts(filters);

        res.status(200).json({
            page:     filters.page,
            limit:    filters.limit,
            total,
            products: items,
        });
    }));

    // GET /.ai/product/:id — full product detail
    router.get('/product/:id', wrapAsync(async (req, res, next) => {
        const product = await adapters.getProductById(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(product);
    }));

    // GET /.ai/search?q= — keyword search
    router.get('/search', wrapAsync(async (req, res) => {
        const q = (req.query.q || '').trim();

        if (!q) {
            return res.status(400).json({ error: 'Search query "q" is required' });
        }

        const { total, items } = await adapters.searchProducts(q);

        res.status(200).json({
            query:   q,
            total,
            results: items,
        });
    }));

    return router;
}

// ---------------------------------------------------------------------------
// createWellKnownHandler
// ---------------------------------------------------------------------------

function createWellKnownHandler(config = {}) {
    const apiInfo = buildAPIInfo(config);
    return (req, res) => res.status(200).json(apiInfo);
}

// ---------------------------------------------------------------------------

module.exports = { createAIRouter, createWellKnownHandler };
