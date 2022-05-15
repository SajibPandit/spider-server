'use strict';

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const SellerModel = require('../../models/auth-models/SellerModel');

const sellerRestrict = catchAsync(async (req, res, next) => {
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
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_FOR_SELLER);

  // Check if the seller available
  const seller = await SellerModel.findById(decoded.id);
  if (!seller) {
    return next(
      new AppError('Seller belongs to this token is not available', 401),
    );
  }

  // Check if the seller changed password after the password is changed
  if (seller.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Seller recently changed password', 401));
  }

  // Grant access
  req.seller = seller;
  next();
});

module.exports = { sellerRestrict };
