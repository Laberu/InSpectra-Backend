const { sign } = require("jsonwebtoken");
// signing the access token
const createAccessToken = (id) => {
    const secret = process.env.ACCESS_TOKEN_SECRET; // Fallback secret
    // console.log('Access Token Secret:', secret);
    return sign({ id }, secret, {
        expiresIn: 15 * 60, // 15 minutes
    });
};

// signing the refresh token
const createRefreshToken = (id) => {
    const secret = process.env.REFRESH_TOKEN_SECRET; // Fallback secret
    // console.log('Refresh Token Secret:', secret);
    return sign({ id }, secret, {
        expiresIn: "90d", // 90 Days
    });
};

// sending the access token to the client
const sendAccessToken = (_req, res, accesstoken) => {
    res.json({
        accesstoken,
        message: "Sign in Successful 🥳",
        type: "success",
    });
};

// sending the refresh token to the client as a cookie
const sendRefreshToken = (res, refreshtoken) => {
    res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
    });
};

// password reset token
const createPasswordResetToken = ({ _id, email, password }) => {
    const secret = password;
    return sign({ id: _id, email }, secret, {
      expiresIn: 15 * 60, // 15 minutes
    });
  };

module.exports = {
    createAccessToken,
    createRefreshToken,
    createPasswordResetToken,
    sendAccessToken,
    sendRefreshToken,
};