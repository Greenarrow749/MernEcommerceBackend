const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter a your user name."],
    maxLength: [30, "Name must not exceed 30 characters."],
    minLength: [4, "Name must be more than 4 characters."],
  },
  email: {
    type: String,
    required: [true, "Please enter a your email address."],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email address."],
  },
  password: {
    type: String,
    required: [true, "Please enter your password."],
    minLength: [8, "Password must atleast have 8 characters."],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

//This will below fxn will work as an event hook(pre), that means prior to save event being executed, this fxn will run to encrypt pswd.
userSchema.pre("save", async function (next) {
  //Below line will just make sure that we don't re-hash the already hashed pswd when we are updating the userInfo in controller.
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//JWT creation
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//Comparison of password while login
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//Generation of a password reset token
userSchema.methods.getResetPasswordToken = function () {
  //Generating reset token
  const resetToken = crypto.randomBytes(20).toString("hex");
  //Hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
