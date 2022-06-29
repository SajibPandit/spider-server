const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const ConversationModel = require('../../models/chat-models/ConversationModel');
const MessageModel = require('../../models/chat-models/MessageModel');

// conversationRouter
//   .route('/')
//   .get(sellerRestrict, getSellerConversations)
//   .post(sellerRestrict, createConversation);
// conversationRouter
//   .route('/:id')
//   .get(sellerRestrict, getConversationById)
//   .delete(sellerRestrict, deleteConversationById);

// creator: {
//     type: Schema.Types.ObjectId,
//     ref: 'Seller',
//     required: true,
//   },
//   participent: {
//     type: Schema.Types.ObjectId,
//     ref: 'Seller',
//     required: true,
//   },
//   lastMessage: {
//     type: Schema.Types.ObjectId,
//     ref: 'Message',
//   },

const getSellerConversations = catchAsync(async (req, res, next) => {
  const conversations = await ConversationModel.find({
    $or: [{ creator: req.seller.id }, { participent: req.seller.id }],
  })
    .populate({ path: 'creator', populate: 'seller' })
    .populate({ path: 'participent', populate: 'seller' })
    .populate({ path: 'lastMessage', populate: 'message'})
    .sort({"updatedAt":-1})

  if (!conversations) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    total: conversations.length,
    body: { conversations },
  });
});

const createConversation = catchAsync(async (req, res, next) => {
  const { participent } = req.body;

  const conversationExist = await ConversationModel.findOne({
    $or: [
      {
        creator: req.seller.id,
        participent: participent,
      },
      {
        creator: participent,
        participent: req.seller.id,
      },
    ],
  });

  if (conversationExist) {
    return res.status(200).json({
      success: true,
      body: { conversationExist },
    });
  }

  const conversation = await ConversationModel.create({
    participent,
    creator: req.seller.id,
  });

  if (!conversation) return next(new AppError('Not Found', 404));

  res.status(201).json({
    success: true,
    body: { conversation },
  });
});

const getConversationById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const conversation = await ConversationModel.findById(id)
    .populate('creator')
    .populate('participent');

  if (!conversation) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
    body: { conversation },
  });
});

const deleteConversationById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const conversation = await ConversationModel.findOneAndDelete({ _id: id });

  if (!conversation) return next(new AppError('Not Found', 404));

  res.status(200).json({
    success: true,
  });
});

module.exports = {
  getSellerConversations,
  createConversation,
  getConversationById,
  deleteConversationById,
};
