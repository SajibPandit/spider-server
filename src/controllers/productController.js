'use strict';

const SellerProfileModel = require('../models/auth-models/profile-models/SellerProfileModel');
const ProductModel = require('../models/ProductModel');
const ReportModel = require('../models/reportModel');
const ReviewModel = require('../models/reviewModel');
const SavedProductModel = require('../models/SavedProductsModel');
const CategoryModel = require('../models/CategoryModel');
// Importing the model
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Function to get all products
const getProducts = catchAsync(async (req, res, next) => {
  const {
    sortBy,
    limit,
    skip,
    category,
    condition,
    minRating,
    minPrice,
    maxPrice,
    maxDistance,
    longitude,
    latitude,
    searchKey,
  } = req.query;

  const sort = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  let query = {};

  //modified
  if (category) {
    //click increase
    await CategoryModel.updateMany(
      { _id: { $in: category.split(',') } },
      { $inc: { clicks: 1 } },
    );

    query = {
      ...query,
      $or: [
        { category: { $in: category.split(',') } },
        { parentCategories: { $in: category.split(',') } },
      ],
    };
  }

  // //latest modified
  // if (category) {
  //   query = {
  //     ...query,
  //     $or: [{ category }, { parentCategories: { $in: [category] } }],
  //   };
  // }

  if (searchKey) {
    query = {
      ...query,
      $or: [
        { title: { $regex: searchKey, $options: 'i' } },
        { description: { $regex: searchKey, $options: 'i' } },
        { keywords: { $in: [new RegExp(searchKey, 'i')] } },
      ],
    };
  }

  if (condition) query = { ...query, new: condition === 'new' };
  if (minPrice && maxPrice)
    query = { ...query, price: { $gte: minPrice, $lte: maxPrice } };
  else if (minPrice) query = { ...query, price: { $gte: minPrice } };
  else if (maxPrice) query = { ...query, price: { $lte: maxPrice } };

  // { "parentCategories": { "$in": [category] } }

  let products = await ProductModel.find(query, [], {
    limit: parseInt(limit), // if limit is undefined then it will be ignored automatically
    skip: parseInt(skip),
    sort,
  })
    .populate('category')
    .populate({ path: 'shop', populate: 'seller' })
    .populate({ path: 'parentCategories', populate: 'category' })
    .populate('reviews')
    .exec();

  //Changed by Sajib
  await ProductModel.updateMany(query, { $inc: { impressions: 1 } });

  if (minRating)
    products = products.filter(product => product.averageRating >= minRating);

  if (maxDistance && latitude && longitude) {
    products = products.filter(product => {
      if (!product.shop) return false;

      const distance = getDistanceFromLatLonInKm(
        product.shop.location.coordinates[0],
        product.shop.location.coordinates[1],
        latitude,
        longitude,
      );
      return distance < maxDistance;
    });
  }
  if (sortBy === 'distance' && latitude && longitude) {
    products = products.sort((a, b) => {
      if (!a.shop) return 1;
      if (!b.shop) return -1;

      const distanceA = getDistanceFromLatLonInKm(
        a.shop.location.coordinates[0],
        a.shop.location.coordinates[1],
        latitude,
        longitude,
      );
      const distanceB = getDistanceFromLatLonInKm(
        b.shop.location.coordinates[0],
        b.shop.location.coordinates[1],
        latitude,
        longitude,
      );
      return distanceA - distanceB;
    });
  }

  if (!sortBy) products = products.sort(() => 0.5 - Math.random());

  res.status(200).json({
    success: true,
    total: products.length,
    body: { products },
  });
});

const getNearestProducts = catchAsync(async (req, res, next) => {
  const { maxDistance, long, lat } = req.query;

  const products = await SellerProfileModel.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(long), parseFloat(lat)],
        },
        $maxDistance: parseInt(maxDistance),
      },
    },
  });

  // .populate('category')
  // .populate({ path: 'shop', populate: 'seller' })
  // .populate('reviews');

  res.status(200).json({
    success: true,
    total: products.length,
    body: { products },
  });
});

// Function to get all products
const getSellerProducts = catchAsync(async (req, res, next) => {
  const shop = await SellerProfileModel.findOne({ seller: req.seller.id });
  if (!shop) return next(new AppError('Shop not created', 404));

  const products = await ProductModel.find({ shop: shop.id })
    .sort({ createdAt: -1 })
    .populate('category')
    .populate({ path: 'shop', populate: 'seller' })
    .populate('reviews');

  res.status(200).json({
    success: true,
    body: { products },
  });
});

// Function to get all products by seller id
const getSellerProductsById = catchAsync(async (req, res, next) => {
  const { sellerId } = req.params;

  const shop = await SellerProfileModel.findOne({ seller: sellerId });
  if (!shop) return next(new AppError('Shop not created', 404));

  const products = await ProductModel.find({ shop: shop.id })
    .sort({ createdAt: -1 })
    .populate('category')
    .populate({ path: 'shop', populate: 'seller' })
    .populate('reviews');

  res.status(200).json({
    success: true,
    total: products.length,
    body: { products },
  });
});

