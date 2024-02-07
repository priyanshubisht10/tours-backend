const Tour = require('../models/tourModels');
const APIFeatures = require('../utils/apiFeatures');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/tours');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `tour-${req.id}-${Date.now()}.${ext}`);
  },
});

// const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Something went wrong while selecting the file. Please upload only images! ',
        400
      ),
      false
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter }); //created an upload object

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', max: 1 },
  { name: 'images', max: 3 },
]);

exports.resizeTourImages = (req, res, next) => {
  console.log(req.files);
  next();
};

exports.aliasTopTours = (req, res, next) => {
  //give values in the query
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,summary';
  next();
};

// exports.getAllTours = catchAsync(async (req, res) => {
//   const features = new APIFeatures(Tour.find(), req.query) //creating a new APIfeatures object
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const tours = await features.query;

//   // console.log(req.requestTime);

//   res.status(200).json({
//     status: 'success',
//     time: req.requestTime,
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

exports.getAllTours = factory.getAll(Tour);

// exports.updateTours = catchAsync(async (req, res) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     //updating tours using mongoose function
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     //tour here is the updated tour
//     return next(
//       new appError(`Tour with id: ${req.params.id} was not found`, 404)
//     );
//   }
//   res.status(200).json({
//     status: 'success',
//     data: { tour: tour },
//   });
// });

exports.updateTour = factory.updateOne(Tour);

// exports.createNewTour = catchAsync(async (req, res) => {
//   const newTour = await Tour.create(req.body); // creating a new-tour in the tours collection and return it as a object
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

exports.createNewTour = factory.createOne(Tour);

// exports.getTour = catchAsync(async (req, res) => {
//   // get the tour with the id and fetch the data of the guides from the User collection and inflate them in the guides field
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     //return error if tour does not exist
//     return next(
//       new appError(`Tour with id: ${req.params.id} was not found`, 404)
//     );
//   }
//   res.status(200).json({
//     status: 'success',
//     data: tour,
//   });
// });

exports.getTour = factory.getOne(Tour, 'reviews');

// exports.deleteTour = catchAsync(async (req, res) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id); //looks for id in the tours collection and then deletes it and returns the deleted tour in this

//   if (!tour) {
//     return next(
//       new appError(`Tour with id: ${req.params.id} was not found`, 404)
//     );
//   }
//   res.status(204).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, //matches for the given fields
    },
    {
      $group: {
        //group tours by difficulty and returns details about each tour
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQunatity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, //sorts by average price inside of the group
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  console.log(year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 6,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan: plan,
    },
  });
});

//37.425209, -122.170298
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(new appError("Couldn't process the provided coordinates", 400));
  }

  // console.log(lat, lng, distance, unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(new appError("Couldn't process the provided coordinates", 400));
  }

  // console.log(lat, lng, distance, unit);

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
