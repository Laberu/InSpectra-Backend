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
    googleId: {
        type: String,
        required: false
      },
    verified: {
        type: Boolean,
        default: false,
    },
    refreshtoken: {
        type: String,
    },
});

userSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $ne: null } } });

// exporting the user model
module.exports = model("User", userSchema);