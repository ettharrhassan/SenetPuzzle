import mongoose from "mongoose";

export default function requireDatabase(_request, _response, next) {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error("The database is not connected. Start MongoDB and try again.");
    error.statusCode = 503;
    return next(error);
  }
  next();
}
