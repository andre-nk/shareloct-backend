const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
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
  dotenv.config();

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

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Signing up failed. Please try again!", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed. Please try again!", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed. Please try again!", 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    token: token,
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

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Log in failed due to wrong password. Please try again!",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Logging in failed. Please try again!",
      500,
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  res.status(201).json({
    userId: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
