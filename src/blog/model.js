import mongoose from "mongoose";

const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String, required: false },
    readTime: {
      value: { type: String, required: true },
      unit: { type: String, required: true },
    },
    author: [{ type: Schema.Types.ObjectId, ref: "blogposts.authors" }],
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

postSchema.static("findPostsWithAuthors", async function (query) {
  const total = await this.countDocuments(query.criteria);

  const posts = await this.find(query.criteria, query.options.fields)
    .skip(query.options.skip)
    .limit(query.options.limit)
    .sort(query.options.sort)
    .populate({
      path: "author",
      select: "firstName lastName",
    });

  return { total, posts };
});

export default model("blogPosts.posts", postSchema);
