const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    res.render("petition");
});

app.post("/petition", (req, res) => {
    console.log("Request body first name: ", req.body.first);
    let first = req.body.first;
    let last = req.body.last;
    db.getFullName(first, last)
        .then(() => {
            console.log("That worked!");
        })
        .catch((err) => {
            console.log("Error in getFullName: ", err);
        });
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
