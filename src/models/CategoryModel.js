'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    parents : {
      type:[Schema.Types.ObjectId],
      ref: 'Category'
    }
  },
  {
    timestamps: true,
  },
);

// Creating model from a Schema
const CategoryModel = mongoose.model('Category', categorySchema);

module.exports = CategoryModel;
