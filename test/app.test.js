const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const indexRouter = require("../routes/index");
const authRouter = require("../routes/auth");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/auth", authRouter);

// Test Suite
describe("Express App", () => {

  // Test for the index route
  it("should return a 200 status and message on the root route", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("Hello Express!! 👋");
  });

  // Test for the /auth route
//   it("should return a 200 status on the /auth route", async () => {
//     const res = await request(app).get("/auth");
//     expect(res.statusCode).toEqual(200);
//     expect(res.body).toHaveProperty("auth", true); // Adjust based on actual auth response
//   });

  // Test for an undefined route
  it("should return a 404 for undefined routes", async () => {
    const res = await request(app).get("/unknown");
    expect(res.statusCode).toEqual(404);
  });
});
