'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const orderSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          required: true,
        },
        ammount: {
          type: Number,
          required: true,
        },
        size: String,
        color: String,
      },
    ],
    totalAmmount: {
      type: Number,
      required: true,
    },
    message: String,
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: 'ShippingAddress',
    },
    status: {
      type: String,
      enum: [
        'ordered',
        'confirmed',
        'preparing',
        'packed',
        'handed',
        'cancelled',
      ],
      default: 'ordered',
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
const OrderModel = mongoose.model(
  'Order',
  orderSchema,
);

module.exports = OrderModel;
