const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

const slugify = require('slugify');

const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const AppError = require('../utils/appError');

const getAllRootCategories = catchAsync(async (req, res, next) => {
  const categories = await CategoryModel.find({ parentId: undefined });
  res.json({
    success: true,
    body: { total: categories.length, data: categories },
  });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { name, parentId, ...rest } = req.body;
  // Check for duplicating name under same parent category or root level categories
  const isDuplicatedName = await CategoryModel.find({
    parentId,
    name: { $regex: new RegExp(name, 'i') },
  });

  // $or: [
  //   { parentId: undefined, name: name.toLowerCase().trim() },
  //   { parentId, name: name.toLowerCase().trim() },
  // ],

  if (isDuplicatedName.length > 0)
    return next(
      new AppError('Duplicate category name under same parent or root', 400),
    );

  let parents = [];
  if (parentId) {
    const parent = await CategoryModel.findById(parentId);
    if (!parent) {
      return next(new AppError('Invalid Parent Id', 404));
    }
    console.log(parent.parents);
    if (parent) {
      parents = [...parent.parents];
    }
    parents.push(parentId);
  }

  let slug = slugify(name, {
    lower: true,
    trim: true,
  });

  const category = await CategoryModel.create({
    ...rest,
    name,
    parentId,
    parents,
    creator: req.admin.id,
    slug,
  });

  res.status(201).json({
    success: true,
    body: { category },
  });
});

const getFormattedUrl = async (id, url) => {
  const cat = await CategoryModel.findById(id);
  console.log(cat);
  if (cat) {
    url.unshift(cat);
    if (cat.parentId) await getFormattedUrl(cat.parentId, url);
    return url;
  }
};

const getSingleCategory = catchAsync(async (req, res, next) => {
  let category = await CategoryModel.findById(req.params.id);
  if (!category) return next(new AppError('Invalid Category Id'));

  // console.log(category)

  let childrens = await CategoryModel.find({
    parentId:category._id,
  });

  let url = [];
  url.unshift(category);
  if (category.parentId) {
    await getFormattedUrl(category.parentId, url);
  }

  const {
    parents,
    icons,
    clicks,
    _id,
    name,
    slug,
    parentId,
    createdAt,
    updatedAt,
  } = category;

  //increment category click count
  await CategoryModel.findByIdAndUpdate(category.id, { $inc: { clicks: 1 } });

  res.status(200).json({
    success: true,
    body: {
      _id,
      name,
      slug,
      parents,
      icons,
      clicks,
      parentId,
      createdAt,
      updatedAt,
      url,
      childrens,
    },
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  let { name, parentId, parents, ...rest } = req.body;

  const isValid = await CategoryModel.findById(req.params.id);
  if (!isValid) return next(new AppError('Invalid Category Id', 404));

  //Check for duplicating name under same parent category or root level categories
  // const isDuplicatedName = await CategoryModel.find({
  //   $or: [
  //     { parentId: undefined, name: name.toLowerCase().trim() },
  //     { parentId, name: name.toLowerCase().trim() },
  //   ],
  // });

  // if (!parentId) {
  //   let { parentId } = await CategoryModel.findById(req.params.id);
  // }

  const isDuplicatedName = await CategoryModel.find({
    parentId,
    name: { $regex: new RegExp(name, 'i') },
  });

  if (isDuplicatedName.length > 0)
    return next(
      new AppError('Duplicate category name under same parent or root', 400),
    );

  //change parents array based on parent category id
  if (parentId) {
    parents = [];
    const parent = await CategoryModel.findById(parentId);
    if (!parent) return next(new AppError('Invalid Parent Id', 404));
    if (parent.parents) parents = [...parent.parents];

    if (!parents.includes(parentId.toString())) {
      let convertedId = mongoose.Types.ObjectId(parentId);
      parents.push(convertedId);
    }
    //remove duplicate item
    parents = removeDuplicates(parents);
  }

  const category = await CategoryModel.findByIdAndUpdate(
    req.params.id,
    { 
      // name, 
      parentId, parents, ...rest },
    { new: true, runValidators: true },
  )

  if (name) {
    await ProductModel.updateMany(
      {
        $or: [
          { category: category._id },
          { parentCategories: { $in: [category._id] } },
        ],
      },
      {
        $pull: { keywords: isValid.name },
      },
    );

    await ProductModel.updateMany(
      {
        $or: [
          { category: category._id },
          { parentCategories: { $in: [category._id] } },
        ],
      },
      {
        $push: { keywords: category.name },
      },
    );
  }

  if (!category) return next(new AppError('Invalid Category Id', 404));

  res.status(200).json({
    success: true,
    body: { category },
  });
});

//helps to remove duplicating array of objects used in update category
const removeDuplicates = function uniq(a) {
  var seen = {};
  return a.filter(function (item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
};

const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) return next(new AppError('Invalid Category Id', 404));

  if (category.parentId) {
    //set parentId and parents
    await CategoryModel.updateMany(
      { parentId: category._id },
      {
        $set: { parentId: category.parentId },
        $pull: { parents: category._id },
      },
    );

    await CategoryModel.updateMany(
      { parents: { $in: [category._id] } },
      {
        $pull: { parents: category._id },
      },
    );

    await ProductModel.updateMany(
      { category: category._id },
      { $set: { category: category.parentId } },
    );

    await ProductModel.updateMany(
      { parentCategories: { $in: [category._id] } },
      {
        $pull: { parentCategories: category._id, keywords: category.name },
      },
    );
  } else {
    await CategoryModel.updateMany(
      { parentId: category._id },
      { $set: { parentId: undefined } },
    );

    await CategoryModel.updateMany(
      { parents: { $in: [category._id] } },
      {
        $pull: { parents: category._id },
      },
    );

    const isExistDefaultCategory = await CategoryModel.findOne({
      name: 'Others',
    });

    console.log(isExistDefaultCategory);

    if (isExistDefaultCategory) {
      await ProductModel.updateMany(
        { category: category._id },
        {
          $set: { category: isExistDefaultCategory._id },
          $push: {
            parentCategories: isExistDefaultCategory._id,
            keywords: isExistDefaultCategory.name,
          },
        },
      );

      await ProductModel.updateMany(
        { category: category._id },
        {
          $set: { category: isExistDefaultCategory._id },
          $pull: {
            parentCategories: category._id,
            keywords: category.name,
          },
        },
      );
    } else {
      const createdCategory = await CategoryModel.create({
        name: 'Others',
        slug: 'others',
        creator: req.admin.id,
      });

      await ProductModel.updateMany(
        { category: category._id },
        {
          $set: { category: createdCategory._id },

          $push: {
            parentCategories: createdCategory._id,
            keywords: createdCategory.name,
          },
        },
      );

      await ProductModel.updateMany(
        { category: category._id },
        {
          $set: { category: createdCategory._id },
          $pull: {
            parentCategories: category._id,
            keywords: category.name,
          },
        },
      );
    }
  }

  await CategoryModel.findByIdAndDelete(category._id);

  res.status(200).json({
    success: true,
  });
});

module.exports = {
  getAllRootCategories,
  createCategory,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
