'use strict';

const {
  getAllCategory,
  createCategory,
  deleteCategory,
  getSingleCategory,
  getAllRootCategories,
} = require('../controllers/categoryController');
const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');

const categoryRouter = require('express').Router();

categoryRouter
  .route('/')
  .get(getAllRootCategories)
  .post(adminRestrict, createCategory);
categoryRouter
  .route('/:id')
  .get(getSingleCategory)
  .delete(adminRestrict, deleteCategory);

module.exports = categoryRouter;
