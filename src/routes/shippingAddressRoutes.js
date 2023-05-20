const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');

const {
  getShippingAddressOfASeller,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
} = require('../controllers/shippingAddressController');

const shippingAddressRouter = require('express').Router();

shippingAddressRouter
  .route('/')
  .get(sellerRestrict, getShippingAddressOfASeller)
  .post(sellerRestrict, createShippingAddress);

shippingAddressRouter
  .route('/:addressId')
  .put(sellerRestrict, updateShippingAddress)
  .delete(sellerRestrict, deleteShippingAddress);


module.exports = shippingAddressRouter;
