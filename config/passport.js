
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    async (email, password, done) => {
      try {
        const user = await User.findByEmail(email);

        if (!user) {
          return done(null, false, {
            message: "Invalid email or password"
          });
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordMatches) {
          return done(null, false, {
            message: "Invalid email or password"
          });
        }

        return done(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
