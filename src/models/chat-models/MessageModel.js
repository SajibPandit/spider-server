// Importing mongoose and Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a schema
const messageSchema = new Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    image: String,
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Creating model from a Schema
const MessageModel = mongoose.model('Message', messageSchema);

module.exports = MessageModel;
