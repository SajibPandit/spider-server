const TermsAndConditionsModel = require('../models/termsAndConditionsModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createTermsAndConditions = catchAsync(async (req, res, next) => {
  const { description } = req.body;
  await TermsAndConditionsModel.deleteMany({});
  const termsAndConditions = await TermsAndConditionsModel.create({
    description,
  });

  res.status(201).json({
    success: true,
    body: { termsAndConditions },
  });
});

const getTermsAndConditions = catchAsync(async (req, res, next) => {
  const termsAndConditions = await TermsAndConditionsModel.findOne({});

  res.status(201).json({
    success: true,
    body: { termsAndConditions },
  });
});

module.exports = {
  createTermsAndConditions,
  getTermsAndConditions,
};
