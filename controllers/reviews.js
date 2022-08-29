const Review = require('../models/review');
const factory = require('./handleFactory');
exports.getAllReviews = async(req,res,next)=>{
    let filter={};
    if(req.params.tourId) filter={tour:req.params.tourId};
    const reviews = await Review.find(filter);
    res.status(201).json({
        status:`success`,
        data:{
            noofreviews:reviews.length,
            reviews:reviews
        }
    })
}
exports.createReview = async(req,res,next)=>{
    if(req.user.role !== 'user'){
        return res.status(403).json({
            status:`fail`,
            message:`Only users can give reviews!!!!`
        })
    }
    const reviewexist = Review.find({user:req.user._id});
    if(reviewexist){
        return res.status(403).json({
            status:`fail`,
            message:`User has already reviewed this tour!!!!`
        })
    }
    else{
        //console.log(req.user);
    req.body.tour = req.params.tourId;
    req.body.user = req.user._id; 
    const newReview = await Review.create(req.body);
    res.status(201).json({
        status:`success`,
        data:{
            review:newReview
        }
    })
    }
    
    
}
exports.getSingleReviewofUser = async(req,res,next)=>{
    const review = await Review.findById(req.params.reviewId);
    res.status(201).json({
        status:`success`,
        data:{
            review:review
        }
    })
}
exports.getAllReviewsofUser = async(req,res,next)=>{
    const reviews = await Review.find({user:req.user._id});
    res.status(201).json({
        status:`success`,
        data:{
            noofreviews:reviews.length,
            reviews:reviews
        }
    })
}
exports.getAllReviewsofTour = async(req,res,next)=>{
    const reviews = await Review.find({tour:req.params.tourid});
    res.status(201).json({
        status:`success`,
        data:{
            noofreviews:reviews.length,
            reviews:reviews
        }
    })
}
exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = async(req,res,next)=>{
    
    const updateReview = await Review.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    });
    if(!updateReview){
        return res.status(404).json({
            status:`fail`,
            message:`No document found with that ID`,
        })
    }
    res.status(200).json({
        status:`success`,
        message:`Review Updated!!!!!`,
        data:{
            data:updateReview
        }
    })
}