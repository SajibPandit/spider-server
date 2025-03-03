'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const SellerProfileModel = require('./auth-models/profile-models/SellerProfileModel');
const SellerModel = require('../models/auth-models/SellerModel');
const generateSlug = require('../utils/slugUtils');
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
    parentCategories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'Title is required'],
    },
    //adding slug to product model
    slug: {
      type: String,
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    isAvailable: { type: Boolean, default: true },
    description: { type: String },
    deletedAt: { type: Date },
    thumbnail: { type: String },
    images: [{ type: String }],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    new: { type: Boolean, default: true },
    blocked: { type: Boolean, default: false },
    clicks: {
      type: Number,
      default: 5,
    },
    impressions: {
      type: Number,
      default: 1,
    },
    averageRating: {
      type: Number,
      default: 0,
      default: function () {
        if (this.reviews.length === 0) {
          return 0;
        }
        const ratings = this.reviews.map(review => review.rating);
        const sum = ratings.reduce((acc, curr) => acc + curr);
        return sum / ratings.length;
      },
    },
    popularity: {
      type: Number,
      default: function () {
        let reviews;
        if (this.averageRating === 0) {
          reviews = 2.5;
        } else {
          const ratings = this.reviews.map(review => review.rating);
          const sum = ratings.reduce((acc, curr) => acc + curr);
          reviews = sum / ratings.length;
        }
        return Number((this.clicks * reviews) / this.impressions).toFixed(4);
      },
    },

    impressionCost: {
      type: Number,
      // set: function(){
      //   let ictr = 1 / (this.clicks / this.impressions);
      //   console.log('From iC', ictr);
      //   return this.impressionCost + ictr;
      // },
      default: function () {
        let ictr = 1 / (this.clicks / this.impressions);
        return this.impressionCost + ictr;
      },
    },
    keywords: [String],

    isInAuction: {
      type: Boolean,
      default: false,
    },
    highestAuctionPrice: {
      type: Number,
      default: 0,
    },
    highestAuctionPriceByBuyer: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
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
//new
productSchema.index({ location: '2dsphere' });

// productSchema.virtual('location').get(function () {
//   const seller = SellerProfileModel.findOne({ seller: this.seller });
//   return seller.location;
// });

// productSchema.pre('updateMany', async function (next) {
//   // if (this.isModified('clicks') || this.isModified('impressions')) {
//   //   this.ratio = this.impresion / this.clicks;
//   //   next();
//   // }
//   const ratio = Number(this.impresion) / Number(this.clicks);
//   console.log(this.ratio);
//   console.log(this.clicks);
//   console.log(this.impressions);

//   this.ratio = ratio;
//   next();
// });

productSchema.virtual('avgRating').get(function () {
  if (this.reviews.length === 0) {
    return 0;
  }
  const ratings = this.reviews.map(review => review.rating);
  const sum = ratings.reduce((acc, curr) => acc + curr);
  console.log(sum / ratings.length);
  return sum / ratings.length;
});

// productSchema.virtual('ICTRatio').get(function () {
//   let reviews;
//   if (this.reviews.length === 0) {
//     reviews = 3;
//   } else {
//     const ratings = this.reviews.map(review => review.rating);
//     const sum = ratings.reduce((acc, curr) => acc + curr);
//     reviews = sum / ratings.length;
//   }
//   return Number((this.clicks * reviews) / this.impressions).toFixed(4);
// });

// auto calculate impression cost
// productSchema.pre(
//   ['save'
//   , 'findOneAndUpdate', 'updateOne', 'updateMany'
// ],
//   function (next) {
//     let product = this;
//     let impression = 1 / (product.clicks / product.impressions);
//     console.log(product.clicks, product.impressions)
//     console.log(impression);
//     this.impressionCost = impression
//     next();
//   },
// );

// Middleware to generate slug before saving
productSchema.pre('save', async function (next) {
  if (this.isModified('title')) {
    let slug = generateSlug(this.title);
    let existingProduct = await ProductModel.findOne({
      slug,
      _id: { $ne: this._id },
    });

    // If slug exists, append a unique identifier
    if (existingProduct) {
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (
        await ProductModel.findOne({ slug: newSlug, _id: { $ne: this._id } }) //check existing not including this product
      ) {
        counter++;
        newSlug = `${slug}-${counter}`;
      }
      slug = newSlug;
    }

    this.slug = slug;
  }
  next();
});

// Creating model from a Schema
const ProductModel = mongoose.model('Product', productSchema);

module.exports = ProductModel;
