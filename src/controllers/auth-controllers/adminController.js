'use strict';

// Importing the model
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const bcrypt = require('bcryptjs');
const sendSMS = require('../../utils/sms/sendSMS');
const AdminProfileModel = require('../../models/auth-models/profile-models/AdminProfileModel');
const AdminModel = require('../../models/auth-models/AdminModel');
const { sendToken } = require('./authUtil');
const { adminRole } = require('../../models/auth-models/roles');
const ProductModel = require('../../models/ProductModel');
const SellerProfileModel = require('../../models/auth-models/profile-models/SellerProfileModel');
const SellerModel = require('../../models/auth-models/SellerModel');

const getAdmins = catchAsync(async (req, res, next) => {
  const admins = await AdminModel.find().populate('adminProfile');

  res.status(200).json({
    success: true,
    body: { admins },
  });
});

// Function to sign up a admin
const signUp = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const admin = await AdminModel.create({ name, email, phone, password });
  // creating admin profile model
  await AdminProfileModel.create({ admin: admin.id });

  sendToken(adminRole, admin, 201, res);
});

const createAdmin = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const admin = await AdminModel.create({ name, email, phone, password });
  // creating admin profile model
  await AdminProfileModel.create({ admin: admin.id });

  // sendToken(adminRole, admin, 201, res);
  res.status(201).json({
    success: true,
    body: {
      message: 'Admin created successfully',
    },
  });
});

// Function to login a admin
const login = catchAsync(async (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new AppError('Provide valid phone and password!', 400));
  }

  const admin = await AdminModel.findOne({ phone }).select('+password');
  if (!admin) return next(new AppError('Invalid phone or password', 401));

  const correct = await bcrypt.compare(password, admin.password);
  if (!correct) return next(new AppError('Invalid phone or password', 401));

  sendToken(adminRole, admin, 201, res);
});

const logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', '', { expiresIn: 1000 });
  res.status(200).json({ success: true });
});

const resetPassword = catchAsync(async (req, res, next) => {
  // const { email, password } = req.body

  // const admin = await AdminModel.findOneAndUpdate({ email }, { password }, { new: true, runValidators: true })

  res.status(200).json({
    success: true,
    // body: {
    //   admin
    // }
  });
});

// Function to get admin by id
const updateAdminProfile = catchAsync(async (req, res, next) => {
  const sellerProfile = await AdminProfileModel.findOneAndUpdate(
    { admin: req.params.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!sellerProfile) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { sellerProfile },
  });
});

// Function to get admin by id
const getSingleAdmin = catchAsync(async (req, res, next) => {
  const admin = await AdminModel.findById(req.params.id).populate(
    'adminProfile',
  );
  // const admin = await AdminModel.findById(req.params.id);
  // await admin.populate({ path: 'admin' }).execPopulate()
  // const admin = await AdminProfileModel.findOne({ admin: req.params.id }).populate('admin');
  // admin.pop
  console.log(admin);

  if (!admin) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { admin },
  });
});

const getAdminStat = catchAsync(async (req, res, next) => {
  const productCount = await ProductModel.countDocuments({});
  const shopCount = await SellerProfileModel.countDocuments({});
  const userCount = await SellerModel.countDocuments({});

  res.status(200).json({
    success: true,
    body: { productCount, shopCount, userCount },
  });
});

module.exports = {
  signUp,
  getAdmins,
  getSingleAdmin,
  login,
  logout,
  resetPassword,
  updateAdminProfile,
  getAdminStat,
  createAdmin,
};
