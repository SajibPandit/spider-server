const catchAsync = require('../utils/catchAsync');
const AuctionModel = require('../models/AuctionModel');
const ProductModel = require('../models/ProductModel');

//@route   : GET /api/v1/auction/:productId
//@access  : public
//@details : get all auction data of a product
const getProductAuctionData = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const { sortBy, limit = 10, skip = 0 } = req.query;
  let sort = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    sort.offeredPrice = parts[1] === 'desc' ? -1 : 1;
  }

  const auctionData = await AuctionModel.find({ product: productId })
    .sort(sort)
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate('seller');
  // .populate('product');

  res.status(200).json({
    success: true,
    body: { auctionData },
  });
});

//@route   : POST /api/v1/auction/:productId
//@access  : seller only
//@details : create auction data of a product
const createProductAuctionData = catchAsync(async (req, res, next) => {
  const { offeredPrice } = req.body;
  const { productId } = req.params;

  const product = await ProductModel.findById(productId);

  //product must need to be in auction
  if (product.isInAuction) {
    const auctionData = await AuctionModel.create({
      seller: req.seller.id,
      product: productId,
      offeredPrice,
    });

    //if this offered price is highest update the product data
    if (product.highestAuctionPrice < offeredPrice) {
      product.highestAuctionPrice = offeredPrice;
      product.highestAuctionPriceByBuyer = req.seller.id;

      await product.save();
    }

    res.status(201).json({
      success: true,
      body: { auctionData },
    });
  } else {
    res.status(400).json({
      success: false,
      message: "This product isn't in auction",
    });
  }
});

//@route   : PUT /api/v1/auction/:auctionId
//@access  : seller
//@details : update a acution price data of a product
const updateAuctionData = catchAsync(async (req, res, next) => {
  const { auctionId } = req.params;
  const { offeredPrice } = req.body;

  const auctionData = await AuctionModel.findOneAndUpdate(
    { _id: auctionId, seller: req.seller.id },
    { offeredPrice },
    { new: true },
  );

  const product = await ProductModel.findById(auctionData.product);
  //if this offered price is highest update the product data
  if (product.highestAuctionPrice < offeredPrice) {
    product.highestAuctionPrice = offeredPrice;
    product.highestAuctionPriceByBuyer = req.seller.id;

    await product.save();
  }

  res.status(201).json({
    success: true,
    body: { auctionData },
  });
});

//@route   : DELETE /api/v1/auction/:auctionId
//@access  : seller only
//@details : delete a auction data of a product
const deleteAuctionData = catchAsync(async (req, res, next) => {
  const { auctionId } = req.params;
  const auctionData = await AuctionModel.findOneAndDelete({
    _id: auctionId,
    seller: req.seller.id,
  });

  if (!auctionData) {
    return res.json({
      success: false,
      body: {
        message: 'You are not allowed to delete this data',
      },
    });
  }

  //check the deleted aucton price is the highest price or not.if highest update product data with new value
  const product = await ProductModel.findById(auctionData.product);
  if (
    product.highestAuctionPrice == auctionData.offeredPrice &&
    product.highestAuctionPriceByBuyer.toString() ==
      auctionData.seller.toString()
  ) {
    const newAuctionData = await AuctionModel.find({ product: product._id })
      .sort('-offeredPrice')
      .limit(1);

    product.highestAuctionPrice = newAuctionData[0]?.offeredPrice;
    await product.save();
  }

  res.status(200).json({
    success: true,
  });
});

//@route   : PUT /api/v1/handle/:productId
//@access  : seller only
//@details : enable or disable auction data of a product
const handleProductAuction = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await ProductModel.findByIdAndUpdate(productId, req.body, {
    new: true,
  });

  res.status(200).json({
    success: true,
    body: { product },
  });
});

//@route   : GET /api/v1/auction/:sellerId/:productId
//@access  : public
//@details : get all auction of a single product of a seller
const getSellerAuctionDataOfAProduct = catchAsync(async (req, res, next) => {
  const { sellerId, productId } = req.params;

  const auctionData = await AuctionModel.find({
    seller: sellerId,
    product: productId,
  }).sort('-offeredPrice');

  res.status(200).json({
    success: true,
    body: { auctionData },
  });
});

module.exports = {
  getProductAuctionData,
  createProductAuctionData,
  updateAuctionData,
  deleteAuctionData,
  handleProductAuction,
  getSellerAuctionDataOfAProduct,
};
