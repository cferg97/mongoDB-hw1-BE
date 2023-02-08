import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const authorsSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    posts: [{ type: Schema.Types.ObjectId, ref: "blogPosts.posts" }],
  },
  {
    timestamps: true,
  }
);

authorsSchema.pre("save", async function (next) {
  const currentAuthor = this;
  if (currentAuthor.isModified("password")) {
    const plainPW = currentAuthor.password;
    const hash = await bcrypt.hash(plainPW, 11);
    currentAuthor.password = hash;
  }
  next();
});

authorsSchema.methods.toJSON = function () {
  const authorDoc = this;
  const author = authorDoc.toObject();

  delete author.password;
  delete author.createdAt;
  delete author.updatedAt;
  delete author.__v;
  return author;
};

authorsSchema.static("checkCredentials", async function (email, password) {
  const author = await this.findOne({ email });
  if (author) {
    const passwordMatch = await bcrypt.compare(password, author.password);
    if (passwordMatch) {
      return author;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

authorsSchema.static("findAuthorsWithPosts", async function (query) {
  const total = await this.countDocuments(query.criteria);

  const authors = await this.find(query.criteria, query.options.fields)
    .skip(query.options.skip)
    .limit(query.options.limit)
    .sort(query.options.sort)
    .populate({
      path: "posts",
      select: "title cover createdAt updatedAt content",
    });

  return { total, authors };
});

export default model("blogposts.authors", authorsSchema);
