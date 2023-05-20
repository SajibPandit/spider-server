'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const auctionSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },

    offeredPrice: {
      type: Number,
      required: true,
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
const AuctionModel = mongoose.model('Auction', auctionSchema);

module.exports = AuctionModel;
