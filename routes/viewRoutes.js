const express = require('express');

const viewsController = require('./../controlers/viewsController');
const authController = require('./../controlers/authController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewsController.getOverview);

router.get(
  '/tours/:tourName',
  authController.isLoggedIn,
  viewsController.getTour
);

router.get('/login', authController.isLoggedIn, viewsController.getLoginFrom);

router.get('/account', authController.protect, viewsController.getUserInfo);

// THIS ROUTE HANDLE THE SUBMITION OF THE FORM THAT UPDATE THE USER DATA
// WITHOUT API
router.post(
  '/submit-user-date',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
