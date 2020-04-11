const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");

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

// Cookie Parser

app.use(cookieParser());

app.get("/", (req, res) => {
    res.redirect("/petition");
});

// GET /petition

app.get("/petition", (req, res) => {
    // no cookie is set
    if (!req.cookies.cookie) {
        res.render("petition");
    } else {
        // cookie is set
        res.redirect("/thanks");
    }
});

// POST /petition

app.post("/petition", (req, res) => {
    // parsed input values
    let first = req.body.first;
    let last = req.body.last;
    let signature = req.body.signature;
    if (first != "" && last != "" && signature != "") {
        // insert the data as values in my signatures table
        db.getFullName(first, last, signature)
            .then(() => {
                console.log("That worked!");
            })
            .catch((err) => {
                console.log("Error in getFullName: ", err);
            });
        // set cookie & redirect
        res.cookie("cookie", "signed");
        res.redirect("/thanks");
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
    if (req.cookies.cookie) {
        db.countSupports()
            .then((result) => {
                console.log("Supporters have been counted: ", result);
                return result;
            })
            .then((result) => {
                res.render("thanks", { number: result });
            })
            .catch((err) => {
                console.log("Error in countSupports: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

// GET /signers

app.get("/signers", (req, res) => {
    // if a cookie is set, render
    if (req.cookies.cookie) {
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
