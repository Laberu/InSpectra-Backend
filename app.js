require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const indexRouter = require("./routes/index.js");
const authRouter = require("./routes/auth.js");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");

// Connecting to the database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connection is established successfully! 🎉");
  });

const app = express();

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // If you're using HTTPS, set this to true
}));

// Set up Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  function (accessToken, refreshToken, profile, done) {
    // Here you would usually find or create a user in your database
    return done(null, profile);
  }
));

// Passport serialization and deserialization
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize Passport and session handling
app.use(passport.initialize());
app.use(passport.session()); // Important: This is required to use sessions with Passport

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/auth", authRouter);

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`🚀 Listening on port ${port}`);
});
