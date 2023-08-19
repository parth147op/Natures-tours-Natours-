const path = require('path');
//const pug = require('pug');
const ejs = require('ejs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");
const dotenv = require('dotenv');
const cors = require('cors');
const mongoSantize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieparser = require('cookie-parser');
const app = express();
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//Serving static files
app.use(express.static(path.join(__dirname,"public")));
//app.use(express.static(__dirname));

const helmet = require('helmet');
const mongoose = require('mongoose');
const viewsRoutes = require('./routes/viewsRoutes');
const tourRoutes = require('./routes/tours');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const hpp = require('hpp');
dotenv.config({path:'./config.env'});

app.use(cors({
    origin:'localhost:3000',
}))
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  })
// Set security HTTP headers
app.use(helmet({
    contentSecurityPolicy: false,
}
)); 
app.use(cookieparser());
// app.use((req, res, next) => {
//     //req.requestTime = new Date().toISOString();
//     console.log(req.headers);
//     next();
//   });

// Limiting requests from same api 
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
})
app.use('/api', limiter);

app.use(morgan('dev'));

//Body parser, reading data from body into req.body
app.use(express.json({limit:'10kb'}));

//Data sanitization against NoSql query injection
app.use(mongoSantize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp(
    {
        whitelist:[
            'duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price'
        ]
    }
));
app.use((req,res,next)=>{
    console.log(req.cookies);
    next();
})
// app.get('/',(req,res)=>{
//     res.status(200).render('base',{
//         tour:"abcd"
//     });
// })
app.use('/',viewsRoutes);
app.use('/api/v1/tours',tourRoutes);
app.use('/api/v1/users',userRoutes);
app.use('/api/v1/reviews',reviewRoutes);

const port = process.env.PORT||5000;
var DB = process.env.DATABASE.replace('<username>',process.env.DATABASE_USERNAME);
DB=DB.replace('<password>',process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then(()=>console.log(`DB connection successfull!!!`));
app.listen(port,()=>{
    console.log(`App running on port:${port}`);
});

//module.exports = app;