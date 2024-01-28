'use strict';

// Importing mongoose and Schema
const mongoose = require('mongoose');
const validator = require('validator').default;
const bcrypt = require('bcryptjs');
const notificationSchema = require('../NotificationSchema');
const Schema = mongoose.Schema;

// Creating a schema
const sellerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },

    phone: {
      type: String,
      required: [true, 'Phone Number is Required!'],
      unique: true,
      // validate: {
      //   validator: function (v) {
      //     return validator.isMobilePhone(v, 'bn-BD')
      //   },
      //   message: 'This is not a valid Mobile Number',
      // },
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      // validate: {
      //   validator: validator.isEmail,
      //   message: 'This is not a valid email',
      // },
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },

    profilePic: {
      type: String,
    },
    //16 OCT 2022
    recent_sent_products: [Schema.Types.ObjectId],

    recent_clicked_products: [Schema.Types.ObjectId],

    registered_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    type: {
      type: String,
      enum: ['ordinary', 'official', 'verified'],
      default: 'ordinary',
    },
    notifications: {
      type: [notificationSchema],
      maxlength: 10,
      default: [],
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },

    password_changed_at: {
      type: Date,
      default: null,
      select: false,
    },

    deletedAt: {
      type: Date,
      default: null,
      select: false,
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

sellerSchema.virtual('sellerProfile', {
  ref: 'SellerProfile',
  localField: '_id',
  foreignField: 'seller',
  justOne: true,
});

// Encrypt the password
sellerSchema.pre(['save'], async function (next) {
  // To run encryption only if the password is changed
  if (!this.isModified('password')) return next();
  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  this.password_changed_at = Date.now();
  next();
});

// automatically delete oldest notifications
sellerSchema.pre('save', function (next) {
  if (this.notifications.length > 10) {
    // Delete old data by keeping only the last 100 elements
    this.notifications = this.notifications.slice(-10);
  }
  next();
});

// Check if the seller changed password after jwt timestamp
sellerSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.password_changed_at) {
    const timestamp = parseInt(this.password_changed_at.getTime() / 1000, 10);

    return JWTTimestamp < timestamp;
  }

  return false;
};

// Creating model from a Schema
const SellerModel = mongoose.model('Seller', sellerSchema);

module.exports = SellerModel;
