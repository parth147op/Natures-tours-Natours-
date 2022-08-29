const express = require('express');
const router = express.Router({ mergeParams:true});
const authController = require('../controllers/auth');
const reviewController = require('../controllers/reviews');
router.use(authController.protect);
router.route('/').get(reviewController.getAllReviews).post(reviewController.createReview);
router.route('/:id').get(reviewController.getSingleReviewofUser).delete(reviewController.deleteReview).patch(reviewController.updateReview);
router.route('/tours/:tourid').get(reviewController.getAllReviewsofTour);
module.exports = router;

