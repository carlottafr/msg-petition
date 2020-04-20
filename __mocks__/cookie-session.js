let tempSession,
    session = {};

module.exports = () => (req, res, next) => {
    req.session = tempSession || session;
    tempSession = null;
    next();
};
// can exist in multiple tests
module.exports.mockSession = (sess) => (session = sess);
// exists only in one test
module.exports.mockSessionOnce = (sess) => (tempSession = sess);
