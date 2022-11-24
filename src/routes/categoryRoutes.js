'use strict';

// const {
//   getAllCategory,
//   createCategory,
//   deleteCategory,
//   getSingleCategory,
//   getAllRootCategories,
//   updateCategory
// } = require('../controllers/categoryController');

const {
  getAllRootCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/catController');

const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');

const categoryRouter = require('express').Router();

categoryRouter
  .route('/')
  .get(getAllRootCategories)
  .post(adminRestrict, createCategory);
categoryRouter
  .route('/:id')
  .get(getSingleCategory)
  .delete(adminRestrict, deleteCategory)
  .put(adminRestrict, updateCategory);

module.exports = categoryRouter;
