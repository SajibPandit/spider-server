const catchAsync = require('../utils/catchAsync');

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

  //Check for duplicating name under same parent category or root level categories
  const isDuplicatedName = await CategoryModel.find({
    $or: [
      { parentId: undefined, name: name.toLowerCase().trim() },
      { parentId, name: name.toLowerCase().trim() },
    ],
  });

  if (isDuplicatedName)
    return next(
      new AppError('Duplicate category name under same parent or root', 400),
    );

  let parents = [];
  if (parentId) {
    const parent = await CategoryModel.findById(parentId);
    if (!parent) {
      return next(new AppError('Invalid Parent Id', 404));
    }
    if (parent) {
      parents = [...parent.parents];
    }
    parents.push(parentId);
  }

  const category = CategoryModel.create({
    ...rest,
    name,
    parentId,
    parents,
    creator: req.admin.id,
  });

  res.status(201).json({
    success: true,
    body: { category },
  });
});

const getFormattedUrl = async (category, url) => {
  const cat = await CategoryModel.findById(category.parentId);
  if (cat) {
    url.unshift({ ...cat });
    if (cat.parentId) getFormattedUrl(cat, url);
  }
};

const getCategory = catchAsync(async (req, res, next) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) return next(new AppError('Invalid Category Id'));

  const childrens = await CategoryModel.find({ parentId: category._id });
  let url = [];
  url.unshift({ ...category });
  if (category.parentId) {
    await getFormattedUrl(category, url);
  }
  res.status(200).json({
    success: true,
    body: { ...category, url, childrens },
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { name, parentId, parents, ...rest } = req.body;

  //Check for duplicating name under same parent category or root level categories
  const isDuplicatedName = await CategoryModel.find({
    $or: [
      { parentId: undefined, name: name.toLowerCase().trim() },
      { parentId, name: name.toLowerCase().trim() },
    ],
  });

  if (isDuplicatedName)
    return next(
      new AppError('Duplicate category name under same parent or root', 400),
    );

  //change parents array based on parent category id
  if (parentId) {
    parents = [];
    const parent = await CategoryModel.findById(parentId);
    if (!parent) return next(new AppError('Invalid Parent Id', 404));
    if (parent) parents = [...parent.parents];

    parents.push(parentId);
  }

  const category = await CategoryModel.findOneAndUpdate(
    req.params.id,
    { name, parentId, parents, ...rest },
    { new: true, runValidators: true },
  );

  if (!category) return next(new AppError('Invalid Category Id', 404));

  res.status(200).json({
    success: true,
    body: { category },
  });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) return next(new AppError('Invalid Parent Id', 404));
  
  
})

module.exports = {
  getAllRootCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};
