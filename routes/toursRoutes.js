const express = require('express');
const tourControler = require('./../controlers/toursController');
const authController = require('./../controlers/authController');

const reviewRoutes = require('./../routes/reviewRoutes');

const router = express.Router();
// router.param('id', tourControler.cheskID);

router.use('/:tourId/reviews', reviewRoutes);

router
  .route('/top-tours')
  .get(tourControler.aliasTopTours, tourControler.getAllToures);

router.route('/tour-stats').get(tourControler.getTourStats);

router.get(
  '/tour-within/:distance/center/:latlng/unit/:unit',
  tourControler.getToursWithin
);

router.get('/distance/:latlng/unit/:unit', tourControler.getToursDistance);

router
  .route('/tour-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourControler.getMounthelyPlan
  );

router
  .route('/')
  .get(tourControler.getAllToures)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControler.createToure
  );

router
  .route('/:id')
  .get(tourControler.getOneToures)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControler.updateToure
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControler.deleteToure
  );

module.exports = router;
