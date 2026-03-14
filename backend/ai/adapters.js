'use strict';

/**
 * Flipkart MERN — AI SDK Adapters
 *
 * Implements the @ai-sdk/core adapter contract on top of the Mongoose Product model.
 * The SDK calls these functions with parsed, typed arguments.
 */

const Product = require('../models/productModel');

// ---------------------------------------------------------------------------
// Formatters — shape raw Mongoose docs into the flat AI-friendly structure
// ---------------------------------------------------------------------------

const formatProductSummary = (p) => ({
    id:             p._id,
    name:           p.name,
    brand:          p.brand?.name || null,
    category:       p.category,
    price:          p.price,
    original_price: p.cuttedPrice,
    rating:         p.ratings,
    reviews_count:  p.numOfReviews,
    in_stock:       p.stock > 0,
    image:          p.images?.[0]?.url || null,
    url:            `/product/${p._id}`,
});

const formatProductDetail = (p) => {
    const specifications = (p.specifications || []).reduce((acc, s) => {
        acc[s.title] = s.description;
        return acc;
    }, {});

    return {
        id:             p._id,
        name:           p.name,
        brand:          p.brand?.name || null,
        category:       p.category,
        price:          p.price,
        original_price: p.cuttedPrice,
        rating:         p.ratings,
        reviews_count:  p.numOfReviews,
        in_stock:       p.stock > 0,
        stock:          p.stock,
        warranty_years: p.warranty,
        highlights:     p.highlights || [],
        specifications,
        image:          p.images?.[0]?.url || null,
        url:            `/product/${p._id}`,
    };
};

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

async function getCatalogOverview() {
    const [total_products, categories, top_brands] = await Promise.all([
        Product.countDocuments(),
        Product.distinct('category'),
        Product.distinct('brand.name'),
    ]);

    return {
        total_products,
        categories: categories.sort(),
        top_brands: top_brands.sort(),
    };
}

async function getProducts(filters) {
    const query = {};

    if (filters.search)    query.name            = { $regex: filters.search,   $options: 'i' };
    if (filters.category)  query.category        = { $regex: filters.category, $options: 'i' };
    if (filters.brand)     query['brand.name']   = { $regex: filters.brand,    $options: 'i' };
    if (filters.rating)    query.ratings         = { $gte: filters.rating };

    if (filters.price_min != null || filters.price_max != null) {
        query.price = {};
        if (filters.price_min != null) query.price.$gte = filters.price_min;
        if (filters.price_max != null) query.price.$lte = filters.price_max;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [total, products] = await Promise.all([
        Product.countDocuments(query),
        Product.find(query)
            .select('-reviews -description -specifications -highlights -brand.logo')
            .skip(skip)
            .limit(filters.limit)
            .lean(),
    ]);

    return { total, items: products.map(formatProductSummary) };
}

async function getProductById(id) {
    const product = await Product.findById(id)
        .select('-reviews -__v')
        .lean();

    return product ? formatProductDetail(product) : null;
}

async function searchProducts(q) {
    const products = await Product.find({
        name: { $regex: q, $options: 'i' },
    })
        .select('-reviews -description -specifications -highlights -brand.logo')
        .limit(20)
        .lean();

    return { total: products.length, items: products.map(formatProductSummary) };
}

module.exports = { getCatalogOverview, getProducts, getProductById, searchProducts };
