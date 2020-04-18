const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hash, compare } = require("./bc");

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
        secret: `I'm always angry.`,
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

// GET /

app.get("/", (req, res) => {
    // check for a cookie and respond accordingly
    const { user } = req.session;
    if (user) {
        res.redirect("/petition");
    } else {
        res.redirect("/register");
    }
});

// GET /register

app.get("/register", (req, res) => {
    const { user } = req.session;
    if (user) {
        res.redirect("/petition");
    } else {
        res.render("register");
    }
});

// POST /register

app.post("/register", (req, res) => {
    let { first, last, email, password } = req.body;
    // check if all input fields have been filled
    if (first != "" && last != "" && email != "" && password != "") {
        hash(password)
            .then((hashedPw) => {
                return db.registerAccount(first, last, email, hashedPw);
            })
            .then((result) => {
                // create user-object as cookie
                // including user ID and full name
                req.session.user = {
                    firstName: first,
                    lastName: last,
                    userId: result.rows[0].id,
                };
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("Error in registerAccount: ", err);
                res.render("register", { error: true });
            });
    } else if (
        // if one of the fields is empty
        first == "" ||
        last == "" ||
        email == "" ||
        password == ""
    ) {
        // render the register template with error helper
        res.render("register", { error: true });
    }
});

// GET /profile

app.get("/profile", (req, res) => {
    // the good old cookie spiel
    const { user } = req.session;
    if (user) {
        res.render("profile");
    } else {
        res.redirect("/register");
    }
});

// POST /profile

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;
    const { user } = req.session;
    // check for bad URL
    // if (
    //     url != "" &&
    //     !url.startsWith("http://") &&
    //     !url.startsWith("https://")
    // ) {
    //     res.render("profile", { badUrl: true });
    //     // } else if (age == "" && city == "" && url == "") {
    //     //     // if the user has not entered anything,
    //     //     // redirect to petition
    //     //     res.redirect("/petition");
    // } else {
    db.addProfileInfo(age, city, url, user.userId)
        .then(() => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("Error in addProfileInfo: ", err);
            res.render("profile", { error: true });
        });
    // }
});

// GET /login

app.get("/login", (req, res) => {
    const { user } = req.session;
    if (user) {
        res.redirect("/petition");
    } else {
        res.render("login");
    }
});

// POST /login

app.post("/login", (req, res) => {
    let first, last, databasePw, id;
    let email = req.body.email;
    let inputPw = req.body.pw;
    db.checkLogin(email)
        .then((result) => {
            // get the full name, password and ID
            // from the database and store them
            first = result.rows[0].first;
            last = result.rows[0].last;
            databasePw = result.rows[0].password;
            id = result.rows[0].id;
            return databasePw;
        })
        .then((databasePw) => {
            return compare(inputPw, databasePw);
        })
        .then((matchValue) => {
            if (matchValue) {
                // create user cookie object and
                // give it the full name and user
                // ID stored from checkLogin
                req.session.user = {
                    firstName: first,
                    lastName: last,
                    userId: id,
                };
                return req.session.user.userId;
            } else if (!matchValue) {
                res.render("login", { error: true });
            }
        })
        .then((userId) => {
            // check for signature with user ID
            db.checkSignature(userId)
                .then((sigId) => {
                    if (sigId.rows[0].id) {
                        // store the signature ID in the cookie
                        req.session.user.sigId = sigId.rows[0].id;
                        res.redirect("/thanks");
                    } else if (!sigId.rows[0].id) {
                        res.redirect("/petition");
                    }
                })
                .catch((err) => {
                    console.log(
                        "Error in checkSignature for POST /login: ",
                        err
                    );
                });
        })
        .catch((err) => {
            console.log("Error in checkLogin: ", err);
            res.render("login", { error: true });
        });
});

// GET /petition

