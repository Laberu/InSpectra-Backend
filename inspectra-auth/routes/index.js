var express = require("express");
var path = require("path");

// creating a router
var router = express.Router();

// configuring routes
router.get("/", function (req, res) {
  if (!req.session || !req.session.user) {
    return res.sendFile(path.join(__dirname, "../public/login.html"));
  }
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

module.exports = router;