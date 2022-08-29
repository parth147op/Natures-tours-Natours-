const Tour = require("../models/tour");
const factory = require("./handleFactory");
const multer = require('multer');

const multerStorage = multer.memoryStorage();
const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true);
  }
  else{
    cb(console.log("Not an image! Please upload only images"),false);
  }
}

const uploadImages = multer({
  storage:multerStorage,
  fileFilter:multerFilter
})
exports.uploadImages = uploadImages.fields([{name:'images',maxCount:3},{name:'imageCover',maxCount:1}]);
class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const queryObj = { ...this.queryString };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach(el => delete queryObj[el]);
  
      // 1B) Advanced filtering
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
      this.query = this.query.find(JSON.parse(queryStr));
  
      return this;
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort('-createdAt');
      }
  
      return this;
    }
  
    limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ');
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select('-__v');
      }
  
      return this;
    }
  
    paginate() {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
  
      return this;
    }
}
exports.aliasTopCheapTours = (req,res,next)=>{
    req.query.limit = 5;
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}
exports.getTours = async (req, res) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    res.status(201).json({
      status: "success",
      results:tours.length,
      data: {
        tours: tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err,
    });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tour = await Tour.findById(tourId).populate('reviews');
    res.status(201).json({
      status: `success`,
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err,
    });
  }
};
exports.createTour = async (req, res) => {
  try {  
    //eyJhbGciOiJIUzI1NiIsInRS
    //console.log(req.files);
    if(req.user.role==='lead-guide' || req.user.role==='admin'){
      const newTour = await Tour.create(req.body);
      return res.status(201).json({
        status: "success",
        data: {
        tour: newTour,
        },
      });
    }
    return res.status(403).json({
      status: `fail`,
      message: `You do not have permission to perform this action.`,
    });
    
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err,
    });
  }
};
exports.updateTour = async (req, res) => {
  try {
    req.body.imageCover = req.files.imageCover[0].originalname;
    console.log(req.files.images);
    const imagesCopy = [];
    req.files.images.forEach((image)=>{
      imagesCopy.push(image.originalname);  
    })
    console.log(imagesCopy);
    req.body.images = imagesCopy;
    const tourId = req.params.id;
    const tour = await Tour.findByIdAndUpdate(tourId, req.body);
    res.status(201).json({
      status: "success",
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err,
    });
  }
};
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = async (req, res) => {
//   try {
//     const tourId = req.params.id;
//     const tour = await Tour.findByIdAndDelete(tourId, req.body);
//     res.status(201).json({
//       status: "success",
//       data: {
//         message: `Deleted Successfully!!!`,
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: `fail`,
//       message: err,
//     });
//   }
// };
exports.getTourStats=async(req,res,next)=>{
    try{
        const stats = await Tour.aggregate([
            {
                $match:{ ratingsAverage:{ $gte:4.5 }}
            },
            {
                $group:{
                    _id:'$difficulty',
                    numTours:{$sum:1},
                    numRating:{ $sum:'$ratingsQuantity'},
                    avgRating:{ $avg:'$ratingsAverage'},
                    avgPrice:{$avg:'$price'},
                    minPrice:{$min:'$price'},
                    maxPrice:{$max:'$price'}
                },
            }
        ])
        res.status(201).json({
            status:`success1`,
            data:{
                stats
            }
        })
    }catch(err){
        res.status(400).json({
            status: `fail`,
            message: err,
          });
    }
}

exports.getMonthlyPlan = async(req,res,next)=>{
    try{
        const year = req.params.year*1;
        const plan = await Tour.aggregate([
            {
                $unwind:'$startDates'
            },
            {
                $match:{startDates:{
                    $gte:new Date(`${year}-01-01`),
                    $lte:new Date(`${year}-12-31`)
                }}
            },
            {
                $group:{
                    _id:{$month:'$startDates'},
                    numTourStarts:{$sum:1},
                    tours:{$push:'$name'},
                }
            },
            {
                $addFields:{month:'$_id'}
            },
            {
                $project:{
                    _id:0,
                    tours:1,
                    numTourStarts:1
                }
            },
            {
                $sort:{
                    numTourStarts:-1
                }
            }
        ])
        res.status(201).json({
            status:`success`,
            data:{
                plan
            }
        })
    }catch(err){
        res.status(400).json({
            status:`fail`,
            message:err
        })
    }
}