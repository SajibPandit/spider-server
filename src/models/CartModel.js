// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const cartSchema = new Schema({
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      ammount: {
        type: Number,
        required: true,
      },
      size: String,
      color: String,
    },
  ],
});

// Creating model from a Schema
const CartModel = mongoose.model('Cart', cartSchema);

module.exports = CartModel;
