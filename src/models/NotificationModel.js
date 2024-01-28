// importing mongoose
const mongoose = require('mongoose');

//creating schema
const notificationSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// automatically delete old documents when reaching the limit
notificationSchema.pre('save', async function (next) {
  const model = this.constructor;
  const count = await model.countDocuments({ userId: this.userId });
  limit = 2;
  if (count > limit) {
    const documentsToRemove = await model
      .find({ userId: this.userId })
      .sort({ createdAt: 1 })
      .limit(count - limit);
    const idsToRemove = documentsToRemove.map(doc => doc._id);
    await model.deleteMany({ _id: { $in: idsToRemove } });
  }
});

// automatically delete notification after 60 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 * 24 * 60 },
);

// creating model for schema
const NotificationModel = mongoose.model('Notification', notificationSchema);

module.exports = NotificationModel;
