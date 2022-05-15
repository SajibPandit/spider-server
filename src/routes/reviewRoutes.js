'use strict';

const {
  createReview,
  updateReview,
  getReviewsOfProduct,
} = require('../controllers/reviewController');
const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');

// Importing the express router
const reviewRouter = require('express').Router();

reviewRouter.route('/').post(sellerRestrict, createReview);
reviewRouter
  .route('/:product')
  .get(sellerRestrict, getReviewsOfProduct)
  .put(sellerRestrict, updateReview);

module.exports = reviewRouter;
