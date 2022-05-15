'use strict';

const ProductModel = require('../models/ProductModel');
const WishlistModel = require('../models/WishlistModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getWishlist = catchAsync(async (req, res, next) => {
    const wishlist = await WishlistModel.findOne({ buyer: req.buyer.id })

    res.status(200).json({
        success: true,
        body: { wishlist },
    });
});

// Function to create a product
const addToWishlist = catchAsync(async (req, res, next) => {
    const { product } = req.body
    if (!product) return next(new AppError('Product Required', 400))

    // load wishlist
    const wishlist = await findOne({ buyer: req.buyer.id })

    // Check if product added to wishlist
    const index = wishlist.items.findIndex(item => item.product == product)
    if (index !== -1) return next(new AppError('Product Already Added to Wishlist', 400));

    // add product to wishlist
    wishlist.items.push(product)
    await wishlist.save()

    res.status(201).json({
        success: true,
        body: { wishlist },
    });
});

// Function to update a product
const removeFromWishlist = catchAsync(async (req, res, next) => {
    const { productId } = req.params

    const product = await ProductModel.findOneAndUpdate({ _id: productId, seller: req.seller.id }, req.body, { new: true, runValidators: true });
    if (!product) return next(new AppError('Not Found', 404));

    res.status(200).json({
        success: true,
        body: { product },
    });
});

// Function to delete a product
const resetWishlist = catchAsync(async (req, res, next) => {
    const { productId } = req.params
    let product = await ProductModel.findOneAndDelete({ _id: productId, seller: req.seller.id });
    if (!product) return next(new AppError('Not Found', 404));

    res.status(200).json({
        success: true,
        body: { product },
    });
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
