const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);

router.route('/forgotpassword').post(authController.forgotPassword);
router.route('/resetpassword/:token').patch(authController.resetPassword);

router.use(authController.protect);
//the belew routes can only be accessed if the user is authenticated

//upload.single('photo'),
router.route('/updatepassword').patch(authController.updatePassword);
router
  .route('/updateMe')
  .patch(userController.uploadUserPhoto, userController.updateMe);
router.route('/deleteMe').delete(userController.deleteMe);
router
  .route('/me')
  //getting current user id from protect middleware => assigning it to the id of the param => calling the get user middleware where the id is the current user id
  .get(userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));
//the belew routes can only be accessed if the user is an admin

router.route('/').get(userController.getAllUsers);
// .post(userController.createNewUser);

router
  .route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser)
  .patch(userController.updateUser);

module.exports = router;
