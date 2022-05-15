'use strict';

const AppError = require('../../utils/appError');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../../utils/catchAsync');
const AdminModel = require('../../models/auth-models/AdminModel');

const superAdminRestrict = catchAsync(async (req, res, next) => {
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
    process.env.JWT_SECRET_FOR_ADMIN,
  );

  // Check if the admin available
  const admin = await AdminModel.findById(decoded.id);
  if (!admin) {
    return next(
      new AppError('Admin belongs to this token is not available', 401),
    );
  }

  // Check if the admin changed password after the password is changed
  if (admin.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Admin recently changed password', 401));
  }

  // check if superAdmin
  if (!admin.superAdmin) {
    return next(new AppError('You are not super admin', 401));
  }

  // Grant access
  req.admin = admin;
  next();
});

module.exports = { superAdminRestrict };
