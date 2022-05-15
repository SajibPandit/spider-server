const jwt = require('jsonwebtoken');
const {
  adminRole,
  customerRole,
  sellerRole,
} = require('../../models/auth-models/roles');

const getJwtByUserRole = role => {
  switch (role) {
    case adminRole:
      return process.env.JWT_SECRET_FOR_ADMIN;

    case customerRole:
      return process.env.JWT_SECRET_FOR_CUSTOMER;

    case sellerRole:
      return process.env.JWT_SECRET_FOR_SELLER;

    default:
      return '';
  }
};

// Signing a token
const signToken = (role, id) => {
  const jwtSecret = getJwtByUserRole(role);

  return jwt.sign({ id }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Send token to client
const sendToken = (role, userDoc, statusCode, res) => {
  const token = signToken(role, userDoc._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  // if (process.env.NODE_ENV == 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
  });
};

module.exports = {
  signToken,
  sendToken,
};
