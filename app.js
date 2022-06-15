'use strict';

// Imports
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const router = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');
const cookieParser = require('cookie-parser');
const expressMongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const compression = require('compression');
const path = require('path');
const cors = require('cors');

//Importing firebase config
require('./src/firebase/services');
// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');

// Creating the express app
const app = express();

app.use(cors({ origin: '*' }));
// Security Middleware
app.use(helmet());
// Compression Middleware
app.use(compression());

// Parsing JSON, Form-Data and Cookies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Directory
app.use('/files', express.static(path.join(__dirname, 'public/storage/files')));
app.use(express.static(path.join(__dirname, 'client/build/')));

// Sanitizing user data
app.use(expressMongoSanitize());

// Prevent XSS attacks
app.use(xssClean());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Register the routers
app.use('/api/v1', router);

// Using the errorHandler middleware
app.use(errorHandler);

// Exporting the app
module.exports = app;
