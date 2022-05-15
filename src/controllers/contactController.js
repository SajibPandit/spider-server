const ContactModel = require('../models/ContactModel');

const updateContact = async (req, res) => {
  await ContactModel.deleteMany({});
  const contact = await ContactModel.create(req.body);
  res.status(201).json({
    success: true,
    body: { contact },
  });
};

const getContact = async (req, res) => {
  const contact = await ContactModel.findOne();
  res.status(200).json({
    success: true,
    body: { contact },
  });
};

module.exports = {
  updateContact,
  getContact,
};
