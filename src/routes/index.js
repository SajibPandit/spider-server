('use strict');
// Importing the app error class
const AppError = require('../utils/appError');
const adminRouter = require('./auth-routes/adminRoutes');
const sellerRouter = require('./auth-routes/sellerRoutes');
const categoryRouter = require('./categoryRoutes');
const feedbackRouter = require('./feedbackRoutes');
const productRouter = require('./productRoutes');
const reportRouter = require('./reportRoutes');
const reviewRouter = require('./reviewRoutes');
const uploadRouter = require('./uploadRoutes');
const contactRouter = require('./contactRoutes');
const termsAndConditionsRouter = require('./termsAndConditionsRoutes');
const auctionRouter = require('./auctionRoutes');
const shippingAddressRouter = require('./shippingAddressRoutes');
const orderRouter = require('./orderRoutes');
const cartRouter = require('./cartRoutes')
const conversationRouter = require('./chat-routes/conversationRoutes');
const messageRouter = require('./chat-routes/messageRoutes');
const keywordRouter = require('./keywordRoutes');


// Importing express router
const router = require('express').Router();

// Registering all routers
router.use('/admins', adminRouter);
router.use('/sellers', sellerRouter);
router.use('/upload', uploadRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/reports', reportRouter);
router.use('/reviews', reviewRouter);
router.use('/feedbacks', feedbackRouter);
router.use('/terms', termsAndConditionsRouter);
router.use('/contact', contactRouter);
router.use('/auction', auctionRouter);
router.use('/shipping-address',shippingAddressRouter)
router.use('/orders',orderRouter)
router.use('/carts',cartRouter)
router.use('/keywords',keywordRouter)

router.use('/conversations', conversationRouter);
router.use('/message', messageRouter);

// The 404 route
router.all('*', (req, res, next) =>
  next(new AppError('No Such Endpoint', 404)),
);

module.exports = router;
