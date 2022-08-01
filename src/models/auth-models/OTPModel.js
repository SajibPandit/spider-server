const { Schema, model } = require('mongoose');

const OTPSchema = new Schema({
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  unique_session_id:{
    type: String,
    required: true,
  },
  secret_key: String,
  createdAt: { type: Date, default: Date.now },
});

OTPSchema.index({createdAt: 1},{expireAfterSeconds: 300});

const OTPModel = model('OTP', OTPSchema);

module.exports = OTPModel;
