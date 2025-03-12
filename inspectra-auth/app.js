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
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connection is established successfully! 🎉");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();

// Trust proxy for secure cookies (important for AWS load balancers or reverse proxies)
app.set('trust proxy', 1);

// CORS setup
app.use(cors({
  origin: process.env.PRODUCTION === 'True' 
    ? process.env.CLIENT_ORIGIN_PRODUCTION 
    : process.env.CLIENT_ORIGIN_LOCAL,
  credentials: true,
}));

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: false, // Only save session if something is stored
  cookie: { 
    secure: process.env.PRODUCTION === 'True', // Use secure cookies in production
    httpOnly: true,                          // Prevent access via JavaScript
    sameSite: process.env.PRODUCTION === 'True' ? "None" : "Lax", 
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize Passport and session handling
app.use(passport.initialize());
app.use(passport.session());

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

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Listening on http://localhost:${port}`);
});
