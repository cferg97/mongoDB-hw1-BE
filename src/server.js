import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import mongoose from "mongoose";
import postsRouter from "./blog/index.js";
import authorsRouter from "./authors/index.js";
import {
  badRequestHandler,
  genericErrorHandler,
  notFoundHandler,
  unauthorizedError,
  forbiddenErrorHandler,
} from "./errorHandler.js";
import googleStrategy from "./lib/auth/googleAuth.js";
import passport from "passport";

const server = express();
const port = process.env.PORT;

passport.use("google", googleStrategy);

server.use(cors());
server.use(express.json());
server.use(passport.initialize());

server.use("/posts", postsRouter);
server.use("/authors", authorsRouter);

server.use(unauthorizedError);
server.use(forbiddenErrorHandler);
server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("Connected to DB");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port ${port}`);
  });
});