app.get("/petition", (req, res) => {
    // check for signature ID cookie
    const { user } = req.session;
    if (user.sigId) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

// POST /petition

app.post("/petition", (req, res) => {
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
            });
    } else if (
        // there is either an error or
        req.statusCode != 200 ||
        // there is no signature
        signature == ""
    ) {
        // render the petition template with error helper
        res.render("petition", { error: true });
    }
});

// GET /thanks

app.get("/thanks", (req, res) => {
    // if a signature ID cookie is set, render with total number of supporters
    const { user } = req.session;
    let supportNumbers;
    if (user.sigId) {
        db.countSupports()
            .then((result) => {
                supportNumbers = result;
            })
            .catch((err) => {
                console.log("Error in countSupports: ", err);
            });
        db.getSignature(user.sigId)
            .then((result) => {
                // check for the cookie set after
                // profile/edit
                if (user.edit) {
                    // delete the edit cookie
                    delete user.edit;
                    // render the thanks template
                    // with success message
                    res.render("thanks", {
                        first: user.firstName,
                        last: user.lastName,
                        signature: result,
                        number: supportNumbers,
                        update: true,
                    });
                } else {
                    // normal thanks render
                    res.render("thanks", {
                        first: user.firstName,
                        last: user.lastName,
                        signature: result,
                        number: supportNumbers,
                    });
                }
            })
            .catch((err) => {
                console.log("Error in getSignature: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

// GET /profile/edit

app.get("/profile/edit", (req, res) => {
    const { user } = req.session;
    db.displayInfo(user.userId).then((result) => {
        res.render("edit", {
            result,
        });
    });
});

// POST /profile/edit
// brace yourselves...

app.post("/profile/edit", (req, res) => {
    let { first, last, email, pw, age, city, url } = req.body;
    const { user } = req.session;
    if (pw != "") {
        // if there is an entered password,
        // bring out the big gears with a
        // full-on account update/upsert
        hash(pw).then((hashedPw) => {
            Promise.all([
                db.updateFullAccount(first, last, email, hashedPw, user.userId),
                db.upsertProfileInfo(age, city, url, user.userId),
            ])
                .then(() => {
                    // set a cookie for a success message
                    // on GET /thanks
                    // update the name in the cookie
                    user.edit = true;
                    user.firstName = first;
                    user.lastName = last;
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log("Error in full update: ", err);
                    // if there is an error, rerender the page
                    // with all existing info + error msg
                    db.displayInfo(user.userId)
                        .then((result) => {
                            result.error = true;
                            res.render("edit", {
                                result,
                            });
                        })
                        .catch((err) => {
                            console.log("Error in re-rendering /thanks: ", err);
                        });
                });
        });
    } else {
        // if there is no new password,
        // make a small-scale update
        Promise.all([
            db.updateAccountNoPw(first, last, email, user.userId),
            db.upsertProfileInfo(age, city, url, user.userId),
        ])
            .then(() => {
                // set a cookie for a success message
                // on GET /thanks
                // update the name in the cookie
                user.edit = true;
                user.firstName = first;
                user.lastName = last;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("Error in partial update: ", err);
                // if there is an error, rerender the page
                // with all existing info + error msg
                db.displayInfo(user.userId)
                    .then((result) => {
                        result.error = true;
                        res.render("edit", {
                            result,
                        });
                    })
                    .catch((err) => {
                        console.log("Error in re-rendering /thanks: ", err);
                    });
            });
    }
});

// POST /thanks/delete

app.post("/thanks/delete", (req, res) => {
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

app.get("/signers", (req, res) => {
    // if a cookie is set, render
    const { user } = req.session;
    if (user) {
        // check for signature
        if (user.sigId) {
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
        } else {
            // if no signature, back to signing!
            res.redirect("/petition");
        }
        // if no user cookie, back to registering
    } else {
        res.redirect("/register");
    }
});

// GET /signers/city

app.get("/signers/:city", (req, res) => {
    const { user } = req.session;
    // if a cookie is set, render
    if (user) {
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
    } else {
        res.redirect("/register");
    }
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
