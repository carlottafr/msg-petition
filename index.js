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
        // cookie is set
    } else {
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
        db.getFullName(first, last)
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
        (first == "" && last == "" && signature == "placeholder")
    ) {
        // render the petition template with error helper
        res.render("petition", { error: true });
    }
});
// GET /thanks

app.get("/thanks", (req, res) => {
    // if a cookie is set, render
    if (req.cookies.cookie) {
        res.render("thanks");
        // if not, redirect
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => console.log("Express server is at your service."));
