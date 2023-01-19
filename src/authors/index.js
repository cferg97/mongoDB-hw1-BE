import express from "express";
import createHttpError from "http-errors";
import authorsModel from "./model.js";

const authorsRouter = express.Router();

authorsRouter.post("/", async (req, res, next) => {
  try {
    const newAuthor = new authorsModel(req.body);
    const { _id } = await newAuthor.save();
    res.status(201).send({ _id });
  } catch (err) {
    next(err);
  }
});

authorsRouter.get("/", async (req, res, next) => {
  try {
    const authors = await authorsModel.find();
    res.send(authors);
  } catch (err) {
    next(err);
  }
});

authorsRouter.get("/:authorid", async (req, res, next) => {
  try {
    const author = await authorsModel.findById(req.params.authorid);
    if (author) {
      res.send(author);
    } else {
      next(
        createHttpError(404, `Author is id ${req.params.authorid} not found`)
      );
    }
  } catch (err) {
    next(err);
  }
});

authorsRouter.put("/:authorid", async (req, res, next) => {
  try {
    const updatedAuthor = await authorsModel.findByIdAndUpdate(
      req.params.authorid,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedAuthor) {
      res.send(updatedAuthor);
    } else {
      createHttpError(404, `Author with id ${req.params.authorid} not found`);
    }
  } catch (err) {
    next(err);
  }
});

authorsRouter.delete("/:authorid", async (req, res, next) => {
  try {
    const deletedAuthor = await authorsModel.findByIdAndDelete(
      req.params.authorid
    );
    if (deletedAuthor) {
      res.status(204).send();
    } else {
      next(
        createHttpError(404, `Author with id ${req.params.authorid} not found`)
      );
    }
  } catch (err) {
    next(err);
  }
});

export default authorsRouter;
