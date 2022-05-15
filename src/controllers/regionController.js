const RegionModel = require('../models/regionModel');
const AppError = require('../utils/appError');

const createRegion = catchAsync(async (req, res, next) => {
  const region = await RegionModel.create({
    ...req.body,
  });

  res.status(201).json({
    success: true,
    body: { region },
  });
});

const updateRegion = catchAsync(async (req, res, next) => {
  const { regionId } = req.params;

  const region = await RegionModel.findOneAndUpdate(
    { _id: regionId },
    req.body,
    { new: true, runValidators: true },
  );

  if (!region) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    body: { region },
  });
});

// function to get all regions
const getRegions = catchAsync(async (req, res, next) => {
  const regions = await RegionModel.find();

  res.status(200).json({
    success: true,
    body: { regions },
  });
});

// function to delete a region
const deleteRegion = catchAsync(async (req, res, next) => {
  const { regionId } = req.params;
  let region = await RegionModel.findOneAndDelete({
    _id: regionId,
  });
  if (!region) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
  });
});

// return all methods in an object
module.exports = {
  createRegion,
  updateRegion,
  getRegions,
  deleteRegion,
};
