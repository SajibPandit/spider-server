'use strict';

// Importing the model
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const bcrypt = require('bcryptjs');
const sendSMS = require('../../utils/sms/sendSMS');
const SellerProfileModel = require('../../models/auth-models/profile-models/SellerProfileModel');
const SellerModel = require('../../models/auth-models/SellerModel');
const { sellerRole } = require('../../models/auth-models/roles');
const { sendToken } = require('./authUtil');
const ProductModel = require('../../models/ProductModel');
const ReportModel = require('../../models/reportModel');
const ReviewModel = require('../../models/reviewModel');
const validator = require('validator');

const { generateOTP } = require('../../helpers/otpGenerator');
const { handleOTP } = require('../../firebase/services');
const OTPModel = require('../../models/auth-models/OTPModel');

// Function to get all sellers
const getSellers = catchAsync(async (req, res, next) => {
  const sellers = await SellerModel.find().populate('sellerProfile');

  res.status(200).json({
    success: true,
    body: { sellers },
  });
});

// Function to sign up a seller
const signUp = catchAsync(async (req, res, next) => {
  const { phone, password, name, email, unique_session_id } = req.body;
  if (password.length < 6)
    return next(new AppError('Password must be at least 6 characters', 400));
  if (phone.length < 10)
    return next(new AppError('Phone number must be at least 10 digits', 400));
  if (!validator.isEmail(email))
    return next(new AppError('Invalid email', 400));

  // check existance of entered email
  const isExistEmail = await SellerModel.findOne({ email });
  if (isExistEmail) {
    return next(new AppError('Seller with this email already exists', 400));
  } else {
    // check existance of entered phone number
    const isExistPhone = await SellerModel.findOne({
      phone,
    });

    if (isExistPhone) {
      return next(
        new AppError('Seller with this phone number already exists', 400),
      );
    } else {
      const otp = generateOTP();
      console.log(otp);
      handleOTP(phone, otp);

      const isExistOTP = await OTPModel.find({ phone });
      if (isExistOTP.length != 0) {
        await OTPModel.findOneAndUpdate({
          otp,
          createdAt: Date.now(),
          unique_session_id,
        });
      } else {
        await OTPModel.create({ phone, otp, unique_session_id });
      }
      res.json({
        success: true,
        body: {
          message: 'An OTP has been sent to your number',
        },
      });
    }
  }
});

const verify = catchAsync(async (req, res, next) => {
  const { phone, password, name, email, unique_session_id, otp } = req.body;

  const otpData = await OTPModel.findOne({ phone });
  if (!otpData || otpData.length == 0) {
    return next(new AppError('Your OTP has been expired.'), 400);
  }

  if (otpData.otp == otp
     && otpData.unique_session_id == unique_session_id
     ) {
    const seller = await SellerModel.create({
      phone,
      password,
      name,
      email,
    });
    await seller.populate('sellerProfile').execPopulate();

    sendToken(sellerRole, seller, 201, res);
  } else {
    return next(new AppError('OTP not matched', 401));
  }
});

// Function to login a seller
const login = catchAsync(async (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new AppError('Provide valid phone and password!', 400));
  }

  const seller = await SellerModel.findOne({ phone })
    .select('+password')
    .populate('sellerProfile');
  if (!seller) return next(new AppError('Invalid phone or password', 401));

  const correct = await bcrypt.compare(password, seller.password);
  if (!correct) return next(new AppError('Invalid phone or password', 401));

  sendToken(sellerRole, seller, 201, res);
});

const logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', '', { expiresIn: 1000 });
  res.status(200).json({ success: true });
});

const resetPassword = catchAsync(async (req, res, next) => {
  
  // const { phone, password } = req.body

  // const seller = await SellerModel.findOneAndUpdate({ phone }, { password }, { new: true, runValidators: true })

  res.status(200).json({
    success: true,
    // body: {
    //   seller
    // }
  });
});

