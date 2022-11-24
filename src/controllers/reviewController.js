const ReviewModel = require('../models/reviewModel');
const ProductModel = require('../models/ProductModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createReview = catchAsync(async (req, res, next) => {
  const { product, rating, content } = req.body;
  const seller = req.seller.id;

  if (!product || !rating || !content)
    return next(new AppError('Bad Request', 400));

  const availableProduct = await ProductModel.findOne({ _id: product });
  if (!availableProduct) return next(new AppError('Product Not Found', 404));

  const available = await ReviewModel.findOne({ product, seller });
  if (!!available)
    return next(new AppError('User already reviewed the product', 400));

  const review = await ReviewModel.create({
    ...req.body,
    seller: req.seller.id,
  });

  availableProduct.reviews.push(review._id);
  availableProduct.save();

  res.status(201).json({
    success: true,
    body: { review },
  });
});

const getReviewsOfProduct = catchAsync(async (req, res, next) => {
  const { product } = req.params;
  const { limit, skip } = req.query;

  if (!product) return next(new AppError('Bad Request', 400));

  const reviews = await ReviewModel.find({ product })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  res.status(201).json({
    success: true,
    body: { reviews },
  });
});

const updateReview = catchAsync(async (req, res, next) => {
  const { product } = req.params;
  const { rating, content } = req.body;
  const seller = req.seller.id;

  const review = await ReviewModel.findOneAndUpdate(
    { product, seller },
    { rating, content },
    { new: true },
  );
  if (!review) return next(new AppError('Review not found', 404));

  res.status(201).json({
    success: true,
    body: { review },
  });
});

module.exports = {
  createReview,
  updateReview,
  getReviewsOfProduct,
};
