const Tour = require("../models/tour");
const authController = require('../controllers/auth');
exports.getOverview = async(req,res,next)=>{
    console.log(res.locals.user);
    if(res.locals.user == undefined){
        res.status(400).render('login');
    }
    const tours = await Tour.find();
    res.status(200).render('overview',{
        title:'All tours',
        tours
    })
}
exports.getTour = async (req, res) => {
    if(res.locals.user == undefined){
        res.status(400).render('login');
    }
      const tourId = req.params.id;
      const tour = await Tour.findById(tourId).populate('reviews');
      res.status(200).render('tour',{
        title:`${tour.name} Tour`,
        tour
      });
  };

  exports.getLogin = async(req,res)=>{
      res.status(200).render('login',{
            title:`Login`,
      })
  }

  exports.getSignup = async(req,res)=>{
      res.status(200).render('signup',{
          title:'Signup'
      })
  }
  exports.getUserDetails = async(req,res)=>{
      res.status(200).render('user-details',{
          title:`Me`
      })
  }