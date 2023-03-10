import express from "express";
import createHttpError from "http-errors";
import authorsModel from "./model.js";
import q2m from "query-to-mongo";
import { basicAuthMiddleware } from "../lib/auth/basicAuth.js";
import { createAccessToken } from "../lib/auth/tools.js";
import { JWTAuthMiddleware } from "../lib/auth/jwtAuth.js";
import passport from "passport";

const authorsRouter = express.Router();

// authorsRouter.post("/", async (req, res, next) => {
//   try {
//     const newAuthor = new authorsModel(req.body);
//     const { _id } = await newAuthor.save();
//     res.status(201).send({ _id });
//   } catch (err) {
//     next(err);
//   }
// });

authorsRouter.post("/register", async (req, res, next) => {
  try {
    const newAuthor = new authorsModel(req.body);
    const { email } = await newAuthor.save();
    res.status(201).send({ email });
  } catch (err) {
    next(err);
  }
});

authorsRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
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

authorsRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authorsRouter.get(
  "/googleRedirect",
  passport.authenticate("google", { session: false }),
  async (req, res, next) => {
    console.log(req.author);
    res.redirect(`http://localhost:3000?accessToken=${req.user.accessToken}`);
  }
);

authorsRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
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

authorsRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const authorPosts = await authorsModel
      .findById(req.author._id)
      .select({ _id: 0, firstName: 0, lastName: 0 })
      .populate({
        path: "posts",
        select: "title content comments",
      });
    if (authorPosts) {
      res.send(authorPosts);
    }
  } catch (err) {
    next(err);
  }
});

authorsRouter.get("/:authorid", JWTAuthMiddleware, async (req, res, next) => {
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

authorsRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const author = await authorsModel.checkCredentials(email, password);
    if (author) {
      const payload = { _id: author._id };
      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    }
  } catch (err) {
    next(createHttpError(401, "Credentials not ok."));
  }
});

authorsRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
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
