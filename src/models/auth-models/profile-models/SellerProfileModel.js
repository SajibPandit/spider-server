'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;
const SellerModel = require('../SellerModel');

const pointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    // required: true
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

// Creating a schema
const sellerProfileSchema = new Schema({
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    unique: true,
    required: [true, 'Seller Id Required'],
    trim: true,
    immutable: true,
    validate: {
      validator: async function (refId) {
        return (await SellerModel.countDocuments({ _id: refId })) > 0;
      },
      message: 'No Seller with Id!',
    },
  },

  shopName: {
    type: String,
    trim: true,
    default: null,
  },

  profilePic: {
    type: String,
    trim: true,
    default: null,
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },

  description: {
    type: String,
    trim: true,
    default: null,
  },
  region: {
    type: Schema.Types.ObjectId,
    ref: 'Region',
    immutable: true,
  },
  phone: {
    type: String,
    trim: true,
  },

  //16 OCT 2022
  // recent_sent_products: [Schema.Types.ObjectId],

  // recent_clicked_products: [Schema.Types.ObjectId],
  // location: {
  //   type: {
  //     type: String,
  //     enum: ['Point'],
  //   },
  //   coordinates: {
  //     type: [Number],
  //     // required: true,
  //   },
  // },

  blocked: { type: Boolean, default: false },
});

sellerProfileSchema.index({ 'location.coordinates': '2d' });

sellerProfileSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'shop',
});

// Creating model from a Schema
const SellerProfileModel = mongoose.model('SellerProfile', sellerProfileSchema);

module.exports = SellerProfileModel;
