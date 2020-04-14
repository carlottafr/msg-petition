const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");

// Handlebars

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        // v cookie becomes invalid after 2 weeks
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

// Serve /public files

app.use(express.static("./public"));

// Request body parser

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.get("/", (req, res) => {
    // console.log("Session cookie when first created: ", req.session);
    // req.session.msg = "bigSecret99";
    // req.session.permission = true;
    // console.log("Session cookie after value is set: ", req.session);
    res.redirect("/petition");
});

// GET /petition

app.get("/petition", (req, res) => {
    // no cookie is set
    // if (!req.cookies.cookie) {
    const { id } = req.session;
    if (id) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
    // } else {
    // cookie is set
    // res.redirect("/thanks");
    // }
});

// POST /petition

app.post("/petition", (req, res) => {
    // parsed input values
    let first = req.body.first;
    let last = req.body.last;
    let signature = req.body.signature;
    if (first != "" && last != "" && signature != "") {
        // insert the data as values in my signatures table
        db.getSupport(first, last, signature)
            .then((result) => {
                // console.log("That worked, here is the ID: ", result.rows[0].id);
                // set ID cookie
                req.session.id = result.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("Error in getSupport: ", err);
            });
    } else if (
        // there is either an error or
        req.statusCode != 200 ||
        // the values are empty
        (first == "" && last == "" && signature == "")
    ) {
        // render the petition template with error helper
        res.render("petition", { error: true });
    }
});

// GET /thanks

app.get("/thanks", (req, res) => {
    // if a cookie is set, render with total number of supporters
    const { id } = req.session;
    let supportNumbers;
    if (id) {
        db.countSupports()
            .then((result) => {
                // console.log("Supporters have been counted: ", result);
                supportNumbers = result;
            })
            .catch((err) => {
                console.log("Error in countSupports: ", err);
            });
        db.getSignature(id)
            .then((result) => {
                res.render("thanks", {
                    signature: result,
                    number: supportNumbers,
                });
            })
            .catch((err) => {
                console.log("Error in getSignature: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

// GET /signers

app.get("/signers", (req, res) => {
    // if a cookie is set, render
    const { id } = req.session;
    if (id) {
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
        // if not, redirect
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => console.log("Express server is at your service."));
