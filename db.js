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

module.exports.countSupports = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`).then((results) => {
        return results.rows[0].count;
    });
};

module.exports.getSupporters = () => {
    return db.query(`SELECT first, last FROM signatures;`);
};
