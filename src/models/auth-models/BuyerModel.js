'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const validator = require('validator').default;
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

// Creating a schema
const buyerSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },

  phone: {
    type: String,
    required: [true, 'Phone Number is Required!'],
    unique: true,
    validate: {
      validator: function (v) {
        return validator.isMobilePhone(v, 'bn-BD')
      },
      message: 'This is not a valid Mobile Number',
    },
  },

  // email: {
  //   type: String,
  //   required: [true, 'Email is required'],
  //   unique: true,
  //   validate: {
  //     validator: validator.isEmail,
  //     message: 'This is not a valid email',
  //   },
  //   lowercase: true,
  // },

  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },

  registered_at: {
    type: Date,
    default: Date.now,
    immutable: true
  },

  password_changed_at: {
    type: Date,
    default: null,
    select: false
  },

  deletedAt: {
    type: Date,
    default: null,
    select: false
  },
}, {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

buyerSchema.virtual('buyerProfile', {
  ref: 'BuyerProfile',
  localField: '_id',
  foreignField: 'buyer',
  justOne: true
});

// Encrypt the password
buyerSchema.pre(['save'], async function (next) {
  // To run encryption only if the password is changed
  if (!this.isModified('password')) return next();

  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  this.password_changed_at = Date.now()
  next();
});

// Check if the buyer changed password after jwt timestamp
buyerSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.password_changed_at) {
    const timestamp = parseInt(this.password_changed_at.getTime() / 1000, 10);

    return JWTTimestamp < timestamp;
  }

  return false;
};

// Creating model from a Schema
const BuyerModel = mongoose.model('Buyer', buyerSchema); ks

module.exports = BuyerModel;
