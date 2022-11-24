const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const ConversationModel = require('../../models/chat-models/ConversationModel');
const MessageModel = require('../../models/chat-models/MessageModel');

// messageRouter
//   .route('/')
//   .post(sellerRestrict, createMessage);
// messageRouter
//   .route('/:id')
//   .get(sellerRestrict, getMessagesOfConversation)
//   .delete(sellerRestrict, deleteMessageById);

// content: {
//     type: String,
//     trim: true,
//   },
//   image: String,
//   sender: {
//     type: Schema.Types.ObjectId,
//     ref: 'Seller',
//     required: true,
//   },
//   receiver: {
//     type: Schema.Types.ObjectId,
//     ref: 'Seller',
//     required: true,
//   },
//   conversationId: {
//     type: Schema.Types.ObjectId,
//     ref: 'Conversation',
//     required: true,
//   },

const createMessage = catchAsync(async (req, res, next) => {
  const { content, image, receiver, conversationId } = req.body;

  if (!receiver || !conversationId)
    return next(new AppError('Reciver or conversation id not provided', 400));

  const message = await MessageModel.create({
    ...req.body,
    sender: req.seller.id,
  });

  await ConversationModel.findOneAndUpdate({
    lastMessage: message._id,
  });

  global.io.of('/send_message').emit('new_message', message);

  res.status(201).json({
    success: true,
    body: { message },
  });
});

const getMessagesOfConversation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { limit, skip } = req.query;
  const messages = await MessageModel.find({
    conversationId: id,
  })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  if (!messages) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    body: { messages },
  });
});

const deleteMessageById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const message = await MessageModel.findOneAndDelete({ _id: id });

  if (!message) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
  });
});

module.exports = {
  createMessage,
  getMessagesOfConversation,
  deleteMessageById,
};
