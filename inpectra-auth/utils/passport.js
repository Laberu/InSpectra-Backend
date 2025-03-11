require("dotenv").config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user'); // Adjust the path as needed

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    // If the user doesn't exist, create a new one
    if (!user) {
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
      });
      await user.save();
    }

    return done(null, user); // Successful login, return user
  } catch (error) {
    return done(error, null); // Error handling
  }
}));

// Serialize and deserialize the user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
