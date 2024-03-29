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
const axios = require('axios');

const { generateOTP } = require('../../helpers/otpGenerator');
const { handleOTP } = require('../../firebase/services');
const OTPModel = require('../../models/auth-models/OTPModel');
const UpgradeSellerTypeModel = require('../../models/UpgradeSellerTypeModel');
const NotificationModel = require('../../models/NotificationModel');
const { response } = require('express');

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

  if (!otp) return next(new AppError('Otp is not provided', 400));

  const otpData = await OTPModel.findOne({ phone });
  if (!otpData || otpData.length == 0) {
    return next(new AppError('Your OTP has been expired.'), 400);
  }

  if (otpData.otp == otp && otpData.unique_session_id == unique_session_id) {
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

  sendToken(sellerRole, seller, 200, res);
});

//handle google login
const googleLogin = catchAsync(async (req, res, next) => {
  if (req.body.googleAccessToken) {
    axios
      .get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${req.body.googleAccessToken}`,
        },
      })
      .then(async response => {
        const name = `${response.data.given_name} ${response.data.family_name}`;
        const email = response.data.email;

        // check existance of entered email
        const isExistEmail = await SellerModel.findOne({ email });
        if (isExistEmail) {
          sendToken(sellerRole, isExistEmail, 200, res);
        }
        const seller = await SellerModel.create({
          name,
          email,
        });
        sendToken(sellerRole, seller, 200, res);
      });
  }
});

const logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', '', { expiresIn: 1000 });
  res.status(200).json({ success: true });
});

// Function to get seller by id
const createSellerProfile = catchAsync(async (req, res, next) => {
  // const {location} = req.body;

  // location = {
  //   type : 'Point',
  //   coordinates : [location.coordinates[1], location.coordinates[0]],
  // }

  const sellerProfile = await SellerProfileModel.create({
    ...req.body,
    // location,
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

  //updated
  if (req.body.location) {
    await ProductModel.updateMany(
      { shop: sellerProfile._id },
      { location: req.body.location },
      { new: true, runValidators: true },
    );
  }

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

const forgotPassword = catchAsync(async (req, res, next) => {
  const { phone, unique_session_id } = req.body;

  if (!phone) {
    return next(new AppError('Provide valid phone number!', 400));
  }

  const seller = await SellerModel.findOne({ phone });
  if (!seller) return next(new AppError('Invalid phone number', 401));

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
});

const verifyOtp = catchAsync(async (req, res, next) => {
  const { unique_session_id, phone, otp } = req.body;

  if (!otp) return next(new AppError('Otp is not provided', 400));

  const otpData = await OTPModel.findOne({ phone });
  if (!otpData || otpData.length == 0) {
    return next(new AppError('Your OTP has been expired.'), 400);
  }

  if (otpData.otp == otp && otpData.unique_session_id == unique_session_id) {
    // const seller = await SellerModel.findOne({ phone });
    // seller.password = newPassword;
    // await seller.save();
    const secret_key = Math.floor(10000000 + Math.random() * 90000000);
    otpData.secret_key = secret_key;
    otpData.save();

    res.json({
      success: true,
      body: {
        message: 'OTP Matched',
        otpData,
      },
    });
  } else {
    return next(new AppError('OTP not matched', 401));
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { phone, newPassword, secret_key, otp } = req.body;

  // if (!otp) return next(new AppError('Otp is not provided', 400));

  const otpData = await OTPModel.findOne({ phone });
  if (!otpData || otpData.length == 0) {
    return next(new AppError('Your took a long time to do this.'), 400);
  }

  if (otpData.otp == otp && otpData.secret_key == secret_key) {
    const seller = await SellerModel.findOne({ phone });
    seller.password = newPassword;
    await seller.save();

    res.json({
      success: true,
      body: {
        message: 'Password updated',
      },
    });
  } else {
    return next(new AppError('Invalid data', 401));
  }
});

const updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new AppError('Provide valid password', 400));
  }
  const seller = await SellerModel.findOne({ phone: req.seller.phone }).select(
    '+password',
  );
  // if (!seller) return next(new AppError('Invalid phone or password', 401));
  const correct = await bcrypt.compare(oldPassword, seller.password);
  if (!correct) return next(new AppError('Invalid password', 401));

  // const seller = await SellerModel.findOne({ phone });
  seller.password = newPassword;
  await seller.save();

  res.json({
    success: true,
    body: {
      message: 'Password updated',
    },
  });
});

const upgradeSellerTypeRequest = catchAsync(async (req, res, next) => {
  const { requestedType, message } = req.body;
  const requestData = await UpgradeSellerTypeModel.findOne({
    seller: req.seller.id,
  });

  if (requestData) {
    if (requestData.isBlocked) {
      return next(new AppError('Upgrade request blocked!', 404));
    }
    requestData.seller = req.seller.id;
    requestData.requestedType = requestedType;
    requestData.message = message;
    await requestData.save();
  } else {
    const data = await UpgradeSellerTypeModel.create({
      ...req.body,
      seller: req.seller.id,
    });
    if (!data) return next(new AppError('Request failed!', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Upgrade request sent to admin',
  });
});

//@route   : GET /api/v1/sellers/notifications
//@access  : seller only
//@details : get all notifications of a seller
const getSellerNotifications = catchAsync(async (req, res, next) => {
  const data = await NotificationModel.find({ userId: req.seller.id }).sort(
    '-createdAt',
  );

  if (!data) return next(new AppError('Request failed!', 400));

  res.status(200).json({
    success: true,
    body: { data },
  });
});

//@route   : GET /api/v1/sellers/shop-notifications
//@access  : shop only
//@details : get all notifications of a shop
const getShopNotifications = catchAsync(async (req, res, next) => {
  const data = await NotificationModel.find({ userId: req.shop.id }).sort(
    '-createdAt',
  );

  if (!data) return next(new AppError('Request failed!', 400));

  res.status(200).json({
    success: true,
    body: { data },
  });
});

module.exports = {
  signUp,
  getSellers,
  getSingleSeller,
  login,
  logout,
  createSellerProfile,
  updateSellerProfile,
  editSeller,
  getProfile,
  blockSeller,
  unblockSeller,
  sellerStat,
  verify,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyOtp,
  upgradeSellerTypeRequest,
  getSellerNotifications,
  getShopNotifications,
  googleLogin,
};
