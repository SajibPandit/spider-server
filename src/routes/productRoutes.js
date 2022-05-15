'use strict';

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getSellerProducts,
  blockProduct,
  unblockProduct,
  getNearestProducts,
  favoriteProduct,
  wishlistProduct,
  getWishlistProducts,
  getFavoriteProducts,
} = require('../controllers/productController');
const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');
const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');

// Importing the express router
const productRouter = require('express').Router();

// Setting up the routes
productRouter.route('/').post(sellerRestrict, createProduct).get(getProducts);
productRouter.route('/nearest').get(getNearestProducts);

productRouter.route('/seller-products').get(sellerRestrict, getSellerProducts);

productRouter.route('/block/:productId').put(adminRestrict, blockProduct);
productRouter.route('/unblock/:productId').put(adminRestrict, unblockProduct);

productRouter
  .route('/favorite/:productId')
  .put(sellerRestrict, favoriteProduct);
productRouter
  .route('/wishlist/:productId')
  .put(sellerRestrict, wishlistProduct);

productRouter.route('/wishlist').get(sellerRestrict, getWishlistProducts);
productRouter.route('/favorite').get(sellerRestrict, getFavoriteProducts);

productRouter
  .route('/:productId')
  .get(getProductById)
  .put(sellerRestrict, updateProduct)
  .delete(sellerRestrict, deleteProduct);

module.exports = productRouter;
