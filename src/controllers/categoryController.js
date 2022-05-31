const slugify = require('slugify');
const {
  getChildCategories,
  getFormattedSingleCategory,
} = require('../helpers/categoryHelper');
const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createFormattedCategory = (categories, parentId = null) => {
  const categoryList = [];
  let category;
  if (parentId == null) {
    category = categories.filter(cat => cat.parentId == undefined);
  } else {
    category = categories.filter(
      cat => cat.parentId?.toString() === parentId.toString(),
    );
  }
  for (cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      slug: cate.slug,
      icon: cate.icon,
      children: createFormattedCategory(categories, cate._id),
    });
  }

  return categoryList;
};

exports.getAllCategory = catchAsync(async (req, res) => {
  CategoryModel.find({}).then(category => {
    if (!category) {
      return next(new AppError('Category Not Found', 404));
    }
    res.json({
      success: true,
      body: { total: category.length, data: category },
    });
  });
});

exports.getAllRootCategories = catchAsync(async (req, res, next) => {
  CategoryModel.find({}).then(category => {
    if (category) {
      let roots = category.filter(cat => cat.parentId == undefined);
      if (roots.length === 0)
        return res.json({
          success: true,
          body: { total: 0, data: [] },
        });
      let formattedCat = [];
      let childs = [];
      if (roots) {
        for (root of roots) {
          formattedCat.push({
            _id: root.id,
            name: root.name,
            slug: root.slug,
            createdAt: root.createdAt,
            childrens: getChildCategories(root.id, category),
          });
        }
      }

      res.json({
        success: true,
        body: { total: formattedCat.length, data: formattedCat },
      });
    }
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  let categoryObj = {
    name: req.body.name,
    slug: slugify(req.body.name, {
      lower: true,
      trim: true,
    }),
    icon: req.body.icon,
  };

  let parents = [];

  if (req.body.parentId) {
    const parent = await CategoryModel.findById(req.body.parentId);
    if (!parent) {
      return next(new AppError('Parent Category Not Found', 404));
    }
    if (parent) {
      parents = [...parent.parents];
    }

    categoryObj.parentId = req.body.parentId;
    parents.push(req.body.parentId);
    categoryObj.parents = parents;
    categoryObj.url = `${parent.url}/${categoryObj.slug}`;

    const sisters = await CategoryModel.find({ parentId: req.body.parentId });
    for (sis of sisters) {
      if (sis.slug == categoryObj.slug) {
        return next(
          new AppError('Duplicate category name under same parent', 400),
        );
      }
    }
  } else {
    categoryObj.url = categoryObj.slug;
  }

  const category = new CategoryModel(categoryObj);
  category.save((err, category) => {
    if (err) {
      return next(new AppError(err.message, 400));
    }
    if (category) {
      res.status(201).json({
        success: true,
        body: { message: 'Category created successfully', category },
      });
    }
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await CategoryModel.findById({ _id: req.params.id });
  if (category) {
    await deleteSubCategory(category);
    await ProductModel.deleteMany({ category: category._id });
    await CategoryModel.findByIdAndDelete({ _id: req.params.id });
    return res
      .status(200)
      .send({ success: true, message: 'Category deleted successfully' });
  } else {
    return next(new AppError('Category Not Found', 404));
  }
});

const deleteSubCategory = async category => {
  const cat = await CategoryModel.find({ parentId: category._id }).then(cat => {
    if (cat.length > 0) {
      cat.map(c => deleteSubCategory(c));
    }
  });
  await ProductModel.deleteMany({ category: category._id });
  return await CategoryModel.findByIdAndDelete({ _id: category._id });
};

exports.getSingleCategory = catchAsync(async (req, res, next) => {
  //Changed by Sajib
  await CategoryModel.updateMany(
    { _id: req.params.id },
    { $inc: { clicks: 1 } },
  );
  CategoryModel.find({ _id: req.params.id }).then(category => {
    if (category.length === 0) {
      return next(new AppError('Category Not Found', 404));
    }

    CategoryModel.find({}).exec((error, categories) => {
      if (error) {
        return next(new AppError(err.message, 400));
      }
      if (categories) {
        const categoryList = getFormattedSingleCategory(
          req.params.id,
          categories,
          res,
          category, //passing for solve url problem
        );
        return res.status(200).json({
          success: true,
          body: categoryList,
        });
      }
    });
  });
});
