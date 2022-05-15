const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');
const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');
const {
  getFeedbacks,
  createFeedback,
  deleteFeedback,
  updateFeedback,
} = require('../controllers/feedbackController');

const feedbackRouter = require('express').Router();

feedbackRouter.route('/').get(adminRestrict, getFeedbacks).post(createFeedback);

feedbackRouter.route('/:feedbackId').delete(adminRestrict, deleteFeedback);

module.exports = feedbackRouter;
