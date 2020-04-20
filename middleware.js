module.exports.requireSignature = (req, res, next) => {
    if (!req.session.user.sigId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

module.exports.requireNoSignature = (req, res, next) => {
    if (req.session.user.sigId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

module.exports.requireLogOut = (req, res, next) => {
    if (req.session.user) {
        res.redirect("/petition");
    } else {
        next();
    }
};
