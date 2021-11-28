const axios = require("axios");

const HttpError = require("../models/http-error");
const API_KEY = "pk.665fdd19f5cf30e9b00af00b7f1ab60c";

async function getCoordinatesForAddress(address) {
  const response = await axios.get(
    `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(
      address
    )}&format=json`
  );

  const data = response.data;

  if (!data) {
    const error = new HttpError("Could not find location for the address", 422);
    throw error;
  }

  const coordinates = {
    lat: data[0].lat,
    lng: data[0].lon,
  }

  return coordinates;
}

module.exports = getCoordinatesForAddress;
