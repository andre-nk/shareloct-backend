const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  dotenv.config();

  if(req.method === "OPTIONS"){
      return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("You are not authenticated to perform this action");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError(
      "You are not authenticated to perform this action",
      401
    );
    return next(error);
  }
};
