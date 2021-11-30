const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed. Please try again!",
      500
    );
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Failed to signing you up. Please recheck your inputs",
      422
    );

    return next(error);
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signing up failed. Please try again!", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "Signing up failed. This e-mail address is already used. Log in instead?",
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: "https://static.wikia.nocookie.net/breakingbad/images/0/05/Season_2_-_Jesse.jpg",
    password,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed. Please try again!", 500);
    return next(error);
  }

  res.status(201).json({
    user: createdUser.toObject({ getters: true }),
  });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Failed to logging you up. Please recheck your inputs",
      422
    );

    return next(error);
  }

  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Logging in failed. Please try again!", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "This e-mail address does not associated with any account. Please try again!",
      401
    );
    return next(error);
  }

  if (existingUser.password !== password) {
    const error = new HttpError(
      "Log in failed due to wrong password. Please try again!",
      401
    );
    return next(error);
  }

  res.status(200).json({
    message: "Logged in successfully!",
    user: existingUser.toObject({ getters: true }),
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
