/**
 * Centralized Error Handling Middleware
 */

const notFoundHandler = (req, res, next) => {
  res.status(404);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.json({ success: false, message: 'Resource Not Found (404)' });
  }
  res.render('404', {
    pageTitle: 'Page Not Found',
    path: req.originalUrl
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err.stack || err.message || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.json({
      success: false,
      message: err.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }

  res.render('500', {
    pageTitle: 'Server Error',
    message: err.message || 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

