const fs = require("fs");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordinatesForAddress = require("../utils/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while loading these places",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find place for the provided ID.",
      404
    );
    return next(error);
  }

  res.json({
    place: place.toObject({ getters: true }),
  });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while loading these places",
      500
    );
    return next(error);
  }

  if (userWithPlaces.places.length === 0) {
    const error = new HttpError(
      "Could not find any places for this user ID.",
      404
    );
    return next(error);
  }

  res.json({
    places: userWithPlaces.places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        "Failed to create place due to invalid inputs. Please recheck your inputs",
        422
      )
    );
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordinatesForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    image: req.file.path,
    address,
    location: coordinates,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find the user.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find the user for provided ID", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    await user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not create this place. Please try again",
      500
    );
    return next(error);
  }

  res.status(201).json({
    place: createdPlace,
  });
};

const patchPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Failed to update place due to invalid inputs. Please recheck your inputs",
      422
    );

    return next(error);
  }

  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update this place.",
      500
    );
    return next(error);
  }

  if(place.creator.toString() !== req.userData.userId){
    const error = new HttpError(
      "You are not allowed to update this place.",
      403
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update this place.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    place: place.toObject({ getters: true }),
  });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete this place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find place for the provided ID.",
      404
    );
    return next(error);
  }

  if(place.creator.id !== req.userData.userId){
    const error = new HttpError(
      "You are not allowed to delete this place.",
      403
    );
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete this place",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({
    message: `${place.title} deleted!`,
  });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.patchPlace = patchPlace;
exports.deletePlace = deletePlace;
