const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

const slugify = require('slugify');

const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const AppError = require('../utils/appError');

const {
  getChildCategories,
  getFormattedSingleCategory,
} = require('../helpers/categoryHelper');

// const getAllRootCategories = catchAsync(async (req, res, next) => {
//   const categories = await CategoryModel.find({ parentId: undefined });
//   res.json({
//     success: true,
//     body: { total: categories.length, data: categories },
//   });
// });

// const getChildCategories = (id, categories) => {
//   const childCategories = categories.filter(c => c.parentId?.toString() === id);

//   return childCategories.map(cate => ({
//     _id: cate.id,
//     name: cate.name,
//     slug: cate.slug,
//     icon: cate.icon,
//     parentId: cate.parentId,
//     childrens: getChildCategories(cate.id, categories),
//   }));
// };

const getAllRootCategories = catchAsync(async (req, res, next) => {
  CategoryModel.find({})
    .sort({ clicks: -1 })
    .then(category => {
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
              icon: root.icon,
              createdAt: root.createdAt,
              childrens: getChildCategories(root.id, category),
            });
          }
        }

        // Move the category named others to the last
        if (formattedCat[formattedCat.length - 1].name != 'Others') {
          const indexOfOthersCategory = formattedCat.findIndex(object => {
            return object.name == 'Others';
          });

          formattedCat.push(formattedCat.splice(indexOfOthersCategory, 1)[0]);
        }

        res.json({
          success: true,
          body: { total: formattedCat.length, data: formattedCat },
        });
      }
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

  await CategoryModel.create({
    name: 'Others',
    slug: 'others',
    creator: req.admin.id,
    parentId: category._id,
    icon: 'https://cdn-icons-png.flaticon.com/512/8215/8215476.png',
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

// const getSingleCategory = catchAsync(async (req, res, next) => {
//   let category = await CategoryModel.findById(req.params.id);
//   if (!category) return next(new AppError('Invalid Category Id'));

//   // console.log(category)
//   let formattedChildren = [];

//   let childrens = await CategoryModel.find({
//     parentId: category._id,
//   });

//   for(children of childrens) {
//     let childs = await CategoryModel.find({
//       parentId: children._id,
//     });

//     console.log(childs);

//     children.childrens = childs;

//     formattedChildren.push(children)
//   }

//   // childrens.forEach(async function (children,i) {
//   //   let childs = await CategoryModel.find({
//   //     parentId: children._id,
//   //   });

//   //   childrens[i].childrens = childs;

//   //   // children.childrens = childs;
//   // });

//   let url = [];
//   url.unshift(category);
//   if (category.parentId) {
//     await getFormattedUrl(category.parentId, url);
//   }

//   const {
//     parents,
//     icons,
//     clicks,
//     _id,
//     name,
//     slug,
//     parentId,
//     createdAt,
//     updatedAt,
//   } = category;

//   //increment category click count
//   await CategoryModel.findByIdAndUpdate(category.id, { $inc: { clicks: 1 } });

//   res.status(200).json({
//     success: true,
//     body: {
//       _id,
//       name,
//       slug,
//       parents,
//       icons,
//       clicks,
//       parentId,
//       createdAt,
//       updatedAt,
//       url,
//       childrens:formattedChildren,
//     },
//   });
// });

const getSingleCategory = catchAsync(async (req, res, next) => {
  //Changed by Sajib
  CategoryModel.find({ _id: req.params.id }).then(category => {
    if (category.length === 0) {
      return next(new AppError('Category Not Found', 404));
    }

    CategoryModel.find({})
      .sort({ clicks: -1 })
      .exec((error, categories) => {
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

          // Move the category named others to the last
          if (
            categoryList.childrens[categoryList.childrens.length - 1].name !=
            'Others'
          ) {
            const indexOfOthersCategory = categoryList.childrens.findIndex(
              object => {
                return object.name == 'Others';
              },
            );

            categoryList.childrens.push(
              categoryList.childrens.splice(indexOfOthersCategory, 1)[0],
            );
          }

          return res.status(200).json({
            success: true,
            body: categoryList,
          });
        }
      });
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

  if (name) {
    const isDuplicatedName = await CategoryModel.find({
      parentId,
      name: { $regex: new RegExp(name, 'i') },
    });

    if (isDuplicatedName.length > 0)
      return next(
        new AppError('Duplicate category name under same parent or root', 400),
      );
  }

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
      parentId,
      parents,
      ...rest,
    },
    { new: true, runValidators: true },
  );

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
        icon: 'https://cdn-icons-png.flaticon.com/512/8215/8215476.png',
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
