'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemsSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
  }
}, {
  _id: false
})

// Creating a schema
const wishlistSchema = new Schema({

  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true,
    unique: true,
    immutable: true
  },

  items: {
    type: [itemsSchema],
    default: []
  }

}, {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

// Creating model from a Schema
const WishlistModel = mongoose.model('Wishlist', wishlistSchema);

module.exports = WishlistModel;
