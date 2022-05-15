const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');
const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');
const {
  getReports,
  createReport,
  deleteReport,
} = require('../controllers/reportController');

const reportRouter = require('express').Router();

reportRouter
  .route('/')
  .get(adminRestrict, getReports)
  .post(sellerRestrict, createReport);

reportRouter.route('/:id').delete(adminRestrict, deleteReport);

module.exports = reportRouter;
