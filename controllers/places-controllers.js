const uuid = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordinatesForAddress = require("../utils/location");

const DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State Building",
    description: "One of the most famous sky scrapers in the world!",
    location: {
      lat: 40.7484445,
      lng: -73.9856646,
    },
    address: "20 W 34th St, New York, NY 10001",
    creator: "u1",
  },
  {
    id: "p2",
    title: "Empire Stat Building",
    description: "One of the most famous sky scrapers in the world!",
    location: {
      lat: 40.7484445,
      lng: -73.9856646,
    },
    address: "20 W 34th St, New York, NY 10001",
    creator: "u1",
  },
  {
    id: "p3",
    title: "Empire Sta Building",
    description: "One of the most famous sky scrapers in the world!",
    location: {
      lat: 40.7484445,
      lng: -73.9856646,
    },
    address: "20 W 34th St, New York, NY 10001",
    creator: "u2",
  },
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find((p) => p.id === placeId);

  if (!place) {
    throw new HttpError("Could not find place for the provided ID.", 404);
  }

  res.json({
    place,
  });
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const places = DUMMY_PLACES.filter((p) => p.creator === userId);

  if (places.length === 0) {
    throw new HttpError("Could not find any places for this user ID.", 404);
  }

  res.json({
    places,
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Failed to create place due to invalid inputs. Please recheck your inputs", 422)
    )
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordinatesForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = {
    id: uuid.v4(),
    title,
    description,
    location: coordinates,
    address,
    creator,
  };

  DUMMY_PLACES.push(createdPlace);

  res.status(201).json({
    place: createdPlace,
  });
};

const patchPlace = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Failed to update place due to invalid inputs. Please recheck your inputs", 422);
  }

  const placeId = req.params.pid;
  const { title, description } = req.body;

  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);

  if (placeIndex >= 0) {
    updatedPlace.title = title;
    updatedPlace.description = description;

    DUMMY_PLACES[placeIndex] = updatedPlace;

    res.status(200).json({
      place: updatedPlace,
    });
  }

  throw new HttpError("Could not find place to patch for this ID", 404);
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;

  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);

  if (placeIndex >= 0) {
    DUMMY_PLACES.splice(placeIndex, placeIndex + 1);

    res.status(200).json({
      message: `${placeId} deleted!`,
    });
  }

  throw new HttpError("Could not find place to delete for this ID", 404);
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.patchPlace = patchPlace;
exports.deletePlace = deletePlace;
