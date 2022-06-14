'use strict';

const {
  getSellerConversations,
  createConversation,
  getConversationById,
  deleteConversationById,
} = require('../../controllers/chat-controllers/conversationController');

const {
  adminRestrict,
} = require('../../middlewares/auth-guards/adminRestrict');
const {
  sellerRestrict,
} = require('../../middlewares/auth-guards/sellerRestrict');

const conversationRouter = require('express').Router();

conversationRouter
  .route('/')
  .get(sellerRestrict, getSellerConversations)
  .post(sellerRestrict, createConversation);
conversationRouter
  .route('/:id')
  .get(sellerRestrict, getConversationById)
  .delete(sellerRestrict, deleteConversationById);

module.exports = conversationRouter;
