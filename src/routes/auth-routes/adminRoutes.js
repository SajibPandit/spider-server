'use strict';

const {
  adminRestrict,
} = require('../../middlewares/auth-guards/adminRestrict');
// Importing functions from the controller
const {
  getAdmins,
  signUp,
  getSingleAdmin,
  login,
  logout,
  getAdminStat,
  createAdmin,
} = require('../../controllers/auth-controllers/adminController');
const {
  superAdminRestrict,
} = require('../../middlewares/auth-guards/superAdminRestrict');

// Importing the express router
const adminRouter = require('express').Router();

// Setting up the routes
adminRouter.route('/').get(superAdminRestrict, getAdmins).post(signUp);
adminRouter.route('/create').post(superAdminRestrict, createAdmin);
adminRouter.route('/login').post(login);
adminRouter.route('/logout').post(logout);
adminRouter.route('/stat').get(adminRestrict, getAdminStat);
adminRouter.route('/:id').get(adminRestrict, getSingleAdmin);

module.exports = adminRouter;
