var express = require("express");
var path = require("path");

// creating a router
var router = express.Router();

// configuring routes
router.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// router.get("*", function (req, res) {
//   res.status(404).json({
//     error: "Page not found",
//     status: 404,
//     timestamp: new Date().toISOString(),
//   });
// });

module.exports = router;