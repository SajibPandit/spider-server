const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');
const { sellerRestrict } = require('../middlewares/auth-guards/sellerRestrict');

const {
  getProductAuctionData,
  createProductAuctionData,
  updateAuctionData,
  deleteAuctionData,
  handleProductAuction,
  getSellerAuctionDataOfAProduct
} = require('../controllers/auctionController');

const auctionRouter = require('express').Router();

auctionRouter
  .route('/handle/:productId')
  .put(adminRestrict, handleProductAuction);

auctionRouter.route('/:sellerId/:productId').get(getSellerAuctionDataOfAProduct)

auctionRouter
  .route('/:productId')
  .get(getProductAuctionData)
  .post(sellerRestrict, createProductAuctionData);

auctionRouter
  .route('/:auctionId')
  .put(sellerRestrict, updateAuctionData)
  .delete(sellerRestrict, deleteAuctionData);

module.exports = auctionRouter;
