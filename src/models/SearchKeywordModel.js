'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const searchKeywordSchema = new Schema(
  {
    keyword: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
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
const SearchKeywordModel = mongoose.model('SearchKeyword', searchKeywordSchema);

module.exports = SearchKeywordModel;
