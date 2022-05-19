'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const SellerProfileModel = require('./auth-models/profile-models/SellerProfileModel');
const Schema = mongoose.Schema;

// Creating a schema
const productSchema = new Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      immutable: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please Enter a Category'],
    },
    parentCategories:{
      type: [Schema.Types.ObjectId],
      ref: 'Category',
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'Title is required'],
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
    },

    // location: {
    //   type: {
    //     type: String,
    //     enum: ['Point'],
    //     default: 'Point',
    //   },
    //   coordinates: {
    //     type: [Number],
    //   },
    // },

    isAvailable: { type: Boolean, default: true },
    description: { type: String },
    deletedAt: { type: Date },
    thumbnail: { type: String },
    images: [{ type: String }],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    new: { type: Boolean, default: true },
    blocked: { type: Boolean, default: false },
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

// productSchema.index({ location: '2dsphere' });

productSchema.virtual('location').get(function () {
  const seller = SellerProfileModel.findOne({ seller: this.seller });
  return seller.location;
});

productSchema.virtual('averageRating').get(function () {
  if (this.reviews.length === 0) {
    return 0;
  }
  const ratings = this.reviews.map(review => review.rating);
  const sum = ratings.reduce((acc, curr) => acc + curr);
  return sum / ratings.length;
});

// Creating model from a Schema
const ProductModel = mongoose.model('Product', productSchema);

module.exports = ProductModel;
