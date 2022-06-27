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
    parentCategories: {
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
        if (this.reviews.length === 0) {
          reviews = 3;
        } else {
          const ratings = this.reviews.map(review => review.rating);
          const sum = ratings.reduce((acc, curr) => acc + curr);
          reviews = sum / ratings.length;
        }
        return Number((this.clicks * reviews) / this.impressions).toFixed(4);
      },
    },
    keywords: [String],
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

// productSchema.index({
//   title: 'text',
//   // description: "text"
// });

// productSchema.virtual('averageRating').get(function () {
//   if (this.reviews.length === 0) {
//     return 0;
//   }
//   const ratings = this.reviews.map(review => review.rating);
//   const sum = ratings.reduce((acc, curr) => acc + curr);
//   return sum / ratings.length;
// });

// Creating model from a Schema
const ProductModel = mongoose.model('Product', productSchema);

module.exports = ProductModel;
