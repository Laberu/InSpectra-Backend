require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const indexRouter = require("./routes/index.js");
const authRouter = require("./routes/auth.js");
const mongoose = require("mongoose");

// connecting to the database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connection is established successfully! 🎉");
  });

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/auth", authRouter);

app.listen(port, function () {
  console.log(`🚀 Listening on port ${port}`);
});