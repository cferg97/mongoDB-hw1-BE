import mongoose from "mongoose";

const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String, required: false },
    readTime: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    author: {
      name: { type: String, required: false },
      avatar: { type: String, required: false },
    },
    content: { type: String, required: true },
    comments: [
      {
        comment: { type: String, required: true },
        addedOn: Date,
        updatedOn: Date,
      },
    ],
  },
  { timestamps: true }
);

export default model("blogPosts.posts", postSchema);
