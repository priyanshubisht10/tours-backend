const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getAll = (Model, filter) =>
  catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; //allow nested GET request
    const features = new APIFeatures(Model.find(filter), req.query) //creating a new APIfeatures object
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // let doc = await features.query.explain();
    let doc = await features.query;
    // console.log(doc);
    // console.log(req.requestTime);

    res.status(200).json({
      status: 'success',
      time: req.requestTime,
      results: doc.length,
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id); //looks for id in the tours collection and then deletes it and returns the deleted tour in this

    if (!doc) {
      return next(new appError('No document found with that id', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      //updating tours using mongoose function
      new: true,
      runValidators: true,
    });

    if (!doc) {
      //tour here is the updated tour
      return next(new appError(`No document found for the given id`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const newDoc = await Model.create(req.body); // creating a new document in the Model collection and return it as a object
    res.status(201).json({
      status: 'success',
      data: {
        newDoc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;

    if (!doc) {
      //return error if tour does not exist
      return next(new appError(`Document not found for this id`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });
