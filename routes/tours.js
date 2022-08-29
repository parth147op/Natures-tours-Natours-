const express = require("express");
const { protect, restrictTo } = require("../controllers/auth");
const router = express.Router();
const toursController = require("../controllers/tours");
const authController = require("../controllers/auth");
const reviewRoutes = require("./reviews");

router.use("/:tourId/reviews", reviewRoutes);
//router.param('id',toursController.checkID);
router
  .route("/top-5-cheapTours")
  .get(toursController.aliasTopCheapTours, toursController.getTours);
router.route("/tour-stats").get(toursController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(protect, toursController.getMonthlyPlan);
router
  .route("/")
  .get(toursController.getTours)
  .post(protect, restrictTo("admin", "lead-guide"), toursController.createTour);
router
  .route("/:id")
  .get(toursController.getTour)
  .patch(protect, restrictTo("admin", "lead-guide"),toursController.uploadImages,toursController.updateTour)
  .delete(
    protect,
    restrictTo("admin", "lead-guide"),
    toursController.deleteTour
  );

// router.route('/:tourId/reviews').post(authController.protect,reviewController.createReview);
module.exports = router;
