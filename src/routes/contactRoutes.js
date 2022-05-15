const contactRouter = require('express').Router();
const { adminRestrict } = require('../middlewares/auth-guards/adminRestrict');
const {
  updateContact,
  getContact,
} = require('../controllers/contactController');

contactRouter.route('/').get(getContact).post(adminRestrict, updateContact);

module.exports = contactRouter;