// Function to get seller by id
const createSellerProfile = catchAsync(async (req, res, next) => {
  const sellerProfile = await SellerProfileModel.create({
    ...req.body,
    seller: req.seller.id,
  });

  if (!sellerProfile) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { sellerProfile },
  });
});

// Function to get seller by id
const updateSellerProfile = catchAsync(async (req, res, next) => {
  const sellerProfile = await SellerProfileModel.findOneAndUpdate(
    { seller: req.seller.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!sellerProfile) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { sellerProfile },
  });
});

const editSeller = catchAsync(async (req, res, next) => {
  const id = req.seller.id;
  const { profilePic, name, email } = req.body;

  const seller = await SellerModel.findByIdAndUpdate(
    id,
    { profilePic, name, email },
    { new: true, runValidators: true },
  );

  if (!seller) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { seller },
  });
});

// Function to get seller by id
const getSingleSeller = catchAsync(async (req, res, next) => {
  const seller = await SellerModel.findById(req.params.id)
    .populate('sellerProfile')
    .exec();

  if (!seller) return next(new AppError('Not found!', 404));

  const shop = await SellerProfileModel.findOne({ seller: req.params.id });

  if (!shop) return next(new AppError('Shop not created!', 404));

  let averageRating = 0;
  const products = await ProductModel.find({ shop: shop.id })
    .populate('reviews')
    .exec();
  if (products.length !== 0) {
    const ratings = products.map(product => product.averageRating);
    const sum = ratings.reduce((acc, curr) => acc + curr);
    averageRating = sum / ratings.length;
  }

  res.status(200).json({
    success: true,
    body: { seller, averageRating },
  });
});

const getProfile = catchAsync(async (req, res, next) => {
  const seller = await SellerModel.findById(req.seller.id).populate(
    'sellerProfile',
  );

  if (!seller) return next(new AppError('Not found!', 404));

  const shop = await SellerProfileModel.findOne({ seller: req.seller.id });

  let averageRating = 0;
  const products = await ProductModel.find({ shop: shop?.id })
    .populate('reviews')
    .exec();
  if (products.length !== 0) {
    const ratings = products.map(product => product.averageRating);
    const sum = ratings.reduce((acc, curr) => acc + curr);
    averageRating = sum / ratings.length;
  }

  res.status(200).json({
    success: true,
    body: { seller },
  });
});

const blockSeller = catchAsync(async (req, res, next) => {
  const { sellerId } = req.params;
  const seller = await SellerProfileModel.findOneAndUpdate(
    { seller: sellerId },
    { blocked: true },
    { new: true },
  );

  if (!seller) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { seller },
  });
});

const unblockSeller = catchAsync(async (req, res, next) => {
  const { sellerId } = req.params;
  const seller = await SellerProfileModel.findOneAndUpdate(
    { seller: sellerId },
    { blocked: false },
    { new: true },
  );

  if (!seller) return next(new AppError('Not found!', 404));

  res.status(200).json({
    success: true,
    body: { seller },
  });
});

const sellerStat = catchAsync(async (req, res, next) => {
  const sellerId = req.seller.id;
  const shop = await SellerProfileModel.findOne({ seller: sellerId });

  if (!shop) return next(new AppError('Shop not created!', 404));

  const products = await ProductModel.find({ shop: shop.id }).exec();
  const reports = await ReportModel.find({
    product: { $in: products.map(product => product.id) },
  });
  const reviews = await ReviewModel.find({
    product: { $in: products.map(product => product.id) },
  });

  const averageRating =
    reviews.reduce((acc, review) => {
      return acc + review.rating;
    }, 0) / reviews.length;

  res.status(200).json({
    success: true,
    body: {
      shop: shop,
      products: products,
      reports: reports,
      reviews: reviews,
      stats: {
        products: products.length,
        averageRating,
      },
    },
  });
});

module.exports = {
  signUp,
  getSellers,
  getSingleSeller,
  login,
  logout,
  resetPassword,
  createSellerProfile,
  updateSellerProfile,
  editSeller,
  getProfile,
  blockSeller,
  unblockSeller,
  sellerStat,
  verify,
};
