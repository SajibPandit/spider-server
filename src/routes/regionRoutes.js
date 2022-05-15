// crud routes for region

const {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
} = require('../controllers/regionController');

const regionRouter = require('express').Router();

regionRouter
  .route('/')
  .get(sellerRestrict, getRegions)
  .post(sellerRestrict, createRegion);

regionRouter
  .route('/:regionId')
  .put(sellerRestrict, updateRegion)
  .delete(sellerRestrict, deleteRegion);
