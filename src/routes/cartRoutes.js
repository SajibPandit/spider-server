const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');

const {
  getCartItems,
  addAndUpdateCartItem,
  deleteCartItem,
  updateCartItem,
} = require('../controllers/cartController');

const cartRouter = require('express').Router();

cartRouter
  .route('/')
  .get(sellerRestrict, getCartItems)
  .post(sellerRestrict, addAndUpdateCartItem);

cartRouter
  .route('/:productId')
  .delete(sellerRestrict, deleteCartItem);

module.exports = cartRouter;
