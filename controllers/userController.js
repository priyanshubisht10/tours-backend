const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
// const sharp = require('sharp');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
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

exports.uploadUserPhoto = upload.single('photo');

// exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) {
//     return next(); //move to the next middleware if there is no file attached
//   }

//   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; //adding the filename to the object

//   // await sharp(req.file.buffer)
//   //   .resize(500, 500)                            //only runs on node version 18.17.0 or above in linux
//   //   .toFormat('jpeg')
//   //   .jpeg({ quality: 90 })
//   //   .toFile(`public/img/users/${req.file.filename}`);

//   next();
// });

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]; //adding only those fields which were allowed to the new object
  });
  return newObj;
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: 'success',
//     users,
//   });
// });

exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  if (req.user.password || req.body.currentPassword)
    return next(
      new AppError(
        'This route does not support changing password! Use the route /updatepassword',
        400
      )
    );

  let filteredBody = filterObj(req.body, 'name', 'email'); //only name and email is left in the filteredbody obj

  if (req.file) filteredBody.photo = req.file.filename; //adding the filename of the photo to the obj

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false }); //setting the active field to false => user not active anymore

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// exports.createNewUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'route not defined',
//   });
// };

// exports.getUser = (req, res) => {
//   const id = req.id;
//   console.log(id);
//   res.status(500).json({
//     status: 'error',
//     message: 'route not defined',
//   });
// };

exports.getUser = factory.getOne(User);

// exports.updateUser = (req, res) => {
//   const id = req.id;
//   console.log(id);
//   res.status(500).json({
//     status: 'error',
//     message: 'route not defined',
//   });
// };

exports.updateUser = factory.updateOne(User);

// exports.deleteUser = (req, res) => {
//   const id = req.id;
//   console.log(id);
//   res.status(500).json({
//     status: 'error',
//     message: 'route not defined',
//   });
// };

exports.deleteUser = factory.deleteOne(User);
