'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;
const SellerModel = require('../SellerModel');

// Creating a schema
const buyerProfileSchema = new Schema({
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

  profilePic: {
    type: String,
    trim: true,
  },

  about: {
    type: String,
    trim: true,
  },
});

// Creating model from a Schema
const BuyerProfileModel = mongoose.model('BuyerProfile', buyerProfileSchema);

module.exports = BuyerProfileModel;
