import mongoose from "mongoose";

const { Schema, model } = mongoose;

const authorsSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    posts: [{type: Schema.Types.ObjectId, ref: "blogPosts.posts"}]
  },
  {
    timestamps: true,
  }
);


authorsSchema.static("findAuthorsWithPosts", async function (query) {
  const total = await this.countDocuments(query.criteria);

  const authors = await this.find(query.criteria, query.options.fields)
    .skip(query.options.skip)
    .limit(query.options.limit)
    .sort(query.options.sort)
    .populate({
      path: "posts",
      select: "title",
    });

  return { total, authors };
});

export default model("blogposts.authors", authorsSchema);
