const {
  getTermsAndConditions,
  createTermsAndConditions,
} = require('../controllers/termsAndConditionController');
const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');

const termsAndConditionsRouter = require('express').Router();

termsAndConditionsRouter
  .route('/')
  .get(getTermsAndConditions)
  .post(adminRestrict, createTermsAndConditions);

module.exports = termsAndConditionsRouter;
