const { Schema, model } = require("mongoose");

// defining the user schema
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function() {
            // Make password required only if the user is not logging in via Google
            return !this.googleId;
          },
    },
    googleId: { type: String, unique: true },
    verified: {
        type: Boolean,
        default: false,
    },
    refreshtoken: {
        type: String,
    },
});

// exporting the user model
module.exports = model("User", userSchema);