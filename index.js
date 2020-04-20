const express = require("express");
const app = express();
exports.app = app;
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const profileRouter = require("./routes/profile");
const { requireSignature, requireNoSignature } = require("./middleware");

// Handlebars

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// Serve /public files

app.use(express.static("./public"));

// Request body parser

app.use(
    express.urlencoded({
        extended: false,
    })
);

// Cookie session

app.use(
    cookieSession({
        secret: `I'm actually quite happy.`,
        // v cookie becomes invalid after 2 weeks
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

// CSURF middleware

app.use(csurf());

// Prevent my app to be loaded in a frame
// and implement the csurf middleware in
// this middleware

app.use((req, res, next) => {
    res.set("X-Frame-Options", "deny");
    // add csrfToken with Token value to empty res.locals object
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user && req.url != "/register" && req.url != "/login") {
        res.redirect("/register");
    } else {
        next();
    }
});

// GET /

app.get("/", (req, res) => {
    res.redirect("/petition");
});

// requiring for the side effects

require("./routes/auth");

app.use("/profile", profileRouter);

// GET /petition

app.get("/petition", requireNoSignature, (req, res) => {
    res.render("petition");
});

// POST /petition

app.post("/petition", requireNoSignature, (req, res) => {
    // parsed input values
    let signature = req.body.signature;
    const { user } = req.session;
    if (signature != "") {
        // insert the data as values in my signatures table
        db.signSupport(signature, user.userId)
            .then((result) => {
                // console.log("That worked, here is the ID: ", result.rows[0].id);
                // set ID cookie
                user.sigId = result.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("Error in getSupport: ", err);
                res.render("petition", { error: true });
            });
    } else {
        // render the petition template with error helper
        res.render("petition", { error: true });
    }
});

// GET /thanks

app.get("/thanks", requireSignature, (req, res) => {
    // if a signature ID cookie is set, render with total number of supporters
    const { user } = req.session;
    let supportNumbers;
    db.countSupports()
        .then((result) => {
            supportNumbers = result;
        })
        .catch((err) => {
            console.log("Error in countSupports: ", err);
        });
    db.getSignature(user.sigId)
        .then((result) => {
            let thanks = {
                first: user.firstName,
                last: user.lastName,
                signature: result,
                number: supportNumbers,
            };
            // check for the cookie set after
            // profile/edit
            if (user.edit) {
                // delete the edit cookie
                delete user.edit;
                thanks.update = true;
                // render the thanks template
                // with success message
                res.render("thanks", {
                    thanks,
                });
            } else {
                // normal thanks render
                res.render("thanks", {
                    thanks,
                });
            }
        })
        .catch((err) => {
            console.log("Error in getSignature: ", err);
        });
});

// POST /thanks/delete

app.post("/thanks/delete", requireSignature, (req, res) => {
    const { user } = req.session;
    db.deleteSignature(user.userId)
        .then(() => {
            // delete signature ID cookie
            delete user.sigId;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("Error in deleteSignature: ", err);
        });
});

// GET /signers

app.get("/signers", requireSignature, (req, res) => {
    db.getSupporters()
        .then((result) => {
            return result.rows;
        })
        .then((results) => {
            res.render("signers", { supporters: results });
        })
        .catch((err) => {
            console.log("Error in getSupporters: ", err);
        });
});

// GET /signers/city

app.get("/signers/:city", requireSignature, (req, res) => {
    const city = req.params.city;
    db.supportersCity(city)
        .then((result) => {
            return result.rows;
        })
        .then((results) => {
            res.render("city", { place: city, citySupporters: results });
        })
        .catch((err) => {
            console.log("Error in supportersCity: ", err);
        });
});

// GET /logout

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

// server set-up: Heroku & local

app.listen(process.env.PORT || 8080, () =>
    console.log("Express server is at your service.")
);
