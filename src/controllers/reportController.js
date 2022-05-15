const ReportModel = require('../models/reportModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createReport = catchAsync(async (req, res, next) => {
  const { product, details } = req.body;
  const seller = req.seller.id;

  const available = await ReportModel.findOne({ product, seller });
  if (!!available)
    return next(new AppError('Already reported the product', 400));

  const report = await ReportModel.create({
    product,
    seller,
    details,
  });

  res.status(201).json({
    success: true,
    body: { report },
  });
});

const getReports = catchAsync(async (req, res, next) => {
  const reports = await ReportModel.find({});

  res.status(201).json({
    success: true,
    body: { reports },
  });
});

const deleteReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const report = await ReportModel.findByIdAndDelete(id);

  if (!report) return next(new AppError('No report found', 404));

  res.status(201).json({
    success: true,
    body: { deleted: true },
  });
});

module.exports = {
  createReport,
  getReports,
  deleteReport,
};
