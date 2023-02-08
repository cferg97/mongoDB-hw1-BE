import mongoose from "mongoose";

export const badRequestHandler = (err, req, res, next) => {
  if (err.status === 400 || err instanceof mongoose.Error.ValidationError) {
    res.status(400).send({ message: err.message });
  } else if (err instanceof mongoose.Error.CastError) {
    res.status(400).send({
      message: "The _id entered is incorrect. Please check and try again.",
    });
  } else {
    next(err);
  }
};

export const unauthorizedError = (err, req, res, next) => {
  if (err.status === 401) {
    res.status(401).send({
      message: "Check your credentials and try again.",
    });
  } else {
    next(err);
  }
};

export const forbiddenErrorHandler = (err, req, res, next) => {
  if (err.status === 403) {
    res.status(403).send({ success: false, message: err.message });
  } else {
    next(err);
  }
};

export const notFoundHandler = (err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).send({ message: err.message });
  } else {
    next(err);
  }
};

export const genericErrorHandler = (err, req, res, next) => {
  console.log(err);
  res.status(500).send({ message: "Generic Server Error" });
};
