export default function errorHandler(error, _request, response, _next) {
  const isFileTooLarge = error.code === "LIMIT_FILE_SIZE";
  const statusCode = isFileTooLarge ? 413 : error.statusCode || (error.name === "MulterError" ? 400 : 500);
  const message = isFileTooLarge
    ? "Image is too large. The maximum upload size is 3 MB."
    : statusCode === 500
      ? "An unexpected server error occurred."
      : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    status: "error",
    message,
  });
}
