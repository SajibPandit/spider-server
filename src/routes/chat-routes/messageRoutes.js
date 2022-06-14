'use strict';

const {
  getMessagesOfConversation,
  createMessage,
  deleteMessageById,
} = require('../../controllers/chat-controllers/messageController');

const {
  sellerRestrict,
} = require('../../middlewares/auth-guards/sellerRestrict');

const messageRouter = require('express').Router();

messageRouter.route('/').post(sellerRestrict, createMessage);
messageRouter
  .route('/:id')
  .get(sellerRestrict, getMessagesOfConversation)
  .delete(sellerRestrict, deleteMessageById);

module.exports = messageRouter;
