const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');
const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');

const {
  getSingleOrder,
  getSellerOrders,
  updateOrder,
  createOrder,
  deleteOrder,
} = require('../controllers/orderController');

const orderRouter = require('express').Router();

orderRouter
  .route('/')
  .get(sellerRestrict, getSellerOrders)
  .post(sellerRestrict, createOrder);

orderRouter
  .route('/:orderId')
  .get(getSingleOrder)
  .put(adminRestrict, updateOrder)
  .delete(sellerRestrict, deleteOrder);

module.exports = orderRouter;
