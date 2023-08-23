const express = require('express');

const userControler = require('./../controlers/usersController');
const authController = require('./../controlers/authController');

const router = express.Router();

router.route('/signup').post(authController.signup);

router.route('/login').post(authController.login);

router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);

router.patch('/resetPassword/:token', authController.resetPassword);

//protect the routes thet comme after this middelwear
router.use(authController.protect);

router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.patch(
  '/updateMe',
  userControler.uploadUserPhoto,
  userControler.resizeUserImage,
  userControler.updateMe
);

router.delete('/deleteMe', userControler.deleteMe);

router.get('/me', userControler.getMe, userControler.getOneUsers);

//thees routs needs to be used only by admins
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userControler.getAllUsers)
  .post(userControler.createUser);

router
  .route('/:id')
  .get(userControler.getOneUsers)
  .patch(userControler.updateUser)
  .delete(userControler.deleteUser);

module.exports = router;
