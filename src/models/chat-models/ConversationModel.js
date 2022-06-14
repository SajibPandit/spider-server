// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema

const conversationSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    participent: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true },
);

// Creating model from a Schema
const ConversationModel = mongoose.model('Conversation', conversationSchema);

module.exports = ConversationModel;
