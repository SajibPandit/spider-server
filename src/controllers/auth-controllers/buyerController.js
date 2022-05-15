const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const SellerModel = require('../../models/auth-models/SellerModel');
const BuyerProfileModel = require('../../models/auth-models/profile-models/BuyerProfileModel');

const createBuyerProfile = catchAsync(async (req, res, next) => {
  const buyerProfile = await BuyerProfileModel.create({
    ...req.body,
    seller: req.seller.id,
  });

  if (!buyerProfile) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { buyerProfile },
  });
});

const updateBuyerProfile = catchAsync(async (req, res, next) => {
  const buyerProfile = await BuyerProfileModel.findOneAndUpdate(
    { seller: req.seller.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!buyerProfile) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { buyerProfile },
  });
});

const getBuyerProfile = catchAsync(async (req, res, next) => {
  const buyer = await BuyerProfileModel.findOne({
    seller: req.seller.id,
  }).populate('seller');

  if (!buyer) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { buyer },
  });
});

module.exports = {
  createBuyerProfile,
  updateBuyerProfile,
  getBuyerProfile,
};
