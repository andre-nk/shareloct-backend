const uuid = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "John Doe",
    email: "johndoe@gmail.com",
    password: "johndoe",
  },
];

const getUsers = (req, res, next) => {
  res.status(200).json({
    users: DUMMY_USERS,
  });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(
      "Failed to signing you up. Please recheck your inputs",
      422
    );
  }

  const { name, email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find((user) => {
    return user.email === email;
  });

  if (identifiedUser) {
    throw new HttpError(
      "An account with this e-mail address already exist. Try to log in?",
      401
    );
  }

  const newUser = {
    id: uuid.v4(),
    name,
    email,
    password,
  };

  DUMMY_USERS.push(newUser);

  res.status(201).json({
    user: newUser,
  });
};

const login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(
      "Failed to logging you up. Please recheck your inputs",
      422
    );
  }

  const { email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find((user) => {
    return user.email === email;
  });

  if (!identifiedUser) {
    throw new HttpError(
      "Could not identify user. Your e-mail address might be wrong",
      401
    );
  }

  if (identifiedUser.password !== password) {
    throw new HttpError(
      "Could not identify user. Your password might be wrong",
      401
    );
  }

  res.status(200).json({
    message: "Logged in successfully!",
    user: identifiedUser,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
