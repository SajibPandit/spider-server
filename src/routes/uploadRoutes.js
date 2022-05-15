'use strict';

const { uploadFile } = require('../controllers/uploadController');
const upload = require('../middlewares/upload');

// Importing the express router
const uploadRouter = require('express').Router();

// Setting up the routes
uploadRouter.route('/')
    .post(upload.single('file'), uploadFile)

module.exports = uploadRouter;
