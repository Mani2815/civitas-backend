/**
 * Async wrapper to avoid try-catch blocks in every controller
 * Wraps async route handlers and passes errors to Express error handler
 */
const asyncWrapper = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncWrapper;
