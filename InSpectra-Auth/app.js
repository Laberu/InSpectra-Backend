require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const indexRouter = require("./routes/index.js");
const authRouter = require("./routes/auth.js");
const mongoose = require("mongoose");
const passport = require('passport');
const path = require("path");
const cors = require("cors");

// Connecting to the database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connection is established successfully! 🎉");
  });

const app = express();

if (process.env.PRODUCTION === 'True') {
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN_PRODUCTION,
    credentials: true 
  }));
} else {
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN_LOCAL,
    credentials: true
  }));
}

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    sameSite: "lax",
  } // If you're using HTTPS, set this to true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize Passport and session handling
app.use(passport.initialize());
app.use(passport.session()); // Important: This is required to use sessions with Passport

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/get-user", (req, res) => {
  if (!req.cookies.email) {
      return res.status(401).json({ message: "No user found" });
  }
  res.json({
      email: req.cookies.email,
      userid: req.cookies.userid
  });
});

app.use("/auth", authRouter);

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`🚀 Listening on http://localhost:${port}`);
});
