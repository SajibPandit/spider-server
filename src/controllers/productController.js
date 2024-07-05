'use strict';
// Importing the model
const SellerProfileModel = require('../models/auth-models/profile-models/SellerProfileModel');
const SellerModel = require('../models/auth-models/SellerModel');
const ProductModel = require('../models/ProductModel');
const ReportModel = require('../models/reportModel');
const ReviewModel = require('../models/reviewModel');
const SavedProductModel = require('../models/SavedProductsModel');
const CategoryModel = require('../models/CategoryModel');
const SearchKeywordModel = require('../models/SearchKeywordModel');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const generateSlug = require('../utils/slugUtils');

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
  let {
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
    userId,
    history,
  } = req.query;

  const sort = {};

  let willFilteredProducts = [];

  if (sortBy) {
    const parts = sortBy.split(':');

    if (history) {
      willFilteredProducts = history.split(',');
    }
    if (parts[0] === 'bestMatch' && skip == 0) {
      sort.impressionCost = 1;
    } else {
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    // if (parts[0] === 'bestMatch') {
    //   sort.impressionCost = 1;
    //   if ((userId && skip == 0) || (userId && !skip)) {
    //     await SellerModel.findByIdAndUpdate(userId, {
    //       recent_sent_products: [],
    //     });
    //   }
    //   // skip = 0;
    // } else {
    //   sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    // }

    // if (userId && skip != 0) {
    //   const sellerProfile = await SellerModel.findOne({
    //     _id: userId,
    //   });

    //   willFilteredProducts = [...sellerProfile.recent_sent_products];
    // }

    // if (!userId && history) {
    //   willFilteredProducts = history.split(',');
    //   console.log(willFilteredProducts);
    // }
    // // if (skip) skip = 0;
  }

  let query = {};

  if (willFilteredProducts) {
    query = {
      ...query,
      _id: {
        $nin: willFilteredProducts,
      },
    };
  }
  // console.log(willFilteredProducts);

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

  // get nearest products
  if (maxDistance && latitude && longitude) {
    query = {
      ...query,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance * 1000,
        },
      },
    };
  }

  if (searchKey) {
    //Remove all the unnecessary spaces
    searchKey = searchKey.trim();
    // Going to save the searchKey as keyword in the database and also the coordinates
    // Firstly check keyword aleady exists or not
    const keywordExists = await SearchKeywordModel.findOne({
      keyword: searchKey.toLowerCase(),
    });

    // If not then save the keyword to the database
    if (!keywordExists) {
      let keywordData = {};
      keywordData.keyword = searchKey.toLowerCase();
      if (userId) {
        keywordData.seller = userId;
      }
      if (longitude && latitude) {
        keywordData = {
          ...keywordData,
          location: {
            coordinates: [longitude, latitude],
          },
        };
      }
      await SearchKeywordModel.create({ ...keywordData });
    } else {
      // If exists make increment of the count number
      keywordExists.count = keywordExists.count + 1;
      await keywordExists.save();
    }

    searchKey = searchKey.trim();
    query = {
      ...query,
      $or: [
        { title: { $regex: searchKey, $options: 'i' } },
        { description: { $regex: searchKey, $options: 'i' } },
        { keywords: { $in: [new RegExp(searchKey, 'i')] } },
        { title: { $in: new RegExp(searchKey.split(' '), 'i') } },
      ],
    };
  }

  if (condition) query = { ...query, new: condition === 'new' };
  if (minPrice && maxPrice)
    query = { ...query, price: { $gte: minPrice, $lte: maxPrice } };
  else if (minPrice) query = { ...query, price: { $gte: minPrice } };
  else if (maxPrice) query = { ...query, price: { $lte: maxPrice } };

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

  // increase impression by one and calculate impression cost
  if (products.length > 0) {
    products.forEach(async function (product) {
      let impressionCost;
      if (product.averageRating == 0) {
        impressionCost = (
          product.impressionCost +
          product.impressions / product.clicks
        ).toFixed(2);
      } else {
        impressionCost = (
          product.impressionCost +
          (product.impressions / product.clicks) * (5 / product.averageRating)
        ).toFixed(2);
      }
      let impressions = product.impressions + 1;
      await ProductModel.findByIdAndUpdate(product.id, {
        impressionCost,
        impressions,
      });
    });
  }
  // Changed by Sajib
  // await ProductModel.updateMany(query, { $inc: { impressions: 1 } });

  if (minRating)
    products = products.filter(product => product.averageRating >= minRating);

  // if (maxDistance && latitude && longitude) {
  //   products = products.filter(product => {
  //     if (!product.shop) return false;

  //     const distance = getDistanceFromLatLonInKm(
  //       product.shop.location.coordinates[0],
  //       product.shop.location.coordinates[1],
  //       latitude,
  //       longitude,
  //     );
  //     return distance < maxDistance;
  //   });
  // }
  // if (sortBy === 'distance' && latitude && longitude) {
  //   products = products.sort((a, b) => {
  //     if (!a.shop) return 1;
  //     if (!b.shop) return -1;

  //     const distanceA = getDistanceFromLatLonInKm(
  //       a.shop.location.coordinates[0],
  //       a.shop.location.coordinates[1],
  //       latitude,
  //       longitude,
  //     );
  //     const distanceB = getDistanceFromLatLonInKm(
  //       b.shop.location.coordinates[0],
  //       b.shop.location.coordinates[1],
  //       latitude,
  //       longitude,
  //     );
  //     return distanceA - distanceB;
  //   });
  // }

  // if (!sortBy) products = products.sort(() => 0.5 - Math.random());

  //code for trcking send products
  //check if the seller is logged in or not
  // if (userId) {
  //   const sellerProfile = await SellerModel.findOne({ _id: userId });

  //   let recent_sent_products = [...sellerProfile.recent_sent_products];

  //   //add new item to the first of the array
  //   products.forEach(value => {
  //     if (!recent_sent_products.includes(value._id)) {
  //       recent_sent_products.unshift(value._id);
  //     }
  //   });

  //   //delete last item from the array
  //   if (recent_sent_products.length > 112) {
  //     let extra_products = recent_sent_products - 112;
  //     recent_sent_products.splice(-extra_products);
  //   }

  //   sellerProfile.recent_sent_products = recent_sent_products;

  //   await sellerProfile.save();
  // }

  //const total =await ProductModel.countDocuments();

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

