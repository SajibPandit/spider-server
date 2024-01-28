const { getSearchKeywords } = require('../controllers/keywordController');

const keywordRouter = require('express').Router();

keywordRouter.route("/").get(getSearchKeywords)

module.exports = keywordRouter;
