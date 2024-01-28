const CartModel = require('../models/CartModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

//@route   : GET /api/v1/carts
//@access  : seller only
//@details : get all cart items for a seller
const getCartItems = catchAsync(async (req, res, next) => {
  const cartItems = await CartModel.findOne({ seller: req.seller.id });

  if (!cartItems) {
    return next(new AppError('No cart items found for this user', 404));
  }

  res.status(200).json({
    sucess: true,
    body: { cartItems },
  });
});

//@route   : POST /api/v1/carts
//@access  : seller only
//@details : add new item in the cart or update a existing cart item data
const addAndUpdateCartItem = catchAsync(async (req, res, next) => {
  const { product, quantity, ammount } = req.body;
  if (!product || !quantity || !ammount) {
    return next(
      new AppError(
        'You must need to provide productId , quantity and ammount',
        400,
      ),
    );
  }
  const cartItems = await CartModel.findOne({ seller: req.seller.id });

  // check cart item already exists for a seller or not
  if (cartItems) {
    const itemExists = await CartModel.findOne({
      seller: req.seller.id,
      'items.product': product,
    });

    if (itemExists) {
      const requestBody = req.body; // Assuming you have access to req.body containing the updated data

      const update = {};
      for (const key in requestBody) {
        update['items.$.' + key] = requestBody[key];
      }

      await CartModel.findOneAndUpdate(
        {
          seller: req.seller.id,
          'items.product': product,
        },
        {
          $set: update,
        },
        { new: true, runValidators: true },
      );
    } else {
      cartItems.items.push(req.body);
      await cartItems.save();
    }
  } else {
    await CartModel.create({ seller: req.seller.id, items: [{ ...req.body }] });
  }

  res.status(200).json({
    success: true,
  });
});


//@route   : POST /api/v1/carts/:productId
//@access  : seller only
//@details : delete a item from the cart
const deleteCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const cartItems = await CartModel.findOneAndUpdate(
    {
      seller: req.seller.id,
      'items.product': productId,
    },
    { $pull: { items: { product: productId } } },
    { new: true, runValidators: true },
  );

  res.status(201).json({
    success: true,
    body: { cartItems },
  });
});

module.exports = {
  getCartItems,
  addAndUpdateCartItem,
  deleteCartItem,
};