const getProductById = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  let product = await ProductModel.findOne({ _id: productId })
    .populate('category')
    .populate({ path: 'shop', populate: 'seller' })
    .populate('reviews');

  //Changed by Sajib
  await ProductModel.updateMany({ _id: productId }, { $inc: { clicks: 1 } });

  if (!product) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    body: { product },
  });
});

// Function to create a product
const createProduct = catchAsync(async (req, res, next) => {
  const shop = await SellerProfileModel.findOne({ seller: req.seller.id });

  if (!shop) return next(new AppError('Shop not created', 404));

  let parentCategories = [];
  let keywords = [];

  const category = await CategoryModel.findById(req.body.category).populate({
    path: 'parents',
    populate: 'category',
  });

  if (!category) return next(new AppError('Category not exists', 404));

  keywords.push(category.name);

  if (category.parents.length > 0) {
    category.parents.map(cat => {
      console.log(cat.name);
      parentCategories = [...parentCategories, cat._id];
      keywords = [...keywords, cat.name];
      return { parentCategories, keywords };
    });
  }

  const product = await ProductModel.create({
    ...req.body,
    shop: shop.id,
    parentCategories,
    keywords,
    category: category.id,
  });

  res.status(201).json({
    success: true,
    body: { product },
  });
});

// Function to update a product
const updateProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const shop = await SellerProfileModel.findOne({ seller: req.seller.id });

  if (!shop) return next(new AppError('Shop not created', 404));

  const product = await ProductModel.findOneAndUpdate(
    { _id: productId, shop: shop.id },
    req.body,
    { new: true, runValidators: true },
  )
    .populate('category')
    .populate({ path: 'shop', populate: 'seller' })
    .populate('reviews');

  if (!product) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    body: { product },
  });
});

// Function to delete a product
const deleteProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const shop = await SellerProfileModel.findOne({ seller: req.seller.id });
  if (!shop) return next(new AppError('Shop not created', 404));

  let product = await ProductModel.findOneAndDelete({
    _id: productId,
    shop: shop.id,
  });
  if (!product) return next(new AppError('Not Found', 404));
  SavedProductModel.deleteMany({ product: productId });
  ReviewModel.deleteMany({ product: productId });
  ReportModel.deleteMany({ product: productId });

  res.status(200).json({
    success: true,
  });
});

const blockProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  let product = await ProductModel.findOneAndUpdate(
    {
      _id: productId,
    },
    { blocked: true },
    { new: true },
  );
  if (!product) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    body: { product },
  });
});

const unblockProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  let product = await ProductModel.findOneAndUpdate(
    {
      _id: productId,
    },
    { blocked: false },
    { new: true },
  );
  if (!product) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    body: { product },
  });
});

const favoriteProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.seller.id;

  let product = await ProductModel.findOne({ _id: productId });
  if (!product) return next(new AppError('Not Found', 404));

  let favorite = await SavedProductModel.findOne({
    product: productId,
    user: userId,
    field: 'favorite',
  });

  if (favorite) {
    await SavedProductModel.findOneAndDelete({
      product: productId,
      user: userId,
      field: 'favorite',
    });

    res.status(200).json({
      success: true,
      body: { message: 'Removed From Favorite' },
    });
  } else {
    await SavedProductModel.create({
      product: productId,
      user: userId,
      field: 'favorite',
    });

    res.status(200).json({
      success: true,
      body: { message: 'Added To Favorite' },
    });
  }
});

const wishlistProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.seller.id;

  let product = await ProductModel.findOne({ _id: productId });
  if (!product) return next(new AppError('Not Found', 404));

  let wishlist = await SavedProductModel.findOne({
    product: productId,
    user: userId,
    field: 'wishlist',
  });

  if (wishlist) {
    await SavedProductModel.findOneAndDelete({
      product: productId,
      user: userId,
      field: 'wishlist',
    });

    res.status(200).json({
      success: true,
      body: { message: 'Remove From Wishlist' },
    });
  } else {
    await SavedProductModel.create({
      product: productId,
      user: userId,
      field: 'wishlist',
    });

    res.status(200).json({
      success: true,
      body: { message: 'Added To Wishlist' },
    });
  }
});

const getFavoriteProducts = catchAsync(async (req, res, next) => {
  const userId = req.seller.id;

  let products = await SavedProductModel.find({
    user: userId,
    field: 'favorite',
  })
    .populate({
      path: 'product',
      populate: [
        { path: 'category' },
        { path: 'shop', populate: 'seller' },
        { path: 'reviews' },
      ],
    })
    .populate('user');

  res.status(200).json({
    success: true,
    body: { products },
  });
});

const getWishlistProducts = catchAsync(async (req, res, next) => {
  const userId = req.seller.id;

  let products = await SavedProductModel.find({
    user: userId,
    field: 'wishlist',
  })

    .populate({
      path: 'product',
      populate: [
        { path: 'category' },
        { path: 'shop', populate: 'seller' },
        { path: 'reviews' },
      ],
    })
    .populate('user');

  res.status(200).json({
    success: true,
    body: { products },
  });
});

module.exports = {
  getProducts,
  getSellerProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  blockProduct,
  unblockProduct,
  favoriteProduct,
  wishlistProduct,
  getFavoriteProducts,
  getWishlistProducts,
  getNearestProducts,
  getSellerProductsById,
};
