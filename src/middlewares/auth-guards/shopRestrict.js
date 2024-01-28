'use strict';

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const SellerProfileModel = require('../../models/auth-models/profile-models/SellerProfileModel');

const shopRestrict = catchAsync(async (req, res, next) => {
  let token;
  // Check if there's a token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError('Please log in', 401));

  // Verify the token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_FOR_SELLER,
  );
  // Check if shop is available
  const shop = await SellerProfileModel.findOne({ seller: decoded.id });
  if (!shop) {
    return next(new AppError('Shop is not created yet', 401));
  }

  // Grant access
  req.shop = shop;
  next();
});

module.exports = { shopRestrict };