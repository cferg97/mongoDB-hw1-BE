import express from "express";
import createHttpError from "http-errors";
import postsModel from "./model.js";
import q2m from "query-to-mongo";
import authorsModel from "../authors/model.js";
import { basicAuthMiddleware } from "../lib/auth/basicAuth.js";
import { JWTAuthMiddleware } from "../lib/auth/jwtAuth.js";

const postsRouter = express.Router();

postsRouter.get("/", async (req, res, next) => {
  // try {
  //   const posts = await postsModel.find();
  //   res.send(posts);
  // } catch (err) {
  //   next(err);
  // }
  try {
    const mongoQuery = q2m(req.query);
    const { total, posts } = await postsModel.findPostsWithAuthors(mongoQuery);
    res.send({
      links: mongoQuery.links("http://localhost:3001/posts", total),
      total,
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      posts,
    });
  } catch (err) {
    next(err);
  }
});

postsRouter.get("/:postid/comments", async (req, res, next) => {
  try {
    const post = await postsModel.findById(req.params.postid);
    if (post) {
      res.send(post.comments);
    } else {
      next(createHttpError(404, `Post with id ${req.params.id} not found.`));
    }
  } catch (err) {
    next(err);
  }
});

postsRouter.get("/:postid/comments/:commentid", async (req, res, next) => {
  try {
    const post = await postsModel.findById(req.params.postid);
    if (post) {
      const postComment = post.comments.find(
        (comment) => comment._id.toString() === req.params.commentid
      );

      if (postComment) {
        res.send(postComment);
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentid} not found.`
          )
        );
      }
    } else {
      next(
        createHttpError(
          404,
          `Comment with id ${req.params.commentid} not found.`
        )
      );
    }
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const newPost = new postsModel({
      ...req.body,
      author: req.author,
    });
    if (newPost) {
      await authorsModel.findByIdAndUpdate(
        req.author._id,
        {
          $push: { posts: newPost._id },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }
    const { _id } = await newPost.save();
    res.status(201).send({ _id });
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/:postid/comments", async (req, res, next) => {
  try {
    const comment = await postsModel.findById(req.params.postid, { _id: 0 });
    if (comment) {
      const commentToInsert = { ...req.body, addedOn: new Date() };

      const postWithComment = await postsModel.findByIdAndUpdate(
        req.params.postid,
        { $push: { comments: commentToInsert } },
        { new: true, runValidators: true }
      );
      if (postWithComment) {
        res.send(postWithComment);
      } else {
        next(
          createHttpError(404, `Post with id ${req.params.postid} not found`)
        );
      }
    } else {
      next(createHttpError(404, `Post with id ${req.params.postid} not found`));
    }
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

postsRouter.put("/:postid/comments/:commentid", async (req, res, next) => {
  try {
    const post = await postsModel.findById(req.params.postid);
    if (post) {
      const index = post.comments.findIndex(
        (comment) => comment._id.toString() === req.params.commentid
      );
      if (index !== -1) {
        post.comments[index] = {
          ...post.comments[index].toObject(),
          ...req.body,
          updatedOn: new Date(),
        };
        await post.save();
        res.send(post);
      }
    } else {
      next(createHttpError(404, `Comment not found`));
    }
  } catch (err) {
    next(err);
  }
});

postsRouter.delete("/:postid", basicAuthMiddleware, async (req, res, next) => {
  try {
    const post = postsModel.findById(req.params.postid);
    if (post.exists({ author: req.author._id })) {
      await postsModel.findByIdAndDelete(req.params.postid);
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

postsRouter.delete("/:postid/comments/:commentid", async (req, res, next) => {
  try {
    const updatedPost = await postsModel.findByIdAndUpdate(
      req.params.postid,
      { $pull: { comments: { _id: req.params.commentid } } },
      { new: true }
    );
    if (updatedPost) {
      res.send(updatedPost);
    } else {
      next(createHttpError(404, `Post not found`));
    }
  } catch (err) {
    next(err);
  }
});

export default postsRouter;
