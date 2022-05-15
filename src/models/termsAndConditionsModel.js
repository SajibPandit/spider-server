'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const termsAndConditionsSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
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
const TermsAndConditionsModel = mongoose.model(
  'TermsAndConditions',
  termsAndConditionsSchema,
);

module.exports = TermsAndConditionsModel;
