import GoogleStrategy from "passport-google-oauth20";
import authorsModel from "../../authors/model.js";
import { createAccessToken } from "./tools.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/authors/googleRedirect",
  },
  async (_, __, profile, passportNext) => {
    try {
      const { email, given_name, family_name } = profile._json;

      const author = await authorsModel.findOne({ email });

      if (author) {
        const accessToken = await createAccessToken({ _id: author._id });

        passportNext(null, { accessToken });
      } else {
        const newAuthor = new authorsModel({
          firstName: given_name,
          lastName: family_name,
          email,
          googleId: profile.id,
        });

        const createdAuthor = await newAuthor.save();

        const accessToken = await createAccessToken({ _id: createdAuthor._id });

        passportNext(null, { accessToken });
      }
    } catch (err) {
      console.log(err);
      passportNext(err);
    }
  }
);

export default googleStrategy;
