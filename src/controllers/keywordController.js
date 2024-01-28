const SearchKeywordModel = require('../models/SearchKeywordModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

//@route   : GET /api/v1/keywords
//@access  : public
//@details : get all keywords
const getSearchKeywords = catchAsync(async (req, res, next) => {
  let {
    sortBy,
    limit = 10,
    skip = 0,
    maxDistance,
    longitude,
    latitude,
    searchKey,
    userId,
  } = req.query;

  const sort = {};

  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  let query = {};

  // get nearest products
  if (maxDistance && latitude && longitude) {
    query = {
      ...query,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance * 1000,
        },
      },
    };
  }

  if (searchKey) {
    searchKey = searchKey.trim();
    query = {
      ...query,
      $or: [
        { keyword: { $regex: searchKey, $options: 'i' } },
        { keyword: { $in: new RegExp(searchKey.split(' '), 'i') } },
      ],
    };
  }

  if (userId) {
    query = {
      ...query,
      seller: userId,
    };
  }

  const keywords = await SearchKeywordModel.find(query, [], {
    limit: parseInt(limit), // if limit is undefined then it will be ignored automatically
    skip: parseInt(skip),
    sort,
  });

  res.status(200).json({
    success: true,
    body: { keywords },
  });
});

module.exports = {
  getSearchKeywords,
};
