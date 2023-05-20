const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ShippingAddressModel = require('../models/ShippingAddressModel');
const OrderModel = require('../models/OrderModel');

//@route   : POST /api/v1/order
//@access  : seller only
//@details : create a order
const createOrder = catchAsync(async (req, res, next) => {
  const createdOrder = await OrderModel.create({
    ...req.body,
    seller: req.seller.id,
  });

  if (!createdOrder) {
    return next(new AppError('Order not created', 400));
  }

  res.status(201).json({
    success: true,
    body: { createdOrder },
  });
});

//@route   : GET /api/v1/order
//@access  : seller only
//@details : get all orders of a seller
const getSellerOrders = catchAsync(async (req, res, next) => {
  const { limit = 10, skip = 0 } = req.query;
  const orders = await OrderModel.find({
    seller: req.seller.id,
  })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  res.status(201).json({
    success: true,
    body: { orders },
  });
});

//@route   : GET /api/v1/order/:orderId
//@access  : seller only
//@details : get a order data
const getSingleOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const order = await OrderModel.findById(orderId);

  res.status(200).json({
    success: true,
    body: { order },
  });
});

//@route   : PUT /api/v1/order/:orderId
//@access  : admin only
//@details : update a order data specially order staus by admin
const updateOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  console.log(req.body)
  const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, req.body, {
    new: true, runValidators : true
  });

  if (!updatedOrder) {
    return next(new AppError('Order is not updated', 400));
  }

  res.status(201).json({
    success: true,
    body: { updatedOrder },
  });
});

//@route   : DELETE /api/v1/order
//@access  : seller only
//@details : delete a order of a seller
const deleteOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const deteledOrder = await OrderModel.findByIdAndDelete(orderId);

  if (!deteledOrder) {
    return next(new AppError('Shipping address not deleted', 400));
  }

  res.status(200).json({
    success: true,
    body: { deteledOrder },
  });
});

module.exports = {
  getSingleOrder,
  getSellerOrders,
  createOrder,
  updateOrder,
  deleteOrder,
};
