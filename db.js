const spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// ^ returns an object with one method: .query
// .query("SQL query string").then(function(result) {}).catch(function(err) {blabla});

module.exports.getFullName = (first, last) => {
    return db.query(`INSERT INTO signatures (first, last) VALUES ($1, $2)`, [
        first,
        last,
    ]);
};

// module.exports.getCities = () => {
//     return db.query(`SELECT * FROM cities`);
// };

module.exports.addCity = (city, country) => {
    return db.query(
        `
    INSERT INTO cities (city, country) VALUES ($1, $2)
    `,
        [city, country]
    );
};
