const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ShippingAddressModel = require('../models/ShippingAddressModel');

//@route   : POST /api/v1/shipping-address
//@access  : seller only
//@details : create a shipping address
const createShippingAddress = catchAsync(async (req, res, next) => {
  req.body.seller = req.seller.id;
  //check if default address is sent or not.if sent update the other default address to false
  if (req.body.isDefaultShippingAddress) {
    await ShippingAddressModel.updateMany(
      { seller: req.seller.id },
      { isDefaultShippingAddress: false },
    );
  }

  const createdAddrsss = await ShippingAddressModel.create(req.body);

  if (!createdAddrsss) {
    return next(new AppError('Shipping address not created', 400));
  }

  res.status(201).json({
    success: true,
    body: { createdAddrsss },
  });
});

//@route   : GET /api/v1/shipping-address
//@access  : seller only
//@details : get all shipping address of a seller
const getShippingAddressOfASeller = catchAsync(async (req, res, next) => {
  const allAddress = await ShippingAddressModel.find({ seller: req.seller.id });

  res.status(200).json({
    success: true,
    body: { allAddress },
  });
});

//@route   : PUT /api/v1/shipping-address/:addressId
//@access  : seller only
//@details : update a shipping address of a seller
const updateShippingAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;

  //check if default address is sent or not.if sent update the other default address to false
  if (req.body.isDefaultShippingAddress) {
    await ShippingAddressModel.updateMany(
      { seller: req.seller.id },
      { isDefaultShippingAddress: false },
    );
  }

  const updatedAddress = await ShippingAddressModel.findOneAndUpdate(
    { _id: addressId, seller: req.seller.id },
    req.body,
    { new: true },
  );

  if (!updatedAddress) {
    return next(new AppError('Shipping address not updated', 400));
  }

  res.status(201).json({
    success: true,
    body: { updatedAddress },
  });
});

//@route   : DELETE /api/v1/shipping-address/:addressId
//@access  : seller only
//@details : delete a shipping address of a seller
const deleteShippingAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const deteledAddress = await ShippingAddressModel.findByIdAndDelete(
    addressId,
  );

  if (!deteledAddress) {
    return next(new AppError('Shipping address not deleted', 400));
  }

  res.status(200).json({
    success: true,
    body: { deteledAddress },
  });
});

module.exports = {
  getShippingAddressOfASeller,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
};
