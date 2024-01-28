'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const upgradeSellerTypeSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
    },
    requestedType: {
      type: String,
      enum: ['ordinary', 'official', 'verified'],
      required: true,
    },
    message: String,

    // Will handle by admin
    isBlocked: {
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
const UpgradeSellerTypeModel = mongoose.model(
  'UpgradeSellerType',
  upgradeSellerTypeSchema,
);

module.exports = UpgradeSellerTypeModel;
