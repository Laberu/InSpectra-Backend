var express = require("express");
var router = express.Router();
const bcrypt = require('bcryptjs');
const User = require("../models/user");
const { hash } = require("bcryptjs");
const { isProtected } = require("../utils/protected");
const { verify } = require("jsonwebtoken");
const {
    createAccessToken,
    createRefreshToken,
    createPasswordResetToken,
    sendAccessToken,
    sendRefreshToken,
} = require("../utils/tokens");
const {
    transporter,
    createPasswordResetUrl,
    passwordResetTemplate,
    passwordResetConfirmationTemplate,
  } = require("../utils/email");


router.post("/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      // 1. check if user already exists
      const user = await User.findOne({ email: email });
  
      // if user exists already, return error
      if (user)
        return res.status(500).json({
          message: "User already exists! Try logging in. 😄",
          type: "warning",
        });
      // 2. if user doesn't exist, create a new user
      // hashing the password
      const passwordHash = await hash(password, 10);
      const newUser = new User({
        email: email,
        password: passwordHash,
      });
      // 3. save the user to the database
      await newUser.save();
      // 4. send the response
      res.status(200).json({
        message: "User created successfully! 🥳",
        type: "success",
      });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: "Error creating user!",
        error,
      });
    }
  });

router.post("/signin", async (req, res) => {    
    try {
        const { email, password } = req.body;
        
        // 1. check if user exists
        const user = await User.findOne({ email: email });
        // console.log(user._id);
        
        // if user doesn't exist, return error
        if (!user)
            return res.status(500).json({
            message: "User doesn't exist! 😢",
            type: "error",
            });
        // 2. if user exists, check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        // console.log(isMatch);
        
        // if password is incorrect, return error
        if (!isMatch)
            return res.status(500).json({
            message: "Password is incorrect! ⚠️",
            type: "error",
            });
  
        // 3. if password is correct, create the tokens
        const accessToken = createAccessToken(user._id);
        const refreshToken = createRefreshToken(user._id);
        // console.log(accessToken, refreshToken);
    
        // 4. put refresh token in database
        user.refreshtoken = refreshToken;
        await user.save();
    
        // 5. send the response
        sendRefreshToken(res, refreshToken);
        sendAccessToken(req, res, accessToken);
    } catch (error) {
        res.status(500).json({
            type: "error",
            message: "Error signing in!",
            error,
        });
    }
});

router.post("/logout", (_req, res) => {
    // clear cookies
    res.clearCookie("refreshtoken");
    return res.json({
      message: "Logged out successfully! 🤗",
      type: "success",
    });
});
  
router.post("/", async (req, res) => {
    try {
        const { refreshtoken } = req.cookies;
        // if we don't have a refresh token, return error
        if (!refreshtoken)
        return res.status(500).json({
            message: "No refresh token! 🤔",
            type: "error",
        });
      // if we have a refresh token, you have to verify it
        let id;
        try {
            id = verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET).id;
        } catch (error) {
            return res.status(500).json({
                message: "Invalid refresh token! 🤔",
                type: "error",
            });
        }
        // if the refresh token is invalid, return error
        if (!id)
            return res.status(500).json({
            message: "Invalid refresh token! 🤔",
            type: "error",
            });
        // if the refresh token is valid, check if the user exists
        const user = await User.findById(id);
        // if the user doesn't exist, return error
        if (!user)
            return res.status(500).json({
                message: "User doesn't exist! 😢",
                type: "error",
            });
        // if the user exists, check if the refresh token is correct. return error if it is incorrect.
        if (user.refreshtoken !== refreshtoken)
            return res.status(500).json({
            message: "Invalid refresh token! 🤔",
            type: "error",
            });
        // if the refresh token is correct, create the new tokens
        const accessToken = createAccessToken(user._id);
        const refreshToken = createRefreshToken(user._id);
        // update the refresh token in the database
        user.refreshtoken = refreshToken;
        // send the new tokes as response
        sendRefreshToken(res, refreshToken);
        return res.json({
            message: "Refreshed successfully! 🤗",
            type: "success",
            accessToken,
        });
    } catch (error) {
        res.status(500).json({
            type: "error",
            message: "Error refreshing token!",
            error,
        });
    }
});

router.get("/protected", isProtected, async (req, res) => {
    try {
      // if user exists in the request, send the data
      if (req.user)
        return res.json({
          message: "You are logged in! 🤗",
          type: "success",
          user: req.user,
        });
      // if user doesn't exist, return error
      return res.status(500).json({
        message: "You are not logged in! 😢",
        type: "error",
      });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: "Error getting protected route!",
        error,
      });
    }
});

router.post("/send-password-reset-email", async (req, res) => {
    try {
        // get the user from the request body
        const { email } = req.body;
        // find the user by email        
        const user = await User.findOne({ email });
        // if the user doesn't exist, return error
        // console.log(user);
        
        if (!user)
            return res.status(500).json({
            message: "User doesn't exist! 😢",
            type: "error",
            });
        // create a password reset token
        const token = createPasswordResetToken({ _id: user._id, email: user.email , password:user.password});
        // create the password reset url
        const url = createPasswordResetUrl(user._id, token);
        // send the email
        const mailOptions = passwordResetTemplate(user, url);
        transporter.sendMail(mailOptions, (err, info) => {
            if (err)
            return res.status(500).json({
                message: "Error sending email! 😢",
                type: "error",
                error: err.message
            });
            return res.json({
                message: "Password reset link has been sent to your email! 📧",
                type: "success",
            });
        });        
    } catch (error) {
        res.status(500).json({
            type: "error",
            message: "Error sending email!",
            error,
        });
    }
});

router.post("/reset-password/:id/:token", async (req, res) => {
    try {
        const { id, token } = req.params;
        const { newPassword } = req.body;
        // find the user by id
        const user = await User.findById(id);
        // if the user doesn't exist, return error        
        if (!user)
            return res.status(500).json({
            message: "User doesn't exist! 😢",
            type: "error",
            });

        // verify if the token is valid
        let isValid;
        try {
            isValid = verify(token, user.password);
        } catch (error) {
            // If verification fails, return invalid token error
            return res.status(500).json({
                message: "Invalid token! 😢",
                type: "error",
            });
        }

        // set the user's password to the new password
        user.password = await hash(newPassword, 10);
        // save the user
        await user.save();
        // send the email
        const mailOptions = passwordResetConfirmationTemplate(user);
        transporter.sendMail(mailOptions, (err, info) => {
        if (err)
            return res.status(500).json({
                message: "Error sending email! 😢",
                type: "error",
            });
        return res.json({
            message: "Email sent! 📧",
            type: "success",
            });
        });
    } catch (error) {
        res.status(500).json({
            type: "error",
            message: "Error sending email!",
            error,
        });
    }
});

module.exports = router;
