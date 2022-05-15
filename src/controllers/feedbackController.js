const FeedbackModel = require('../models/feedbackModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createFeedback = catchAsync(async (req, res, next) => {
  const { content } = req.body;

  const feedback = await FeedbackModel.create({
    content,
  });

  res.status(201).json({
    success: true,
    body: { feedback },
  });
});

const getFeedbacks = catchAsync(async (req, res, next) => {
  const feedbacks = await FeedbackModel.find({});

  res.status(201).json({
    success: true,
    body: { feedbacks },
  });
});

const deleteFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params;

  const feedbacks = await FeedbackModel.deleteOne({ _id: feedbackId });

  res.status(201).json({
    success: true,
    body: { deleted: true },
  });
});

const updateFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params;
  const { content } = req.body;

  const feedback = await FeedbackModel.findByIdAndUpdate(
    { _id: feedbackId },
    { content },
    { new: true },
  );

  res.status(201).json({
    success: true,
    body: { feedback },
  });
});

module.exports = {
  createFeedback,
  getFeedbacks,
  deleteFeedback,
  updateFeedback,
};
