const express = require("express");
const router = express.Router();
const db = require("../db");
const { hash } = require("../bc");

// GET /profile

router.get("/", (req, res) => {
    res.render("profile");
});

// POST /profile

router.post("/", (req, res) => {
    const { user } = req.session;
    let { age, city, url } = req.body;
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

// GET /profile/edit

router.get("/edit", (req, res) => {
    const { user } = req.session;
    db.displayInfo(user.userId).then((result) => {
        res.render("edit", {
            result,
        });
    });
});

// POST /profile/edit
// brace yourselves...

router.post("/edit", (req, res) => {
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
                // set a cookie for a success message on GET /thanks
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

module.exports = router;