const generateUniqueSlugFromProductsData = catchAsync(
  async (req, res, next) => {
    const products = await ProductModel.find();
    for (let product of products) {
      let slug = generateSlug(product.title);
      let existingProduct = await ProductModel.findOne({
        slug,
        _id: { $ne: product._id },
      });

      // If slug exists, append a unique identifier
      if (existingProduct) {
        let counter = 1;
        let newSlug = `${slug}-${counter}`;
        while (
          await ProductModel.findOne({
            slug: newSlug,
            _id: { $ne: product._id },
          })
        ) {
          counter++;
          newSlug = `${slug}-${counter}`;
        }
        slug = newSlug;
      }

      product.slug = slug;
      await product.save();
      console.log(
        `Updated product: ${product.title} with slug: ${product.slug}`,
      );
    }
    console.log('All products updated with slugs.');
  },
);

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
  const { userId } = req.query;

  let product = await ProductModel.findOne({ _id: productId })
    .populate('category')
    .populate({ path: 'shop', populate: 'seller' })
    .populate('reviews');

  if (!product) return next(new AppError('Not Found', 404));

  //Changed by Sajib
  //increment product click count
  await ProductModel.updateMany({ _id: productId }, { $inc: { clicks: 1 } });

  const reviews = await ReviewModel.find({ product: productId });

  let rating;
  if (reviews.length === 0) {
    rating = 2.5;
  } else {
    rating = product.averageRating;
  }

  let popularity = Number(
    ((product.clicks + 1) * rating) / product.impressions,
  ).toFixed(4);

  await ProductModel.findOneAndUpdate({ _id: productId }, { popularity });

  //code for trcking recent_clicked_products
  //check if the seller is logged in or not
  if (userId) {
    const profile = await SellerModel.findById(userId);

    let recent_clicked_products = [...profile.recent_clicked_products];

    //delete last item from the array
    if (recent_clicked_products.length > 111) {
      recent_clicked_products.pop();
    }

    //check if the item is already exists or not
    if (!recent_clicked_products.includes(product_id)) {
      //add new item to the first of the array
      recent_clicked_products.unshift(product._id);
    }

    profile.recent_clicked_products = recent_clicked_products;
    await profile.save();

    // await SellerModel.findOneAndUpdate(
    //   { _id: profile._id },
    //   recent_clicked_products,
    //   { runValidators: true },
    // );
  }

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
  let impressionCost;
  let impressions = 1;
  let clicks = 1;

  const category = await CategoryModel.findById(req.body.category).populate({
    path: 'parents',
    populate: 'category',
  });

  if (!category) return next(new AppError('Category not exists', 404));

  keywords.push(category.name);

  if (category.parents?.length > 0) {
    category.parents.map(cat => {
      parentCategories = [...parentCategories, cat._id];
      keywords = [...keywords, cat.name];
      return { parentCategories, keywords };
    });
  }
  //Check any product is exists or not
  const count = await ProductModel.countDocuments();

  //if not exists then impressionCost will be 5 otherwise it will take from one random document
  if (count == 0) {
    impressionCost = 5;
  } else {
    const product = await ProductModel.find({})
      .sort({ impressionCost: 1 })
      .limit(1);
    impressionCost = product[0].impressionCost;
  }

  const product = await ProductModel.create({
    ...req.body,
    shop: shop.id,
    parentCategories,
    keywords,
    category: category.id,
    location: shop.location, //new
    impressionCost,
    impressions,
    clicks,
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
  generateUniqueSlugFromProductsData,
};
