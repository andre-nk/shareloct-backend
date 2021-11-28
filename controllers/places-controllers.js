const uuid = require('uuid');

const HttpError = require("../models/http-error");

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

const createPlace = (req, res, next) => {
  const { title, description, coordinates, address, creator } = req.body;

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
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
