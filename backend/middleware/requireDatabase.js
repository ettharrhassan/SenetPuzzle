
import { connectToDatabase } from "../config/db.js";

export default async function requireDatabase(_request, _response, next) {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    error.statusCode = 503;
    next(error);
  }
}
