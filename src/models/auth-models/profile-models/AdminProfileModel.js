'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;
const SellerModel = require('../SellerModel');

// Creating a schema
const adminProfileSchema = new Schema({
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    unique: true,
    required: [true, 'Admin Id Required'],
    trim: true,
    validate: {
      validator: async function (refId) {
        return (await SellerModel.countDocuments({ _id: refId })) === 0;
      },
      message: 'No Admin with Id!',
    },
  },

  shopName: {
    type: String,
    trim: true,
    default: null,
  },

  // profilePic: {
  //   type: String,
  //   trim: true,
  // default: null
  // },

  location: {
    type: String,
    trim: true,
    default: null,
  },

  description: {
    type: String,
    trim: true,
    default: null,
  },
});

// Creating model from a Schema
const AdminProfileModel = mongoose.model('AdminProfile', adminProfileSchema);

module.exports = AdminProfileModel;
