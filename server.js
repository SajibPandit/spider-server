'use strict';

// Configuring the environment variables
require('dotenv').config();
const PORT = process.env.PORT || 8000;
//const HOST = process.env.HOST || 'localhost';

// Database Connection
require('./src/db/config');

// Importing the express app
const app = require('./app');

// Starting the server
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

//configuring socket server
const io = require('socket.io')(server, {
  // pingTimeout: 60000,
  cors:"*"
});

//for globally access of all files
global.io = io;

// Handle Unhandled Rejections
process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection! Shutting down the server...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
