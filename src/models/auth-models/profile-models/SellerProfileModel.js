'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;
const SellerModel = require('../SellerModel');
const notificationSchema = require('../../NotificationSchema');

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

  notifications: {
    type: [notificationSchema],
    maxlength: 100,
    default: [],
  },

  blocked: { type: Boolean, default: false },
});

sellerProfileSchema.index({ location: '2dsphere' });

sellerProfileSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'shop',
});

// automatically delete oldest notifications
sellerProfileSchema.pre('save', function (next) {
  if (this.notifications.length > 100) {
    // Delete old data by keeping only the last 100 elements
    this.notifications = this.notifications.slice(-100);
  }
  next();
});

// Creating model from a Schema
const SellerProfileModel = mongoose.model('SellerProfile', sellerProfileSchema);

module.exports = SellerProfileModel;
