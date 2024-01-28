const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');
const { shopRestrict } = require('../middlewares/auth-guards/shopRestrict');

const {
  getSingleOrder,
  getSellerOrders,
  getShopOrders,
  updateOrder,
  createOrder,
  deleteOrder,
} = require('../controllers/orderController');

const orderRouter = require('express').Router();

orderRouter.route('/shop').get(shopRestrict, getShopOrders);

orderRouter
  .route('/')
  .get(sellerRestrict, getSellerOrders)
  .post(sellerRestrict, createOrder);

orderRouter
  .route('/:orderId')
  .get(getSingleOrder)
  .put(shopRestrict, updateOrder)
  .delete(sellerRestrict, deleteOrder);

module.exports = orderRouter;
