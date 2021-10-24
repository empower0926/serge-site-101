const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("./models/user");

function initPassport(passport) {
  const authUser = async (email, password, done) => {
    const user = await getUserByEmail(email);
    if (user == null) {
      return done(null, false, {
        message: "we cannot find any user for this email address",
      });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        // password match
        return done(null, user);
      } else {
        // password did not match
        return done(null, false, { message: "password is incorrect" });
      }
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authUser));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    return done(null, await getUserById(id));
  });
}

async function getUserByEmail(email) {
  const user = await User.findOne({ email: email }).exec();
  return user;
}

async function getUserById(id) {
    return await User.findById(id).exec();
}

module.exports = {
  initPassport,
};
