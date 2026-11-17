import mongoose from "mongoose";

let connectionPromise;

/** Reuses the active Mongoose connection and any in-flight connection attempt. */
export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const pendingConnection = mongoose.connection.readyState === 2
      ? mongoose.connection.asPromise()
      : mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      });

    connectionPromise = pendingConnection
      .then(() => mongoose.connection)
      .finally(() => {
        connectionPromise = null;
      });
  }

  return connectionPromise;
}

export default connectToDatabase;