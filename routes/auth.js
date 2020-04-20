const { requireLogOut } = require("../middleware");
const { app } = require("../index");
const { hash, compare } = require("../bc");
const db = require("../db");

app.get("/register", requireLogOut, (req, res) => {
    res.render("register");
});

// POST /register

app.post("/register", requireLogOut, (req, res) => {
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

// GET /login

app.get("/login", requireLogOut, (req, res) => {
    const { user } = req.session;
    if (user) {
        res.redirect("/petition");
    } else {
        res.render("login");
    }
});

// POST /login

app.post("/login", requireLogOut, (req, res) => {
    let first, last, databasePw, id;
    let { email, pw } = req.body;
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
            return compare(pw, databasePw);
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
            } else {
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
                    } else {
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
