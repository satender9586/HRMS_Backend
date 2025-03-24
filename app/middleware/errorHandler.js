const { constant } = require("../lib/constants.js");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  switch (statusCode) {
    case constant.VALIDATION_ERROR:
      res.status(statusCode).json({
        title: "Validation Failed",
        message: err.message,
        stackTrace:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      break;
    case constant.UNAUTHORIZED:
      res.status(statusCode).json({
        title: "Unauthorized",
        message: err.message,
        stackTrace:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      break;
    case constant.FORBIDDEN:
      res.status(statusCode).json({
        title: "Forbidden",
        message: err.message,
        stackTrace:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      break;

    case constant.NOT_FOUND:
      res.status(statusCode).json({
        title: "Not found",
        message: err.message,
        stackTrace:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      break;
    case constant.SERVER_ERROR:
      res.status(statusCode).json({
        title: "server error",
        message: err.message,
        stackTrace:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      break;

    default:
      console.error(err);
      res.status(statusCode).json({
        title: "An error occurred",
        message: err.message,
        stackTrace:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
      break;
  }
};

module.exports = errorHandler;
