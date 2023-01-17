import express from "express";
import createHttpError from "http-errors";
import postsModel from "./model.js";

const postsRouter = express.Router();

postsRouter.get("/", async (req, res, next) => {
  try {
    const posts = await postsModel.find();
    res.send(posts);
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/", async (req, res, next) => {
  try {
    const newPost = new postsModel(req.body);
    const { _id } = await newPost.save();
    res.status(201).send({ _id });
  } catch (err) {
    next(err);
  }
});

postsRouter.get("/:postid", async (req, res, next) => {
  try {
    const post = await postsModel.findById(req.params.postid);
    if (post) {
      res.send(post);
    } else {
      next(
        createHttpError(404, `Post with id ${req.params.postid} not found.`)
      );
    }
  } catch (err) {
    next(err);
  }
});

postsRouter.put("/:postid", async (req, res, next) => {
  try {
    const updatedPost = await postsModel.findByIdAndUpdate(
      req.params.postid,
      req.body,
      { new: true, runValidators: true }
    );

    if (updatedPost) {
      res.send(updatedPost);
    } else {
      next(
        createHttpError(404, `Post with id ${req.params.postid} not found.`)
      );
    }
  } catch (err) {
    next(err);
  }
});

postsRouter.delete("/:postid", async (req, res, next) => {
  try {
    const deletedPost = await postsModel.findByIdAndDelete(req.params.postid);
    if (deletedPost) {
      res.status(204).send();
    } else {
      next(
        createHttpError(
          404,
          `Cannot delete post with id ${req.params.postid} as it does not exist`
        )
      );
    }
  } catch (err) {
    next(err);
  }
});

export default postsRouter;
