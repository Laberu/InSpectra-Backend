var express = require("express");

// creating a router
var router = express.Router();

// configuring routes
router.get("/", function (req, res) {
  // console.log("request", req)
  // console.log("response", res)
  // sending the response
  res.send("Hello Express!! 👋");
});

module.exports = router;