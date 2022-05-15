'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const savedProductSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    field: {
      type: String,
      enum: ['favorite', 'wishlist', 'saved'],
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  },
);

// Creating model from a Schema
const SavedProductModel = mongoose.model('SavedProduct', savedProductSchema);

module.exports = SavedProductModel;
