const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  //This middleware has to verify if the user has been authenticated, if not, we don't want the user to access certain routes/resources
  //Retrieving the token out of the cookies, becoz during logins, we save the token in cookies
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }
  //Now, if we reach here, we know user has token, so now we will VERIFY if its the correct one or some fake self generated token.
  //Below decoded data contains the id, that we initially provided while signing JWT.
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.id);

  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }
    next();
  };
};
