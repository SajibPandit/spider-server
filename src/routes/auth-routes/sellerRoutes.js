'use strict';

const {
  sellerRestrict,
} = require('../../middlewares/auth-guards/sellerRestrict');
// Importing functions from the controller
const {
  getSellers,
  signUp,
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
  verifyOtp
} = require('../../controllers/auth-controllers/sellerController');
const {
  adminRestrict,
} = require('../../middlewares/auth-guards/adminRestrict');
const {
  getBuyerProfile,
  createBuyerProfile,
  updateBuyerProfile,
} = require('../../controllers/auth-controllers/buyerController');

// Importing the express router
const sellerRouter = require('express').Router();

// Setting up the routes
sellerRouter
  .route('/')
  // .get(sellerRestrict, getSellers)
  .get(getSellers)
  .post(signUp)
  .patch(sellerRestrict, editSeller);

sellerRouter.route('/verify').post(verify);

sellerRouter
  .route('/profile')
  .get(sellerRestrict, getProfile)
  .post(sellerRestrict, createSellerProfile)
  .patch(sellerRestrict, updateSellerProfile);

sellerRouter
  .route('/buyer')
  .get(sellerRestrict, getBuyerProfile)
  .post(sellerRestrict, createBuyerProfile)
  .patch(sellerRestrict, updateBuyerProfile);

sellerRouter.route('/login').post(login);

sellerRouter.route('/logout').post(logout);

sellerRouter.route('/stat').get(sellerRestrict, sellerStat);

sellerRouter.route('/block/:sellerId').put(adminRestrict, blockSeller);
sellerRouter.route('/unblock/:sellerId').put(adminRestrict, unblockSeller);

sellerRouter.route('/forgot-password').put(forgotPassword);
sellerRouter.route('/reset-password').put(resetPassword);
sellerRouter.route('/verify-otp').put(verifyOtp);
sellerRouter.route('/update-password').put(sellerRestrict, updatePassword);

sellerRouter.route('/:id').get(getSingleSeller);

module.exports = sellerRouter;
