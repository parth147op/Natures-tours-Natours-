const express = require("express");
const userController = require("../controllers/users");
const authController = require("../controllers/auth");
const reviewController = require("../controllers/reviews");
const router = express.Router();
router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.route("/logout").post(authController.logout);
router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    userController.getUsers
  );
router
  .route("/:id")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    userController.getUser
  )
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    userController.updateUserData
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    userController.deleteUser
  );
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
router.patch(
  "/user/updateMyPassword",
  authController.protect,
  authController.updatePassword
);

router
  .route("/user/me")
  .get(authController.protect, userController.getCurrUser)
  .delete(authController.protect, userController.deleteMe)
  .patch(authController.protect,userController.uploadUserPhoto,userController.updateCurrUserData);
module.exports = router;
