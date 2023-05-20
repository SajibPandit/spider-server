'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const shippingAddressSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
    },
    address: {
      houseNo: String,
      street: String,
      area: {
        type: String,
        required: true,
      },
      upazila: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    isDefaultShippingAddress: {
      type: Boolean,
      default: false,
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
const ShippingAddressModel = mongoose.model(
  'ShippingAddress',
  shippingAddressSchema,
);

module.exports = ShippingAddressModel;
