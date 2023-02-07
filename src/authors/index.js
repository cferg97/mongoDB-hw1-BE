import express from "express";
import createHttpError from "http-errors";
import authorsModel from "./model.js";
import q2m from "query-to-mongo";
import { basicAuthMiddleware } from "../lib/auth/basicAuth.js";

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

authorsRouter.get("/", basicAuthMiddleware, async (req, res, next) => {
  // try {
  //   const authors = await authorsModel.find();
  //   res.send(authors);
  // } catch (err) {
  //   next(err);
  // }

  try {
    const mongoQuery = q2m(req.query);
    const { total, authors } = await authorsModel.findAuthorsWithPosts(
      mongoQuery
    );
    res.send({
      links: mongoQuery.links("http://localhost:3001/authors", total),
      total,
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      authors,
    });
  } catch (err) {
    next(err);
  }
});

authorsRouter.get("/me", basicAuthMiddleware, async (req, res, next) => {
  try {
    const me = await authorsModel.findById(req.author._id).populate({
      path: "posts",
      select: "title",
    });
    res.send(me);
  } catch (err) {
    next(err);
  }
});

authorsRouter.get("/:authorid", async (req, res, next) => {
  try {
    const author = await authorsModel.findById(req.params.authorid).populate({
      path: "posts",
      select: "title",
    });
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

authorsRouter.put("/me", basicAuthMiddleware, async (req, res, next) => {
  try {
    const updatedAuthor = await authorsModel.findByIdAndUpdate(
      req.author._id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (updatedAuthor) {
      res.send(updatedAuthor);
    } else {
      next(createHttpError(401, "You're not authorised to do this."));
    }
  } catch (err) {
    next(err);
  }
});

// authorsRouter.put("/:authorid", async (req, res, next) => {
//   try {
//     const updatedAuthor = await authorsModel.findByIdAndUpdate(
//       req.params.authorid,
//       req.body,
//       { new: true, runValidators: true }
//     );
//     if (updatedAuthor) {
//       res.send(updatedAuthor);
//     } else {
//       createHttpError(404, `Author with id ${req.params.authorid} not found`);
//     }
//   } catch (err) {
//     next(err);
//   }
// });

// authorsRouter.delete("/:authorid", async (req, res, next) => {
//   try {
//     const deletedAuthor = await authorsModel.findByIdAndDelete(
//       req.params.authorid
//     );
//     if (deletedAuthor) {
//       res.status(204).send();
//     } else {
//       next(
//         createHttpError(404, `Author with id ${req.params.authorid} not found`)
//       );
//     }
//   } catch (err) {
//     next(err);
//   }
// });

authorsRouter.delete("/me", basicAuthMiddleware, async (req, res, next) => {
  try {
    const deletedAuthor = await authorsModel.findByIdAndDelete(req.author._id);
    if (deletedAuthor) {
      res.status(204).send();
    } else {
      next(
        createHttpError(
          401,
          "You are not authorised to do this action. Check your log in details and try again."
        )
      );
    }
  } catch (err) {
    next(err);
  }
});

export default authorsRouter;
