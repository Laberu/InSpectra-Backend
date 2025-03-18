var express = require("express");
var router = express.Router();
const passport = require('../utils/passport');
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
      // check if user already exists
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
    
        // 5. send the cookies for another apps
        res.cookie("accesstoken", accessToken, { httpOnly: true, secure: false, sameSite: "None" });
        res.cookie("refreshtoken", refreshToken, { httpOnly: true, secure: true, sameSite: "None" });
        res.cookie("email", email, { httpOnly: true, secure: true, sameSite: "None" });
        res.cookie("userid", user._id.toString(), { httpOnly: true, secure: true, sameSite: "None" });

        // 6. send the response
        sendRefreshToken(res, refreshToken);
        sendAccessToken(req, res, accessToken, user.email, user.id);

    } catch (error) {
        res.status(500).json({
            type: "error",
            message: "Error signing in!",
            error,
        });
    }
});

// Google OAuth Login Route
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
  
// Google OAuth Callback Route
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }), 
  async function(req, res) {
    try {

      const { email, googleId } = req.user;      

      let user = await User.findOne({ googleId });

      // If the user doesn't exist, create a new one
      if (!user) {
        user = new User({
          email: email,
          googleId: googleId,
          verified: true,
        });
        await user.save();
      }
  
      // Generate Access and Refresh Tokens
      const accessToken = createAccessToken(user._id);
      const refreshToken = createRefreshToken(user._id);

      res.cookie("accesstoken", accessToken, { httpOnly: true, secure: false, sameSite: "None" });
      res.cookie("refreshtoken", refreshToken, { httpOnly: true, secure: true, sameSite: "None" });
      res.cookie("email", email, { httpOnly: true, secure: true, sameSite: "None" });
      res.cookie("userid", user._id.toString(), { httpOnly: true, secure: true, sameSite: "None" });

      // Update the refresh token in the database
      user.refreshtoken = refreshToken;
      await user.save();

      // console.log(user);
  
      // Send the tokens to the client
      // sendRefreshToken(res, refreshToken);
      // sendAccessToken(req, res, accessToken);
      if (process.env.PRODUCTION === 'True') {
        return res.redirect(`${process.env.CLIENT_URL_PRODUCTION}/?token=${accessToken}&userid=${user._id}&email=${encodeURIComponent(email)}`);
      } else {
        return res.redirect(`${process.env.CLIENT_URL_LOCAL}/?token=${accessToken}&userid=${user._id}&email=${encodeURIComponent(email)}`);
      }

    } catch (error) {
      console.error("Error during Google OAuth callback:", error); // Log the error
      res.status(500).json({
        type: "error",
        message: "Error during Google OAuth!",
        error: error.message || error
      });
    }
  }
);

router.post("/logout", (_req, res) => {
    // clear cookies
    res.clearCookie("refreshtoken", { httpOnly: true, secure: true, sameSite: "None" });
    res.clearCookie("accesstoken", { httpOnly: true, secure: true, sameSite: "None" });
    res.clearCookie("email", { httpOnly: true, secure: true, sameSite: "None" });
    res.clearCookie("userid", { httpOnly: true, secure: true, sameSite: "None" });
    
    return res.json({
      message: "Logged out successfully! 🤗",
      type: "success",
    });
});
  
router.post("/", async (req, res) => {
    try {
        const { refreshtoken } = req.cookies;
        if (!refreshtoken)
          return res.status(500).json({
            message: "No refresh token! 🤔",
            type: "error",
        });

        let id;
        try {
            id = verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET).id;
        } catch (error) {
            return res.status(500).json({
                message: "Invalid refresh token! 🤔",
                type: "error",
            });
        }

        const user = await User.findById(id);
        if (!user || user.refreshtoken !== refreshtoken)
            return res.status(500).json({
            message: "Invalid refresh token! 🤔",
            type: "error",
        });

        const accessToken = createAccessToken(user._id);
        const refreshToken = createRefreshToken(user._id);
        user.refreshtoken = refreshToken;
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
      if (req.user)
        return res.json({
          message: "You are logged in! 🤗",
          type: "success",
          user: req.user,
        });
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
            error: err.message,
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

router.get("/get-user", (req, res) => {
  const email = req.cookies.email;
  const userid = req.cookies.userid;

  if (!email) {
    return res.status(401).json({ message: "No user found" });
  }

  res.json({ email, userid });
});


module.exports = router;
