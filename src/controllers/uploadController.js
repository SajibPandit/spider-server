'use strict';

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const FileModel = require('../models/FileModel');

// Function to create a occasion
const uploadFile = catchAsync(async (req, res, next) => {
  const url = req.protocol + '://' + req.get('host');
  const uri = `${url}/files/${req.file.filename}`;

  const file = await FileModel.create({
    name: req.file.filename,
    endpoint: `/files/${req.file.filename}`,
  });

  res.status(200).json({
    success: true,
    body: { file },
  });
});

module.exports = {
  uploadFile,
};
