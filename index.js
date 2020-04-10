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

app.get("/petition", (req, res) => {
    if (!req.cookies.cookie) {
        res.render("petition");
    } else {
        res.redirect("/thanks");
    }
});

app.post("/petition", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let signature = req.body.signature;
    if (first != "" && last != "" && signature != "") {
        db.getFullName(first, last)
            .then(() => {
                console.log("That worked!");
            })
            .catch((err) => {
                console.log("Error in getFullName: ", err);
            });
        res.cookie("cookie", "signed");
        res.redirect("/thanks");
    } else if (
        req.statusCode != 200 ||
        (first == "" && last == "" && signature == "placeholder")
    ) {
        res.render("petition", { error: true });
    }
});

app.post("/add-city", (req, res) => {
    db.addCity("Guayaquil", "Ecuador")
        .then(() => {
            console.log("Yay that worked!");
        })
        .catch((err) => {
            console.log("Error in addCity: ", err);
        });
});

app.listen(8080, () => console.log("Express server is at your service."));
