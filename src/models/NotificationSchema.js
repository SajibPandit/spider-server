// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const notificationSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = notificationSchema;
